import { useState } from "react"

import { supabase } from "@/lib/supabase"

export interface AppliedMerchCode {
  code: string
  kind: "coupon" | "gift_card"
  amountOffCents: number
}

interface MerchDiscountCodeProps {
  priceCents: number
  applied: AppliedMerchCode | null
  onApply: (code: AppliedMerchCode) => void
  onClear: () => void
}

/**
 * One field for both discount codes and gift cards — the shopper rarely knows
 * which one they hold. This check is only for showing the price; the checkout
 * function re-validates and prices the code itself.
 */
export function MerchDiscountCode({
  priceCents,
  applied,
  onApply,
  onClear,
}: MerchDiscountCodeProps) {
  const [input, setInput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  async function handleApply() {
    const code = input.trim().toUpperCase()
    if (!code) return
    setIsChecking(true)
    setError(null)
    const result = await checkCode(code, priceCents)
    setIsChecking(false)
    if ("error" in result) {
      setError(result.error)
      return
    }
    onApply(result)
    setInput("")
  }

  if (applied) {
    return (
      <div className="mt-5 flex items-center justify-between rounded-2xl border-2 border-brand-mint bg-brand-mint/10 px-4 py-3">
        <div>
          <p className="label-mono text-[9px] text-ink/50">
            {applied.kind === "gift_card"
              ? "Dovanų kuponas"
              : "Nuolaidos kodas"}
          </p>
          <p className="font-mono text-[13px] font-bold text-ink">
            {applied.code} —{" "}
            <span className="text-brand-orange">
              −€{(applied.amountOffCents / 100).toFixed(2)}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          aria-label="Pašalinti kodą"
          className="font-mono text-[16px] text-ink/30 hover:text-ink"
        >
          ✕
        </button>
      </div>
    )
  }

  return (
    <div className="mt-5">
      <p className="label-mono mb-2 text-ink/40">
        Nuolaidos kodas ar dovanų kuponas
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value.toUpperCase())
            setError(null)
          }}
          onKeyDown={(e) => e.key === "Enter" && void handleApply()}
          placeholder="KODAS"
          className="min-w-0 flex-1 rounded-2xl border-2 border-ink/20 bg-ink/[.02] px-3 py-3 font-mono text-[13px] tracking-widest uppercase transition-colors outline-none focus:border-ink md:px-4"
        />
        <button
          type="button"
          onClick={() => void handleApply()}
          disabled={isChecking || !input.trim()}
          className="shrink-0 rounded-2xl border-2 border-ink bg-ink px-3 py-3 font-mono text-[12px] font-bold text-paper disabled:opacity-40 md:px-4"
        >
          {isChecking ? "…" : "Taikyti"}
        </button>
      </div>
      {error && (
        <p className="mt-1.5 font-mono text-[11px] text-red-500">{error}</p>
      )}
    </div>
  )
}

async function checkCode(
  code: string,
  priceCents: number
): Promise<AppliedMerchCode | { error: string }> {
  const { data: coupon } = await supabase
    .from("coupons")
    .select(
      "code, discount_type, discount_value, max_uses, uses_count, expires_at, active"
    )
    .eq("code", code)
    .maybeSingle()

  if (coupon) {
    if (!coupon.active) return { error: "Kodas neaktyvus" }
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date())
      return { error: "Kodas nebegalioja" }
    if (coupon.max_uses != null && coupon.uses_count >= coupon.max_uses)
      return { error: "Kodas jau panaudotas" }
    const value = Number(coupon.discount_value)
    const off =
      coupon.discount_type === "percentage"
        ? Math.round((priceCents * value) / 100)
        : Math.round(value * 100)
    return {
      code,
      kind: "coupon",
      amountOffCents: Math.min(off, priceCents),
    }
  }

  const { data, error } = await supabase.functions.invoke("verify-gift-card", {
    body: { code },
  })
  if (error || !data?.valid) {
    return { error: "Kodas nerastas arba nebegalioja" }
  }
  return {
    code,
    kind: "gift_card",
    amountOffCents: Math.min(Number(data.amountCents), priceCents),
  }
}
