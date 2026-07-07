import { useEffect, useState } from "react"
import { fetchTracking, type LpTrackingEvent } from "@/lib/lpexpress"

interface OrderTrackingProps {
  barcode: string
}

/** Maps LP EXPRESS public state → a badge colour. */
const STATE_STYLES: Record<string, string> = {
  LABEL_CREATED: "bg-blue-100 text-blue-800",
  ON_THE_WAY: "bg-amber-100 text-amber-800",
  PARCEL_RECEIVED: "bg-amber-100 text-amber-800",
  PARCEL_DELIVERED: "bg-green-100 text-green-800",
  RETURNING: "bg-rose-100 text-rose-800",
  PARCEL_CANCELED: "bg-neutral-200 text-neutral-700",
}

function eventDate(e: LpTrackingEvent): number {
  return e.date ? Date.parse(e.date) || 0 : 0
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
      <div className="mt-3 font-mono text-[10px] tracking-[.14em] text-ink/40 uppercase">
        Sekimas: {barcode}
      </div>
    )
  }

  const latest = events?.[0]
  const stateType = latest?.publicStateType ?? "LABEL_CREATED"
  const stateText = latest?.publicStateText ?? "Siunta sukurta"

  return (
    <div className="mt-3 rounded-xl border-2 border-ink/10 bg-ink/[.02] px-3 py-2.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`inline-block shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] tracking-[.12em] uppercase ${
              STATE_STYLES[stateType] ?? "bg-neutral-100 text-neutral-700"
            }`}
          >
            {stateText}
          </span>
        </div>
        <span className="shrink-0 font-mono text-[14px] leading-none text-ink/40">{open ? "−" : "+"}</span>
      </button>
      <p className="mt-1.5 font-mono text-[10px] tracking-[.1em] text-ink/40 uppercase">
        Nr. {barcode}
      </p>

      {open && (
        <ol className="mt-3 space-y-2 border-t-2 border-ink/10 pt-3">
          {events === null && <li className="font-mono text-[11px] text-ink/40">Kraunama…</li>}
          {events?.length === 0 && (
            <li className="font-mono text-[11px] text-ink/40">Kol kas įvykių nėra</li>
          )}
          {events?.map((e, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-mint" />
              <div className="min-w-0">
                <p className="text-[12px] text-ink">{e.publicStateText ?? e.publicEventType}</p>
                {(e.date || e.location) && (
                  <p className="font-mono text-[10px] text-ink/40">
                    {[e.date ? new Date(e.date).toLocaleString("lt-LT") : null, e.location]
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
