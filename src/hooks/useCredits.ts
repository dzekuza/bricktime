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
        .select("current_period_end")
        .eq("id", user.id)
        .maybeSingle(),
    ]).then(([used, held, sub]) => {
      const heldSum = (held.data ?? []).reduce(
        (acc, o) => acc + (o.products?.value ?? 0),
        0
      )
      if (used.error) console.error("used_credits failed:", used.error.message)
      // Fall back to held sets only, so a failed RPC never blocks renting.
      setUsedCredits(used.error ? heldSum : Number(used.data ?? 0))
      setHeldCredits(heldSum)
      setBudgetFreesAt(sub.data?.current_period_end ?? null)
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
