import { useState } from "react"
import { supabase } from "@/lib/supabase"

export type AppliedCode =
  | {
      kind: "coupon"
      code: string
      type: "percentage" | "fixed"
      value: number
    }
  | { kind: "gift"; code: string; amount: number }

// Resolves a single code field that accepts either a coupon or a gift card.
// This only previews the code for the UI — the edge functions re-validate it
// and compute the real discount server-side.
export function useDiscountCode() {
  const [input, setInput] = useState("")
  const [applied, setApplied] = useState<AppliedCode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function apply() {
    const code = input.trim().toUpperCase()
    if (!code) return
    setLoading(true)
    setError(null)

    const { data: coupon } = await supabase
      .from("coupons")
      .select(
        "code, discount_type, discount_value, max_uses, uses_count, expires_at, active"
      )
      .eq("code", code)
      .maybeSingle()

    if (coupon) {
      setLoading(false)
      const expired =
        coupon.expires_at && new Date(coupon.expires_at) < new Date()
      const exhausted =
        coupon.max_uses != null && coupon.uses_count >= coupon.max_uses
      if (!coupon.active || expired || exhausted) {
        setError("Kodas negalioja")
        return
      }
      setApplied({
        kind: "coupon",
        code: coupon.code,
        type: coupon.discount_type as "percentage" | "fixed",
        value: Number(coupon.discount_value),
      })
      setInput("")
      return
    }

    const { data: card } = await supabase.functions.invoke("verify-gift-card", {
      body: { code },
    })
    setLoading(false)
    if (!card?.valid) {
      setError("Kodas nerastas arba negalioja")
      return
    }
    setApplied({ kind: "gift", code, amount: card.amountCents / 100 })
    setInput("")
  }

  function clear() {
    setApplied(null)
    setError(null)
  }

  return { input, setInput, applied, error, loading, apply, clear }
}
