import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useSubscriptions } from "@/hooks/useSubscriptions"
import { supabase } from "@/lib/supabase"

export interface CreditsState {
  totalCredits: number
  usedCredits: number
  // Never below 0. Held sets can outweigh the budget (sets rented before the
  // server-side budget check, admin-created orders, a plan that dropped while
  // sets were held); the excess is reported separately in overBudgetCredits.
  remainingCredits: number
  overBudgetCredits: number
  // Part of usedCredits held by sets already returned this billing period;
  // it frees when the next period starts, at budgetFreesAt.
  returnedHeldCredits: number
  budgetFreesAt: string | null
  loading: boolean
}

const ANNUAL_PERIOD_THRESHOLD_MS = 40 * 86_400_000

function addUtcMonths(startMs: number, months: number): number {
  const d = new Date(startMs)
  const year = d.getUTCFullYear()
  const month = d.getUTCMonth() + months
  const day = d.getUTCDate()
  const targetMonthEnd = new Date(
    Date.UTC(
      year,
      month + 1,
      0,
      d.getUTCHours(),
      d.getUTCMinutes(),
      d.getUTCSeconds(),
      d.getUTCMilliseconds()
    )
  )
  return Date.UTC(
    year,
    month,
    Math.min(day, targetMonthEnd.getUTCDate()),
    d.getUTCHours(),
    d.getUTCMinutes(),
    d.getUTCSeconds(),
    d.getUTCMilliseconds()
  )
}

// Annual plans carry a 12-month Stripe period, but returned sets free on each
// monthly anniversary of current_period_start (matching public.used_credits).
function resolveBudgetFreesAt(
  periodStart: string | null | undefined,
  periodEnd: string | null | undefined
): string | null {
  if (!periodEnd) return null
  const startMs = periodStart ? Date.parse(periodStart) : Number.NaN
  const endMs = Date.parse(periodEnd)
  if (
    Number.isNaN(startMs) ||
    Number.isNaN(endMs) ||
    endMs - startMs <= ANNUAL_PERIOD_THRESHOLD_MS
  ) {
    return periodEnd
  }
  const nowMs = Date.now()
  for (let m = 1; m <= 12; m++) {
    const stepMs = addUtcMonths(startMs, m)
    if (stepMs > nowMs) {
      return new Date(Math.min(stepMs, endMs)).toISOString()
    }
  }
  return periodEnd
}

export function useCredits(): CreditsState {
  const { user, profile } = useAuth()
  const { subscriptions, loading: plansLoading } = useSubscriptions()
  const [usedCredits, setUsedCredits] = useState(0)
  const [heldCredits, setHeldCredits] = useState(0)
  const [budgetFreesAt, setBudgetFreesAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const totalCredits =
    profile?.status === "active"
      ? (subscriptions.find((s) => s.id === profile?.plan)?.credits ?? 0)
      : 0

  useEffect(() => {
    if (!user) {
      setUsedCredits(0)
      setHeldCredits(0)
      setBudgetFreesAt(null)
      setLoading(false)
      return
    }
    setLoading(true)
    // used_credits is the same rule the server checks a rental against.
    Promise.all([
      supabase.rpc("used_credits", { p_subscriber_id: user.id }),
      supabase
        .from("orders")
        .select("product_id, products(value)")
        .eq("subscriber_id", user.id)
        .not("status", "eq", "returned"),
      supabase
        .from("subscribers")
        .select("current_period_start, current_period_end")
        .eq("id", user.id)
        .maybeSingle(),
    ]).then(([used, held, sub]) => {
      const heldSum = (held.data ?? []).reduce(
        (acc, o) => acc + (o.products?.value ?? 0),
        0
      )
      if (used.error) console.error("used_credits failed:", used.error.message)
      // Fall back to held sets only, so a failed RPC never blocks renting.
      const usedTotal = used.error ? heldSum : Number(used.data ?? 0)
      setUsedCredits(usedTotal)
      // Without the held breakdown, don't claim any budget is waiting to free.
      if (held.error) console.error("Held orders failed:", held.error.message)
      setHeldCredits(held.error ? usedTotal : heldSum)
      setBudgetFreesAt(
        resolveBudgetFreesAt(
          sub.data?.current_period_start,
          sub.data?.current_period_end
        )
      )
      setLoading(false)
    })
  }, [user])

  // Until the profile and plans arrive the budget reads as 0, which would
  // briefly flag every held set as over budget.
  const isBudgetResolved = !user || (profile != null && !plansLoading)

  return {
    totalCredits,
    usedCredits,
    remainingCredits: Math.max(0, totalCredits - usedCredits),
    overBudgetCredits: isBudgetResolved
      ? Math.max(0, usedCredits - totalCredits)
      : 0,
    returnedHeldCredits: Math.max(0, usedCredits - heldCredits),
    budgetFreesAt,
    loading: loading || !isBudgetResolved,
  }
}
