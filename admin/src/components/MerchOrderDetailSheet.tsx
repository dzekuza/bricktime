import { useEffect, useState } from "react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabase"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  MERCH_ORDER_STATUS_LABEL,
  STOCK_SHORT_HINT,
  MERCH_ORDER_STATUS_VARIANT,
  type MerchOrder,
  type MerchOrderPatch,
  type MerchOrderStatus,
} from "@/lib/merch-orders"

interface ShippingAddress {
  line1?: string | null
  line2?: string | null
  postal_code?: string | null
  city?: string | null
  country?: string | null
}

interface OrderLine {
  id: string
  item_name: string
  size: string
  quantity: number
  unit_price: number
}

interface MerchOrderDetailSheetProps {
  order: MerchOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (order: MerchOrder, patch: MerchOrderPatch) => Promise<boolean>
}

export function MerchOrderDetailSheet({
  order,
  open,
  onOpenChange,
  onSave,
}: MerchOrderDetailSheetProps) {
  const [status, setStatus] = useState<MerchOrderStatus>("paid")
  const [tracking, setTracking] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  // The items to pack. Null while loading; an empty list means an order placed
  // before carts existed, which is one item shown from the order itself.
  const [lines, setLines] = useState<OrderLine[] | null>(null)

  useEffect(() => {
    if (!order) return
    setStatus(order.status as MerchOrderStatus)
    setTracking(order.tracking_number ?? "")
  }, [order])

  const orderId = order?.id
  useEffect(() => {
    if (!orderId) return
    let isCancelled = false
    setLines(null)
    supabase
      .from("merch_order_items")
      .select("id, item_name, size, quantity, unit_price")
      .eq("order_id", orderId)
      .order("created_at")
      .then(({ data, error }) => {
        if (isCancelled) return
        if (error) console.error("Merch order lines failed:", error.message)
        setLines(data ?? [])
      })
    return () => {
      isCancelled = true
    }
  }, [orderId])

  if (!order) return null

  const address = (order.shipping_address ?? null) as ShippingAddress | null
  const addressLines = address
    ? [
        address.line1,
        address.line2,
        [address.postal_code, address.city].filter(Boolean).join(" "),
        address.country,
      ].filter(Boolean)
    : []

  const isDirty =
    status !== order.status || tracking !== (order.tracking_number ?? "")

  async function handleSave() {
    if (!order) return
    setIsSaving(true)
    const isNowShipped = status === "shipped" && order.status !== "shipped"
    await onSave(order, {
      status,
      tracking_number: tracking.trim() || null,
      ...(isNowShipped ? { shipped_at: new Date().toISOString() } : {}),
    })
    setIsSaving(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="pb-4">
          <SheetTitle>Merch order #{order.order_number}</SheetTitle>
          <SheetDescription>
            Placed {new Date(order.created_at).toLocaleString("lt-LT")}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 pb-6">
          <DetailSection
            title={lines && lines.length > 1 ? "Items to pack" : "Item"}
          >
            {lines === null ? (
              <p className="text-sm text-muted-foreground">Loading items…</p>
            ) : lines.length === 0 ? (
              <p className="text-sm font-medium">
                {order.item_name} · size {order.size}
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {lines.map((line) => (
                  <li
                    key={line.id}
                    className="flex items-baseline justify-between gap-3 text-sm"
                  >
                    <span className="font-medium">
                      {line.quantity} × {line.item_name}
                      <span className="text-muted-foreground">
                        {" "}
                        · size {line.size}
                      </span>
                    </span>
                    <span className="shrink-0 text-muted-foreground tabular-nums">
                      €{(Number(line.unit_price) * line.quantity).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-sm text-muted-foreground">
              {lines && lines.length > 0
                ? `${lines.reduce((sum, l) => sum + l.quantity, 0)} pieces · `
                : ""}
              Paid €{Number(order.amount).toFixed(2)}
            </p>
            <Badge
              variant={
                MERCH_ORDER_STATUS_VARIANT[order.status as MerchOrderStatus]
              }
              className="w-fit"
            >
              {MERCH_ORDER_STATUS_LABEL[order.status as MerchOrderStatus]}
            </Badge>
            {order.stock_short && (
              <p className="text-sm text-destructive">{STOCK_SHORT_HINT}</p>
            )}
          </DetailSection>

          <Separator />

          <DetailSection title="Ship to">
            <p className="text-sm font-medium">{order.buyer_name ?? "—"}</p>
            <p className="text-sm text-muted-foreground">
              {order.delivery_method === "terminal"
                ? `Parcel terminal: ${order.lp_terminal_name ?? "—"}`
                : "Courier to the address"}
            </p>
            {addressLines.map((line) => (
              <p key={line} className="text-sm text-muted-foreground">
                {line}
              </p>
            ))}
            {order.buyer_email && (
              <p className="text-sm text-muted-foreground">
                {order.buyer_email}
              </p>
            )}
            {order.buyer_phone && (
              <p className="text-sm text-muted-foreground">
                {order.buyer_phone}
              </p>
            )}
          </DetailSection>

          <Separator />

          <DetailSection title="Fulfilment">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="merch-order-status">Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as MerchOrderStatus)}
              >
                <SelectTrigger id="merch-order-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.keys(MERCH_ORDER_STATUS_LABEL) as MerchOrderStatus[]
                  ).map((s) => (
                    <SelectItem key={s} value={s}>
                      {MERCH_ORDER_STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="merch-order-tracking">Tracking number</Label>
              <Input
                id="merch-order-tracking"
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                placeholder="e.g. CE123456789LT"
              />
            </div>
            <Button
              onClick={() => void handleSave()}
              disabled={!isDirty || isSaving}
            >
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </DetailSection>

          <p className="text-xs break-all text-muted-foreground">
            Stripe session: {order.stripe_session_id}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function DetailSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </p>
      {children}
    </div>
  )
}
