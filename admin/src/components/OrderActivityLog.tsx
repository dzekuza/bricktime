import { useEffect, useMemo, useState } from 'react'
import { fetchTracking, type LpTrackingEvent } from '@/lib/lpexpress'
import type { Order } from '@/data/orders'

interface ActivityEntry {
  at: string
  label: string
  detail?: string
}

function formatActivityTime(iso: string): string {
  const date = new Date(iso)
  const isThisYear = date.getFullYear() === new Date().getFullYear()
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(isThisYear ? {} : { year: 'numeric' }),
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function toTrackingEntries(events: LpTrackingEvent[], prefix: string): ActivityEntry[] {
  return events.flatMap((e) => {
    const at = e.eventDate ?? e.date
    if (!at) return []
    return [{
      at,
      label: `${prefix}: ${e.publicStateText ?? e.publicStateType ?? e.publicEventType ?? 'Update'}`,
      detail: e.location,
    }]
  })
}

/** Timeline of an order: its own lifecycle timestamps plus LP Express tracking events. */
export function OrderActivityLog({ order }: { order: Order }) {
  const [outbound, setOutbound] = useState<LpTrackingEvent[]>([])
  const [inbound, setInbound] = useState<LpTrackingEvent[]>([])
  const [isTrackingFailed, setIsTrackingFailed] = useState(false)

  useEffect(() => {
    let isCancelled = false
    setOutbound([])
    setInbound([])
    setIsTrackingFailed(false)
    const load = (barcode: string | null | undefined, set: (e: LpTrackingEvent[]) => void) => {
      if (!barcode) return
      fetchTracking(barcode)
        .then((events) => { if (!isCancelled) set(events) })
        .catch(() => { if (!isCancelled) setIsTrackingFailed(true) })
    }
    load(order.barcode, setOutbound)
    load(order.returnBarcode, setInbound)
    return () => { isCancelled = true }
  }, [order.id, order.barcode, order.returnBarcode])

  const entries = useMemo<ActivityEntry[]>(() => {
    const own: ActivityEntry[] = []
    if (order.createdAt) {
      own.push({ at: order.createdAt, label: order.isMystery ? 'Mystery Box requested' : 'Order created' })
    }
    if (order.labelCreatedAt) {
      own.push({ at: order.labelCreatedAt, label: 'Shipment created', detail: order.barcode ?? undefined })
    }
    if (order.returnRequestedAt) own.push({ at: order.returnRequestedAt, label: 'Return requested' })
    if (order.returnLabelCreatedAt) {
      own.push({ at: order.returnLabelCreatedAt, label: 'Return label created', detail: order.returnBarcode ?? undefined })
    }
    if (order.returnedAt) own.push({ at: order.returnedAt, label: 'Order returned' })
    return [...own, ...toTrackingEntries(outbound, 'Shipment'), ...toTrackingEntries(inbound, 'Return shipment')]
      .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
  }, [order, outbound, inbound])

  return (
    <>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Activity</p>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity yet.</p>
      ) : (
        <ol className="relative ml-1.5 space-y-3 border-l pl-4">
          {entries.map((entry, i) => (
            <li key={`${entry.at}-${i}`} className="relative">
              <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-border" />
              <p className="text-sm font-medium">{entry.label}</p>
              <p className="text-xs text-muted-foreground">
                {formatActivityTime(entry.at)}
                {entry.detail && <span className="font-mono"> · {entry.detail}</span>}
              </p>
            </li>
          ))}
        </ol>
      )}
      {isTrackingFailed && (
        <p className="mt-2 text-xs text-muted-foreground">Couldn't load LP Express tracking events.</p>
      )}
    </>
  )
}
