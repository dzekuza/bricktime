import { useState } from "react"

const PAUSE_OPTIONS = [1, 2, 3] as const

// An open-ended pause is stored as 'infinity', which isn't a real date.
const formatDate = (iso: string) => {
  const date = new Date(iso)
  return Number.isNaN(date.getTime())
    ? "atnaujinimo"
    : date.toLocaleDateString("lt-LT", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
}

const BUTTON =
  "brick-hover-sm rounded-xl border-2 border-ink px-4 py-3 font-mono text-[11px] tracking-[.14em] uppercase transition-all disabled:pointer-events-none disabled:opacity-50"

interface PauseSubscriptionProps {
  pausedUntil: string | null
  currentPeriodEnd?: string | null
  busy: boolean
  onPause: (months: number) => void
  onResume: () => void
}

// Skip 1–3 monthly payments. While paused no new sets can be rented; the
// edge function refuses a pause while sets are still at home.
export function PauseSubscription({
  pausedUntil,
  currentPeriodEnd,
  busy,
  onPause,
  onResume,
}: PauseSubscriptionProps) {
  const [isChoosing, setIsChoosing] = useState(false)
  const [months, setMonths] = useState<number>(1)

  if (pausedUntil) {
    const pausedUntilMs = Date.parse(pausedUntil)
    const periodEndMs = currentPeriodEnd
      ? Date.parse(currentPeriodEnd)
      : Number.NaN
    // Once pausedUntil is within the current (already voided) period, Stripe
    // will already bill at the next renewal; only the unpaid month remains.
    const canResume =
      Number.isNaN(pausedUntilMs) ||
      Number.isNaN(periodEndMs) ||
      pausedUntilMs > periodEndMs
    return (
      <div className="flex flex-col gap-2 rounded-xl border-2 border-ink/10 bg-cream p-4">
        <p className="text-[13px] text-ink">
          Nauji rinkiniai nenuomojami iki {formatDate(pausedUntil)} – tada
          prasideda kitas apmokėtas laikotarpis.
        </p>
        {canResume && (
          <button
            onClick={() => {
              setIsChoosing(false)
              onResume()
            }}
            disabled={busy}
            className={`${BUTTON} bg-paper text-ink`}
          >
            Atnaujinti dabar
          </button>
        )}
      </div>
    )
  }

  if (!isChoosing) {
    return (
      <button
        onClick={() => setIsChoosing(true)}
        disabled={busy}
        className={`${BUTTON} bg-paper text-ink`}
      >
        Pristabdyti
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border-2 border-ink/10 bg-cream p-4">
      <p className="label-mono text-ink/50">Kiek mėnesių praleisti?</p>
      <div className="grid grid-cols-3 gap-2">
        {PAUSE_OPTIONS.map((option) => (
          <button
            key={option}
            aria-pressed={months === option}
            onClick={() => setMonths(option)}
            className={[
              BUTTON,
              months === option ? "bg-ink text-paper" : "bg-paper text-ink",
            ].join(" ")}
          >
            {option} mėn.
          </button>
        ))}
      </div>
      <p className="font-mono text-[11px] leading-relaxed text-ink/50">
        Šis mėnuo jau apmokėtas ir negrąžinamas. Praleidžiama mokėjimų: {months}
        . Tuo metu nauji rinkiniai nenuomojami. Pristabdyti galima tik grąžinus
        visus rinkinius.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            setIsChoosing(false)
            onPause(months)
          }}
          disabled={busy}
          className={`${BUTTON} bg-ink text-paper`}
        >
          Pristabdyti
        </button>
        <button
          onClick={() => setIsChoosing(false)}
          disabled={busy}
          className={`${BUTTON} bg-paper text-ink`}
        >
          Atšaukti
        </button>
      </div>
    </div>
  )
}
