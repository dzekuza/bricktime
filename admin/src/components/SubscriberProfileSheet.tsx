import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

function noteKey(subId: string) {
  return `admin_note_subscriber_${subId}`
}

type Penalty = { amount: number; reason: string }
import { type Subscriber, type SubscriberStatus, planColors, subscriberStatusColors } from '@/data/subscribers'
import { orderStatusColors, type OrderStatus } from '@/data/orders'
import { supabase, supabaseAdmin } from '@/lib/supabase'

interface SheetOrder {
  id: string
  productTitle: string
  startDate: string
  dueDate: string
  status: OrderStatus
  amount: number
}

interface SubscriberProfileSheetProps {
  subscriber: Subscriber | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange: (sub: Subscriber, status: SubscriberStatus) => void
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-3 py-2.5">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  )
}

const statusActions: { status: SubscriberStatus; label: string }[] = [
  { status: 'active', label: 'Mark as active' },
  { status: 'paused', label: 'Pause subscription' },
  { status: 'cancelled', label: 'Cancel subscription' },
]

export function SubscriberProfileSheet({
  subscriber,
  open,
  onOpenChange,
  onStatusChange,
}: SubscriberProfileSheetProps) {
  const [sheetOrders, setSheetOrders] = useState<SheetOrder[]>([])
  const [adminNote, setAdminNote] = useState('')
  const [noteSaved, setNoteSaved] = useState(false)
  const [penalty, setPenalty] = useState<Penalty | null>(null)
  const [penaltyHistory, setPenaltyHistory] = useState<Array<{
    id: string; amount: number; reason: string | null; status: 'pending' | 'paid' | 'forgiven'; created_at: string; resolved_at: string | null
  }>>([])
  const [penaltyStep, setPenaltyStep] = useState<'idle' | 'setting'>('idle')
  const [penaltyAmount, setPenaltyAmount] = useState('')
  const [penaltyReason, setPenaltyReason] = useState('')

  function loadPenaltyData(email: string) {
    supabase
      .from('subscribers')
      .select('penalty_amount, penalty_reason')
      .eq('email', email)
      .maybeSingle()
      .then(({ data }) => {
        setPenalty(data?.penalty_amount != null
          ? { amount: data.penalty_amount, reason: data.penalty_reason ?? '' }
          : null)
      })
    supabaseAdmin
      .from('subscriber_penalties')
      .select('id, amount, reason, status, created_at, resolved_at')
      .eq('subscriber_email', email)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setPenaltyHistory((data ?? []) as typeof penaltyHistory)
      })
  }

  useEffect(() => {
    if (subscriber) {
      setAdminNote(localStorage.getItem(noteKey(subscriber.id)) ?? '')
      setNoteSaved(false)
      setPenaltyStep('idle')
      setPenaltyAmount('')
      setPenaltyReason('')
      loadPenaltyData(subscriber.email)
    }
  }, [subscriber?.id])

  function saveNote() {
    if (!subscriber) return
    localStorage.setItem(noteKey(subscriber.id), adminNote)
    setNoteSaved(true)
    setTimeout(() => setNoteSaved(false), 2000)
  }

  async function savePenalty() {
    if (!subscriber) return
    const amount = parseFloat(penaltyAmount)
    const reason = penaltyReason.trim()
    await Promise.all([
      supabaseAdmin
        .from('subscribers')
        .update({ penalty_amount: amount, penalty_reason: reason || null })
        .eq('email', subscriber.email),
      supabaseAdmin
        .from('subscriber_penalties')
        .insert({ subscriber_email: subscriber.email, amount, reason: reason || null }),
    ])
    setPenalty({ amount, reason })
    setPenaltyStep('idle')
    setPenaltyAmount('')
    setPenaltyReason('')
    loadPenaltyData(subscriber.email)
  }

  async function clearPenalty() {
    if (!subscriber) return
    const pending = penaltyHistory.find((p) => p.status === 'pending')
    await Promise.all([
      supabaseAdmin
        .from('subscribers')
        .update({ penalty_amount: null, penalty_reason: null })
        .eq('email', subscriber.email),
      pending
        ? supabaseAdmin
            .from('subscriber_penalties')
            .update({ status: 'forgiven', resolved_at: new Date().toISOString() })
            .eq('id', pending.id)
        : Promise.resolve(),
    ])
    setPenalty(null)
    loadPenaltyData(subscriber.email)
  }

  useEffect(() => {
    if (!subscriber || !open) return
    supabase
      .from('orders')
      .select('id, product_id, start_date, due_date, status, amount')
      .eq('subscriber_id', subscriber.id)
      .order('created_at', { ascending: false })
      .then(async ({ data: orderRows }) => {
        if (!orderRows?.length) { setSheetOrders([]); return }
        const productIds = [...new Set(orderRows.map((o) => o.product_id))]
        const { data: productRows } = await supabase
          .from('products')
          .select('id, title')
          .in('id', productIds)
        const productMap = Object.fromEntries((productRows ?? []).map((p) => [p.id, p.title]))
        setSheetOrders(orderRows.map((o) => ({
          id: o.id,
          productTitle: productMap[o.product_id] ?? `Product #${o.product_id}`,
          startDate: o.start_date,
          dueDate: o.due_date,
          status: o.status as OrderStatus,
          amount: o.amount,
        })))
      })
  }, [subscriber?.id, open])

  if (!subscriber) return null

  const totalSpent = sheetOrders.reduce((sum, o) => sum + o.amount, 0)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="pb-4">
          <SheetTitle>Subscriber profile</SheetTitle>
          <SheetDescription>Full account details and rental history.</SheetDescription>
        </SheetHeader>

        {/* Identity */}
        <div className="mx-6 mb-5 flex items-center gap-4">
          <Avatar className="size-14">
            <AvatarFallback className="text-lg">{initials(subscriber.name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <p className="font-semibold">{subscriber.name}</p>
            <p className="text-sm text-muted-foreground">{subscriber.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={cn('capitalize text-xs', planColors[subscriber.plan])}>
                {subscriber.plan}
              </Badge>
              <Badge className={cn('capitalize text-xs', subscriberStatusColors[subscriber.status])}>
                {subscriber.status}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-0 px-6">
          {/* Account info */}
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account</p>
          <div className="rounded-lg border divide-y">
            <Row label="Member since" value={subscriber.joined} />
            <Row label="Sets rented" value={subscriber.setsRented} />
            <Row
              label="Monthly spend"
              value={subscriber.monthlySpend > 0 ? `€${subscriber.monthlySpend}/mo` : <span className="text-muted-foreground">—</span>}
            />
            <Row
              label="Total spent"
              value={totalSpent > 0 ? `€${totalSpent}` : <span className="text-muted-foreground">—</span>}
            />
          </div>

          {/* Rental history */}
          {sheetOrders.length > 0 && (
            <>
              <Separator className="my-5" />
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Rental history ({sheetOrders.length})
              </p>
              <div className="flex flex-col gap-2">
                {sheetOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-medium truncate">{order.productTitle}</span>
                      <span className="text-xs text-muted-foreground">{order.startDate} → {order.dueDate}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={cn('capitalize text-xs', orderStatusColors[order.status])}>
                        {order.status}
                      </Badge>
                      <span className="text-xs tabular-nums text-muted-foreground">€{order.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <Separator className="my-5" />

          {/* Status actions */}
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Manage subscription</p>
          <div className="flex flex-wrap gap-2">
            {statusActions
              .filter((a) => a.status !== subscriber.status)
              .map((a) => (
                <Button
                  key={a.status}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onStatusChange(subscriber, a.status)
                    onOpenChange(false)
                  }}
                >
                  {a.label}
                </Button>
              ))}
          </div>

          <Separator className="my-5" />

          {/* Penalty */}
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Penalty</p>
          {penalty ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-destructive">€{penalty.amount.toFixed(2)} outstanding</span>
                </div>
                <Button variant="ghost" size="sm" className="text-muted-foreground h-7 px-2 text-xs" onClick={clearPenalty}>
                  Clear
                </Button>
              </div>
              {penalty.reason && (
                <p className="text-sm text-muted-foreground border-t pt-3">{penalty.reason}</p>
              )}
            </div>
          ) : penaltyStep === 'idle' ? (
            <Button variant="outline" size="sm" onClick={() => setPenaltyStep('setting')}>
              Set penalty
            </Button>
          ) : (
            <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Amount (€)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 15.00"
                  value={penaltyAmount}
                  onChange={(e) => setPenaltyAmount(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Reason <span className="opacity-50">(optional)</span></label>
                <Textarea
                  placeholder="e.g. Missing bricks in returned set"
                  rows={2}
                  className="text-sm resize-none"
                  value={penaltyReason}
                  onChange={(e) => setPenaltyReason(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  disabled={!penaltyAmount || parseFloat(penaltyAmount) <= 0}
                  onClick={savePenalty}
                >
                  Apply penalty
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setPenaltyStep('idle'); setPenaltyAmount(''); setPenaltyReason('') }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Penalty history */}
          {penaltyHistory.length > 0 && (
            <>
              <p className="mt-4 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Penalty history
              </p>
              <div className="flex flex-col gap-2">
                {penaltyHistory.map((p) => (
                  <div key={p.id} className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-semibold">€{Number(p.amount).toFixed(2)}</span>
                      {p.reason && <span className="text-xs text-muted-foreground truncate">{p.reason}</span>}
                      <span className="text-xs text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString()}
                        {p.resolved_at && ` → ${new Date(p.resolved_at).toLocaleDateString()}`}
                      </span>
                    </div>
                    <span className={[
                      'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize',
                      p.status === 'paid' && 'bg-green-100 text-green-700',
                      p.status === 'forgiven' && 'bg-blue-100 text-blue-700',
                      p.status === 'pending' && 'bg-red-100 text-red-700',
                    ].filter(Boolean).join(' ')}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

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
