import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ParcelOptionsFields } from "@/components/ParcelOptionsFields"
import { createLabel, toWeightGrams, type ParcelSize } from "@/lib/lpexpress"
import type { Order } from "@/data/orders"

interface ShipTogetherDialogProps {
  orders: Order[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onShipped: (orderIds: string[], barcode: string | null) => void
}

/** Why these orders can't share one parcel, or null when they can. */
function getBlocker(orders: Order[]): string | null {
  const [first] = orders
  if (!first) return "No orders selected."
  if (orders.length < 2) return "Select at least two orders."
  if (orders.some((o) => o.barcode))
    return "Some selected orders already have a label."
  if (orders.some((o) => o.status !== "processing"))
    return "Only orders in processing can be shipped."
  if (orders.some((o) => o.subscriberEmail !== first.subscriberEmail))
    return "Orders belong to different customers."
  if (orders.some((o) => !!o.homeDelivery !== !!first.homeDelivery))
    return "Mix of courier and locker orders."
  if (first.homeDelivery) {
    if (
      orders.some(
        (o) => !o.deliveryAddress || o.deliveryAddress !== first.deliveryAddress
      )
    )
      return "Orders have different (or missing) delivery addresses."
  } else if (
    orders.some((o) => !o.terminalName || o.terminalName !== first.terminalName)
  ) {
    return "Orders have different (or missing) lockers."
  }
  return null
}

export function ShipTogetherDialog({
  orders,
  open,
  onOpenChange,
  onShipped,
}: ShipTogetherDialogProps) {
  const [phone, setPhone] = useState("")
  const [size, setSize] = useState<ParcelSize>("L")
  const [weightKg, setWeightKg] = useState("3")
  const [courierPickup, setCourierPickup] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const first = orders[0]
  const blocker = open ? getBlocker(orders) : null

  useEffect(() => {
    if (!open) return
    setPhone(first?.deliveryPhone ?? "")
    setSize("L")
    setWeightKg("3")
    setCourierPickup(false)
    setError(null)
  }, [open, first?.id, first?.deliveryPhone])

  async function handleShip() {
    if (!first || blocker) return
    const p = phone.trim()
    if (!/^\+?\d{8,15}$/.test(p)) {
      setError("Enter a valid phone (e.g. +37060000000)")
      return
    }
    const weight = first.homeDelivery ? toWeightGrams(weightKg) : undefined
    if (first.homeDelivery && weight === undefined) {
      setError("Enter a weight between 0.1 and 30 kg")
      return
    }

    setBusy(true)
    setError(null)
    try {
      const ids = orders.map((o) => o.id)
      const res = await createLabel({
        orderId: first.id,
        orderIds: ids,
        receiver: {
          name: first.subscriberName,
          phone: p,
          email: first.subscriberEmail,
        },
        ...(first.homeDelivery ? { weight } : { size, courierPickup }),
      })
      onShipped(ids, res.barcode)
      onOpenChange(false)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ship {orders.length} sets in one parcel</DialogTitle>
          <DialogDescription>
            {first
              ? `${first.subscriberName} — ${first.homeDelivery ? first.deliveryAddress : first.terminalName}`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <ul className="list-disc pl-5 text-sm text-muted-foreground">
          {orders.map((o) => (
            <li key={o.id}>{o.productTitle}</li>
          ))}
        </ul>

        {blocker ? (
          <p className="text-sm text-destructive">{blocker}</p>
        ) : (
          <div className="flex flex-col gap-3">
            <ParcelOptionsFields
              homeDelivery={!!first?.homeDelivery}
              size={size}
              onSizeChange={setSize}
              weightKg={weightKg}
              onWeightKgChange={setWeightKg}
              courierPickup={courierPickup}
              onCourierPickupChange={setCourierPickup}
            />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ship-together-phone">Customer phone</Label>
              <Input
                id="ship-together-phone"
                placeholder="+37060000000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleShip()}
            disabled={busy || !!blocker}
          >
            {busy ? "Generating…" : "Generate one label"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
