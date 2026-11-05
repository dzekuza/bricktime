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
  loading: boolean
}

export function useCredits(): CreditsState {
  const { user, profile } = useAuth()
  const { subscriptions, loading: plansLoading } = useSubscriptions()
  const [usedCredits, setUsedCredits] = useState(0)
  const [loading, setLoading] = useState(true)

  const totalCredits =
    profile?.status === "active"
      ? (subscriptions.find((s) => s.id === profile?.plan)?.credits ?? 0)
      : 0

  useEffect(() => {
    if (!user) {
      setUsedCredits(0)
      setLoading(false)
      return
    }
    setLoading(true)
    supabase
      .from("orders")
      .select("product_id, products(value)")
      .eq("subscriber_id", user.id)
      .not("status", "eq", "returned")
      .then(({ data }) => {
        const sum = (data ?? []).reduce(
          (acc, o) => acc + (o.products?.value ?? 0),
          0
        )
        setUsedCredits(sum)
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
    loading: loading || !isBudgetResolved,
  }
}
