import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"

export type PlanChangeQuote = {
  amountCents: number
  creditCents: number
  isProration: boolean
  oldPlanCreditCents: number
  newPlanChargeCents: number
  card: { brand: string; last4: string } | null
}

type PlanChangeConfirmProps = {
  quote: PlanChangeQuote | null
  isLoading: boolean
  onConfirm: () => void
  onCancel: () => void
}

const euro = (cents: number) => `€${(cents / 100).toFixed(2)}`

function BreakdownRow({
  label,
  value,
  isTotal,
}: {
  label: string
  value: string
  isTotal?: boolean
}) {
  return (
    <div
      className={
        isTotal
          ? "flex justify-between gap-4 font-bold text-ink"
          : "flex justify-between gap-4 text-ink/70"
      }
    >
      <dt>{label}</dt>
      <dd className="font-mono">{value}</dd>
    </div>
  )
}

// Shows what a plan change will charge before it happens: the swap bills the
// saved card without a Stripe page, so this is the only moment to say so.
export function PlanChangeConfirm({
  quote,
  isLoading,
  onConfirm,
  onCancel,
}: PlanChangeConfirmProps) {
  const hasCharge = quote != null && quote.amountCents > 0
  const cardLabel = quote?.card
    ? `${quote.card.brand.toUpperCase()} ••${quote.card.last4}`
    : "išsaugotos kortelės"

  return (
    <Dialog open={quote != null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="brick-card w-[calc(100vw-2rem)] max-w-[380px] gap-0 border-0 bg-paper p-0 shadow-none">
        <div className="min-w-0 p-6">
          <DialogTitle className="heading-display text-d-xs text-ink">
            Patvirtinti plano keitimą?
          </DialogTitle>
          <DialogDescription className="mt-2 text-[13px] leading-[1.6] text-ink/60">
            {hasCharge
              ? `Iš ${cardLabel} bus iškart nuskaičiuota ${euro(quote.amountCents)}.`
              : "Šį kartą nieko nemokėsi – skirtumą padengia tavo kreditas."}
            {quote != null && quote.creditCents > 0 && (
              <> Panaudota kredito: {euro(quote.creditCents)}.</>
            )}
            {quote?.isProration && (
              <>
                {" "}
                Suma apskaičiuota pagal likusį laikotarpį, galutinė sąskaitoje
                gali šiek tiek skirtis.
              </>
            )}
          </DialogDescription>
          {quote != null && quote.newPlanChargeCents > 0 && (
            <dl className="mt-4 flex flex-col gap-1.5 border-t border-dashed border-ink/30 pt-4 text-[13px]">
              <BreakdownRow
                label="Naujas planas"
                value={euro(quote.newPlanChargeCents)}
              />
              {quote.oldPlanCreditCents > 0 && (
                <BreakdownRow
                  label={
                    quote.isProration
                      ? "Nepanaudotas dabartinio plano laikas"
                      : "Dabartinio plano kaina"
                  }
                  value={`−${euro(quote.oldPlanCreditCents)}`}
                />
              )}
              {quote.creditCents > 0 && (
                <BreakdownRow
                  label="Kreditas"
                  value={`−${euro(quote.creditCents)}`}
                />
              )}
              <BreakdownRow
                label="Mokėti dabar (su PVM)"
                value={euro(quote.amountCents)}
                isTotal
              />
            </dl>
          )}
          <div className="mt-5 flex flex-col gap-2">
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className="w-full rounded-full border-2 border-ink bg-ink font-bold text-paper"
            >
              {isLoading
                ? "Kraunama…"
                : hasCharge
                  ? `Patvirtinti ir mokėti ${euro(quote.amountCents)}`
                  : "Patvirtinti"}
            </Button>
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="w-full rounded-full border-2 border-ink font-bold"
            >
              Atšaukti
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
