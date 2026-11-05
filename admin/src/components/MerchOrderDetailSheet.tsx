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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  MERCH_ORDER_STATUS_LABEL,
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

  useEffect(() => {
    if (!order) return
    setStatus(order.status as MerchOrderStatus)
    setTracking(order.tracking_number ?? "")
  }, [order])

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
          <DetailSection title="Item">
            <p className="text-sm font-medium">{order.item_name}</p>
            <p className="text-sm text-muted-foreground">
              Size {order.size} · €{Number(order.amount).toFixed(2)}
            </p>
            <Badge
              variant={
                MERCH_ORDER_STATUS_VARIANT[order.status as MerchOrderStatus]
              }
              className="w-fit"
            >
              {MERCH_ORDER_STATUS_LABEL[order.status as MerchOrderStatus]}
            </Badge>
          </DetailSection>

          <Separator />

          <DetailSection title="Ship to">
            <p className="text-sm font-medium">{order.buyer_name ?? "—"}</p>
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
