const euro = (value: number) => `€${value.toFixed(2)}`

type UpgradePriceNotesProps = {
  // List price per month; a coupon is shown separately and may not recur.
  monthlyPrice: number
  isAnnual: boolean
  // Monthly door-delivery fee kept on the plan; 0 when not on the plan.
  deliveryFee: number
  // The member already has a subscription that is swapped, not a new one.
  isSwap: boolean
  // Price per month after a promo code; equals monthlyPrice without one.
  chargePrice: number
  // Gift card credit in euros; it only reduces the first invoice.
  giftCardCredit: number
}

// Spells out what the headline per-month price turns into, so the amount
// Stripe charges is never a surprise.
export function UpgradePriceNotes({
  monthlyPrice,
  isAnnual,
  deliveryFee,
  isSwap,
  chargePrice,
  giftCardCredit,
}: UpgradePriceNotesProps) {
  const months = isAnnual ? 12 : 1
  const periodTotal = (monthlyPrice + deliveryFee) * months
  const firstInvoice = (chargePrice + deliveryFee) * months
  const todayTotal = Math.max(0, firstInvoice - giftCardCredit)
  const showToday = giftCardCredit > 0 && !isSwap
  const notes = [
    deliveryFee > 0 &&
      `+ ${euro(deliveryFee)}/mėn. pristatymas į duris (jau yra tavo plane).`,
    isAnnual && `Metinė plano kaina – ${euro(periodTotal)}.`,
    !isAnnual && deliveryFee > 0 && `Iš viso ${euro(periodTotal)}/mėn.`,
    isSwap &&
      (isAnnual
        ? "Nepanaudota dabartinio plano dalis įskaičiuojama į pirmą metinį mokėjimą. Antra prenumerata nekuriama."
        : "Dabar sumokėsi tik kainų skirtumą, vėliau – pilną mėnesio kainą. Antra prenumerata nekuriama."),
  ].filter((note): note is string => typeof note === "string")

  if (notes.length === 0 && !showToday) return null
  return (
    <div className="mt-2 flex flex-col gap-1">
      {showToday && (
        <p className="font-mono text-[13px] font-bold leading-relaxed text-ink">
          Šiandien mokėsi {euro(todayTotal)} (po {euro(giftCardCredit)} kupono).
        </p>
      )}
      {notes.map((note) => (
        <p
          key={note}
          className="font-mono text-[11px] leading-relaxed text-ink/50"
        >
          {note}
        </p>
      ))}
    </div>
  )
}
