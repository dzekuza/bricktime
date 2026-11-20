import { useEffect, useState } from "react"
import { fetchTracking, type LpTrackingEvent } from "@/lib/lpexpress"

interface OrderTrackingProps {
  barcode: string
}

/** Maps LP EXPRESS public state → a badge colour (same look as the order status badges). */
const STATE_STYLES: Record<string, string> = {
  LABEL_CREATED: "bg-brand-sky text-ink",
  ON_THE_WAY: "bg-brand-yellow text-ink",
  PARCEL_RECEIVED: "bg-brand-yellow text-ink",
  PARCEL_DELIVERED: "bg-brand-mint text-ink",
  RETURNING: "bg-brand-pink text-ink",
  PARCEL_CANCELED: "bg-cream text-ink",
}

/** LP sends `eventDate`; `date` is the older field name. */
const eventTime = (e: LpTrackingEvent) => e.eventDate ?? e.date

function eventDate(e: LpTrackingEvent): number {
  const value = eventTime(e)
  return value ? Date.parse(value) || 0 : 0
}

/** Live LP EXPRESS tracking for one parcel barcode. */
export function OrderTracking({ barcode }: OrderTrackingProps) {
  const [events, setEvents] = useState<LpTrackingEvent[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let alive = true
    fetchTracking(barcode)
      .then((ev) => {
        if (!alive) return
        setEvents([...ev].sort((a, b) => eventDate(b) - eventDate(a)))
      })
      .catch((e) => alive && setError((e as Error).message))
    return () => {
      alive = false
    }
  }, [barcode])

  if (error) {
    return (
      <div className="font-mono text-[12px] tracking-[.08em] text-ink/60 uppercase">
        Sekimas: <span className="font-bold text-ink">{barcode}</span>
      </div>
    )
  }

  const latest = events?.[0]
  const stateType = latest?.publicStateType ?? "LABEL_CREATED"
  const stateText = latest?.publicStateText ?? "Siunta sukurta"

  return (
    <div className="rounded-2xl border-2 border-ink/15 bg-cream px-4 py-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`inline-block shrink-0 rounded-full border-2 border-ink px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-[.1em] uppercase ${
              STATE_STYLES[stateType] ?? "bg-cream text-ink"
            }`}
          >
            {stateText}
          </span>
        </div>
        <span className="shrink-0 font-mono text-[18px] leading-none font-bold text-ink">
          {open ? "−" : "+"}
        </span>
      </button>
      <p className="mt-2 font-mono text-[12px] tracking-[.08em] text-ink/60 uppercase">
        Nr. <span className="font-bold text-ink">{barcode}</span>
      </p>

      {open && (
        <ol className="mt-3 space-y-2 border-t-2 border-ink/10 pt-3">
          {events === null && (
            <li className="font-mono text-[12px] text-ink/60">Kraunama…</li>
          )}
          {events?.length === 0 && (
            <li className="font-mono text-[12px] text-ink/60">
              Kol kas įvykių nėra
            </li>
          )}
          {events?.map((e, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-mint" />
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-ink">
                  {e.publicStateText ?? e.publicEventType}
                </p>
                {(eventTime(e) || e.location) && (
                  <p className="font-mono text-[11px] text-ink/60">
                    {[
                      eventTime(e)
                        ? new Date(eventTime(e)!).toLocaleString("lt-LT")
                        : null,
                      e.location,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
