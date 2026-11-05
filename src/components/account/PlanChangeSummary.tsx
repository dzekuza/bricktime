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
  isDowngrade: boolean
}

const euro = (value: number) => `€${value.toFixed(2)}`

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="label-mono text-ink">{label}</span>
      <span className="font-display text-[26px] leading-none text-ink">
        {value}
      </span>
    </div>
  )
}

function Note({ children }: { children: string }) {
  return (
    <p className="font-mono text-[11px] leading-relaxed text-ink/40">
      {children}
    </p>
  )
}

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
  code: requestedCode,
  isSwap,
  isDowngrade,
}: PlanChangeSummaryProps) {
  // change-subscription stores a downgrade for the next renewal before it
  // reads any code, so neither a coupon nor a gift card is applied to it.
  const code = isDowngrade ? null : requestedCode
  const isAnnual = billing === "annual"
  const months = isAnnual ? 12 : 1
  const period = isAnnual ? "per metus" : "per mėnesį"
  const rate = isAnnual ? annualMonthlyPrice : monthlyPrice

  // Mirrors the server: a coupon cuts the recurring price. A gift card on a new
  // subscription is a one-off coupon capped at the first invoice (the rest is
  // forfeited); on a swap it becomes Stripe customer balance, spent on the swap
  // invoice first and carried over to later invoices.
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
  const giftForfeit = code?.kind === "gift" ? code.amount - giftCredit : 0
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
        <TotalRow label={`Iš viso ${period}`} value={euro(total)} />
      </div>
      {code?.kind === "gift" && !isSwap && (
        <>
          <Row
            label={`Dovanų kortelė ${code.code}`}
            value={`−${euro(giftCredit)}`}
          />
          <div className="border-t-2 border-dashed border-ink/10 pt-2.5">
            <TotalRow label="Mokėsi dabar" value={euro(total - giftCredit)} />
          </div>
          <Note>
            {`Dovanų kortelė taikoma tik pirmam mokėjimui, vėliau – ${euro(total)} ${period}.${
              giftForfeit > 0
                ? ` Nepanaudotas kortelės likutis (${euro(giftForfeit)}) neperkeliamas.`
                : ""
            }`}
          </Note>
        </>
      )}
      {code?.kind === "gift" && isSwap && (
        <>
          <Row
            label={`Dovanų kortelės ${code.code} kreditas`}
            value={`−${euro(code.amount)}`}
          />
          <Note>
            Kreditas pirmiausia padengia plano keitimo sąskaitą, o likutis
            nurašomas nuo kitų mokėjimų.
          </Note>
        </>
      )}
      {isDowngrade && requestedCode?.kind === "gift" && (
        <Note>
          Mažinant planą dovanų kortelė netaikoma – kortelė lieka nepanaudota.
        </Note>
      )}
      {isDowngrade && requestedCode?.kind === "coupon" && (
        <Note>Mažinant planą nuolaidos kodas netaikomas.</Note>
      )}
      {isAnnual && yearlySavings > 0 && (
        <p className="w-fit rounded-full border-2 border-ink bg-brand-mint px-3 py-1 font-mono text-[11px] font-bold text-ink">
          Sutaupai {euro(yearlySavings)} per metus, palyginti su mėnesiniu
          mokėjimu
        </p>
      )}
      {isSwap && (
        <Note>
          Keičiant planą nepanaudota dabartinio plano dalis įskaičiuojama, todėl
          pirma sąskaita gali skirtis.
        </Note>
      )}
    </div>
  )
}
