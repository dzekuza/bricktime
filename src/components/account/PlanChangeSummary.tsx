import type { AppliedCode } from "@/hooks/useDiscountCode"

interface PlanChangeSummaryProps {
  planName: string
  monthlyPrice: number
  annualMonthlyPrice: number
  billing: "monthly" | "annual"
  homeDelivery: boolean
  homeDeliveryFee: number
  code: AppliedCode | null
  isSwap: boolean
}

const euro = (value: number) => `€${value.toFixed(2)}`

function Row({
  label,
  value,
  muted,
}: {
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-[13px]">
      <span className={muted ? "text-ink/50" : "text-ink/70"}>{label}</span>
      <span className="font-mono font-bold text-ink">{value}</span>
    </div>
  )
}

export function PlanChangeSummary({
  planName,
  monthlyPrice,
  annualMonthlyPrice,
  billing,
  homeDelivery,
  homeDeliveryFee,
  code,
  isSwap,
}: PlanChangeSummaryProps) {
  const isAnnual = billing === "annual"
  const months = isAnnual ? 12 : 1
  const period = isAnnual ? "per metus" : "per mėnesį"
  const rate = isAnnual ? annualMonthlyPrice : monthlyPrice

  // Mirrors the server: a coupon cuts the recurring price, a gift card is a
  // credit against the first invoice.
  const couponRate =
    code?.kind === "coupon"
      ? Math.max(
          0,
          code.type === "percentage"
            ? rate * (1 - code.value / 100)
            : rate - code.value
        )
      : rate
  const planTotal = couponRate * months
  const deliveryTotal = homeDelivery ? homeDeliveryFee * months : 0
  const total = planTotal + deliveryTotal
  const giftCredit = code?.kind === "gift" ? Math.min(code.amount, total) : 0
  const yearlySavings = isAnnual ? (monthlyPrice - annualMonthlyPrice) * 12 : 0

  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border-2 border-ink/10 bg-ink/[.02] p-4">
      <p className="label-mono text-ink/50">Tavo suma</p>
      <Row
        label={
          isAnnual
            ? `${planName} · ${euro(annualMonthlyPrice)}/mėn. × 12`
            : `${planName} · kas mėnesį`
        }
        value={euro(rate * months)}
      />
      {code?.kind === "coupon" && (
        <Row
          label={`Kodas ${code.code}`}
          value={`−${euro((rate - couponRate) * months)}`}
        />
      )}
      {homeDelivery && (
        <Row
          label={
            isAnnual
              ? `Pristatymas kurjeriu · ${euro(homeDeliveryFee)}/mėn. × 12`
              : "Pristatymas kurjeriu"
          }
          value={homeDeliveryFee > 0 ? `+${euro(deliveryTotal)}` : "Nemokamas"}
        />
      )}
      <div className="border-t-2 border-dashed border-ink/10 pt-2.5">
        <div className="flex items-baseline justify-between gap-4">
          <span className="label-mono text-ink">Iš viso {period}</span>
          <span className="font-display text-[26px] leading-none text-ink">
            {euro(total)}
          </span>
        </div>
      </div>
      {code?.kind === "gift" && (
        <Row
          label={`Dovanų kortelė ${code.code}`}
          value={`−${euro(giftCredit)}`}
        />
      )}
      {isAnnual && yearlySavings > 0 && (
        <p className="w-fit rounded-full border-2 border-ink bg-brand-mint px-3 py-1 font-mono text-[11px] font-bold text-ink">
          Sutaupai {euro(yearlySavings)} per metus, palyginti su mėnesiniu
          mokėjimu
        </p>
      )}
      {isSwap && (
        <p className="font-mono text-[11px] leading-relaxed text-ink/40">
          Keičiant planą nepanaudota dabartinio plano dalis įskaičiuojama, todėl
          pirma sąskaita gali skirtis.
        </p>
      )}
    </div>
  )
}
