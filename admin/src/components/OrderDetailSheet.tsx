import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { type Order, type OrderStatus, orderStatusColors } from '@/data/orders'
import { createLabel, fetchLabelPdf, downloadPdf } from '@/lib/lpexpress'

function noteKey(orderId: string) {
  return `admin_note_order_${orderId}`
}

interface OrderDetailSheetProps {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange: (order: Order, status: OrderStatus, note?: string) => void
  onShippingUpdate?: (orderId: string, patch: Partial<Order>) => void
}

const statusActions: { status: OrderStatus; label: string }[] = [
  { status: 'active', label: 'Mark as active' },
  { status: 'returned', label: 'Mark as returned' },
  { status: 'overdue', label: 'Mark as overdue' },
  { status: 'processing', label: 'Mark as processing' },
]

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-3 py-2.5">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  )
}

export function OrderDetailSheet({ order, open, onOpenChange, onStatusChange, onShippingUpdate }: OrderDetailSheetProps) {
  const [returnStep, setReturnStep] = useState<'actions' | 'accept' | 'decline'>('actions')
  const [customerMessage, setCustomerMessage] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [noteSaved, setNoteSaved] = useState(false)
  const [phone, setPhone] = useState('')
  const [shipBusy, setShipBusy] = useState<string | null>(null)
  const [shipErr, setShipErr] = useState<string | null>(null)

  useEffect(() => {
    setReturnStep('actions')
    setCustomerMessage('')
    setAdminNote(order ? (localStorage.getItem(noteKey(order.id)) ?? '') : '')
    setNoteSaved(false)
    setPhone('')
    setShipErr(null)
    setShipBusy(null)
  }, [order?.id])

  async function generateOutboundLabel() {
    if (!order) return
    const p = phone.trim()
    if (!/^\+?\d{8,15}$/.test(p)) { setShipErr('Enter a valid phone (e.g. +37060000000)'); return }
    setShipBusy('generate'); setShipErr(null)
    try {
      const res = await createLabel({
        orderId: order.id,
        receiver: { name: order.subscriberName, phone: p, email: order.subscriberEmail },
      })
      onShippingUpdate?.(order.id, { barcode: res.barcode, trackingState: 'LABEL_CREATED' })
    } catch (e) {
      setShipErr((e as Error).message)
    } finally {
      setShipBusy(null)
    }
  }

  async function printLabel(parcel: 'outbound' | 'return') {
    if (!order) return
    setShipBusy(`print-${parcel}`); setShipErr(null)
    try {
      const b64 = await fetchLabelPdf(order.id, parcel)
      downloadPdf(b64, `${parcel}-label-${order.id.slice(0, 8)}.pdf`)
    } catch (e) {
      setShipErr((e as Error).message)
    } finally {
      setShipBusy(null)
    }
  }

  function saveNote() {
    if (!order) return
    localStorage.setItem(noteKey(order.id), adminNote)
    setNoteSaved(true)
    setTimeout(() => setNoteSaved(false), 2000)
  }

  function confirmAccept() {
    if (!order) return
    onStatusChange(order, 'returned', customerMessage.trim() || undefined)
    onOpenChange(false)
  }

  function confirmDecline() {
    if (!order) return
    onStatusChange(order, 'return_declined', customerMessage.trim())
    onOpenChange(false)
  }

  if (!order) return null

  const daysLeft = Math.ceil(
    (new Date(order.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="pb-4">
          <SheetTitle>Order {order.id}</SheetTitle>
          <SheetDescription>Full rental details and status management.</SheetDescription>
        </SheetHeader>

        {/* Status banner */}
        <div className={cn(
          'mx-6 mb-4 flex items-center justify-between rounded-lg border px-4 py-3',
          order.status === 'overdue' && 'border-destructive/30 bg-destructive/5',
          order.status === 'return_requested' && 'border-amber-300 bg-amber-50',
          order.status === 'return_declined' && 'border-rose-300 bg-rose-50',
        )}>
          <span className="text-sm font-medium">Current status</span>
          <Badge className={cn('capitalize', orderStatusColors[order.status])}>
            {order.status.replace('_', ' ')}
          </Badge>
        </div>

        {/* Return requested action panel */}
        {order.status === 'return_requested' && (
          <div className="mx-6 mb-4 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-800">Customer requested a return</p>

            {returnStep === 'actions' && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => { setCustomerMessage(''); setReturnStep('accept') }}
                >
                  Accept return
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => { setCustomerMessage(''); setReturnStep('decline') }}
                >
                  Decline
                </Button>
              </div>
            )}

            {returnStep === 'accept' && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-amber-700">Note to customer <span className="opacity-60">(optional — saved to their account)</span></p>
                <Textarea
                  placeholder="e.g. Thanks for returning! Your prepaid label is on its way."
                  value={customerMessage}
                  onChange={(e) => setCustomerMessage(e.target.value)}
                  rows={3}
                  className="text-sm bg-white"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={confirmAccept}
                  >
                    Confirm acceptance
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setReturnStep('actions')}>
                    Back
                  </Button>
                </div>
              </div>
            )}

            {returnStep === 'decline' && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-amber-700">Note to customer <span className="opacity-60">(saved to their account)</span></p>
                <Textarea
                  placeholder="e.g. Missing bricks detected — please ensure the set is complete before returning."
                  value={customerMessage}
                  onChange={(e) => setCustomerMessage(e.target.value)}
                  rows={3}
                  className="text-sm bg-white"
                />
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    disabled={!customerMessage.trim()}
                    onClick={confirmDecline}
                  >
                    Decline return
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setReturnStep('actions')}>
                    Back
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Message sent to customer when declined */}
        {order.returnNote && order.status === 'return_declined' && (
          <div className="mx-6 mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-rose-600">Message sent to customer</p>
            <p className="text-sm text-rose-800">{order.returnNote}</p>
          </div>
        )}

        <div className="flex flex-col gap-0 px-6">
          {/* Subscriber */}
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subscriber</p>
          <div className="rounded-lg border divide-y">
            <Row label="Name" value={order.subscriberName} />
            <Row label="Email" value={
              <a href={`mailto:${order.subscriberEmail}`} className="text-primary hover:underline">
                {order.subscriberEmail}
              </a>
            } />
          </div>

          <Separator className="my-5" />

          {/* Product */}
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</p>
          <div className="rounded-lg border divide-y">
            <Row label="Title" value={order.productTitle} />
            <Row label="Product ID" value={`#${order.productId}`} />
          </div>

          <Separator className="my-5" />

          {/* Rental period */}
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rental period</p>
          <div className="rounded-lg border divide-y">
            <Row label="Start date" value={order.startDate} />
            <Row label="Due date" value={order.dueDate} />
            <Row
              label="Days remaining"
              value={
                order.status === 'returned' ? (
                  <span className="text-muted-foreground">Returned</span>
                ) : daysLeft < 0 ? (
                  <span className="text-destructive font-semibold">{Math.abs(daysLeft)}d overdue</span>
                ) : (
                  <span className={daysLeft <= 7 ? 'text-amber-600 font-semibold' : ''}>
                    {daysLeft}d
                  </span>
                )
              }
            />
            <Row label="Amount" value={`€${order.amount}`} />
          </div>

          <Separator className="my-5" />

          {/* Shipping (LP EXPRESS) */}
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Shipping (LP EXPRESS)</p>
          <div className="rounded-lg border divide-y">
            <Row
              label="Delivery"
              value={
                order.homeDelivery
                  ? 'Courier — to door'
                  : `Paštomatas${order.terminalName ? `: ${order.terminalName}` : ''}`
              }
            />
            <Row
              label="Outbound"
              value={
                order.barcode ? (
                  <span className="font-mono text-xs">{order.barcode}</span>
                ) : (
                  <span className="text-muted-foreground">No label yet</span>
                )
              }
            />
            {order.trackingState && <Row label="Status" value={<Badge variant="secondary">{order.trackingState}</Badge>} />}
            {order.returnBarcode && (
              <Row label="Return" value={<span className="font-mono text-xs">{order.returnBarcode}</span>} />
            )}
            {order.returnTrackingState && (
              <Row label="Return status" value={<Badge variant="secondary">{order.returnTrackingState}</Badge>} />
            )}
          </div>

          <div className="mt-3 flex flex-col gap-2">
            {/* Generate outbound label */}
            {!order.barcode && !order.homeDelivery && order.terminalName && (
              <div className="flex flex-col gap-2 rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Generate outbound label (customer phone required)</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="+37060000000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-9"
                  />
                  <Button size="sm" onClick={generateOutboundLabel} disabled={shipBusy === 'generate'}>
                    {shipBusy === 'generate' ? 'Generating…' : 'Generate'}
                  </Button>
                </div>
              </div>
            )}
            {!order.barcode && !order.homeDelivery && !order.terminalName && (
              <p className="text-xs text-muted-foreground">Customer hasn't selected a paštomatas yet.</p>
            )}
            {!order.barcode && order.homeDelivery && (
              <p className="text-xs text-muted-foreground">
                Courier delivery — the customer's address isn't stored. Create this label in LP self-service.
              </p>
            )}

            {/* Print buttons */}
            <div className="flex flex-wrap gap-2">
              {order.barcode && (
                <Button variant="outline" size="sm" onClick={() => printLabel('outbound')} disabled={shipBusy === 'print-outbound'}>
                  {shipBusy === 'print-outbound' ? 'Preparing…' : 'Print outbound label'}
                </Button>
              )}
              {order.returnBarcode && (
                <Button variant="outline" size="sm" onClick={() => printLabel('return')} disabled={shipBusy === 'print-return'}>
                  {shipBusy === 'print-return' ? 'Preparing…' : 'Print return label'}
                </Button>
              )}
            </div>
            {shipErr && <p className="text-xs text-destructive">{shipErr}</p>}
          </div>

          <Separator className="my-5" />

          {/* Status actions */}
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Change status</p>
          <div className="flex flex-wrap gap-2">
            {statusActions
              .filter((a) => a.status !== order.status)
              .map((a) => (
                <Button
                  key={a.status}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onStatusChange(order, a.status)
                    onOpenChange(false)
                  }}
                >
                  {a.label}
                </Button>
              ))}
          </div>

          <Separator className="my-5" />

          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin note</p>
          <Textarea
            placeholder="Internal note — not visible to customer…"
            rows={3}
            className="text-sm resize-none"
            value={adminNote}
            onChange={(e) => { setAdminNote(e.target.value); setNoteSaved(false) }}
          />
          <div className="mt-2 flex items-center justify-end gap-2 pb-6">
            {noteSaved && <span className="text-xs text-green-600">Saved</span>}
            <Button size="sm" variant="outline" onClick={saveNote} disabled={noteSaved}>
              Save note
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
