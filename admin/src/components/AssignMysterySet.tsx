import { useState } from "react"
import { Button } from "@/components/ui/button"
import { SetPicker } from "@/components/SetPicker"
import type { Order } from "@/data/orders"
import type { ParcelSize } from "@/lib/lpexpress"
import { supabase } from "@/lib/supabase"

interface AssignMysterySetProps {
  order: Order
  onAssigned: (orderId: string, patch: Partial<Order>) => void
}

const RENTAL_DAYS = 30
const toDateString = (d: Date) => d.toISOString().slice(0, 10)

/** Picks the set for a Mystery Box request and moves the order on to processing. */
export function AssignMysterySet({ order, onAssigned }: AssignMysterySetProps) {
  const [productId, setProductId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAssign() {
    if (productId === null) return
    setBusy(true)
    setError(null)
    const today = new Date()
    const due = new Date(today)
    due.setDate(due.getDate() + RENTAL_DAYS)
    const startDate = toDateString(today)
    const dueDate = toDateString(due)

    // The status guard keeps a double click (or a second admin) from assigning twice.
    const { data, error: updateError } = await supabase
      .from("orders")
      .update({
        product_id: productId,
        status: "processing",
        start_date: startDate,
        due_date: dueDate,
      })
      .eq("id", order.id)
      .eq("status", "requested")
      .select("id")
    if (updateError || !data?.length) {
      setBusy(false)
      setError(
        updateError?.message.includes("fully rented out")
          ? "That set is fully rented out."
          : (updateError?.message ?? "This request was already handled.")
      )
      return
    }

    const { data: product } = await supabase
      .from("products")
      .select("title, shipping_size")
      .eq("id", productId)
      .maybeSingle()
    setBusy(false)
    onAssigned(order.id, {
      productId,
      productTitle: product?.title ?? `Product #${productId}`,
      productShippingSize: product?.shipping_size as ParcelSize | undefined,
      status: "processing",
      startDate,
      dueDate,
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <p className="text-sm text-muted-foreground">
        {order.subscriberName} asked for a Mystery Box. Pick the set to send;
        the order then moves to processing and can be shipped.
      </p>
      <SetPicker
        customerId={order.subscriberId ?? null}
        customerPlan={order.planName ?? null}
        value={productId}
        onChange={setProductId}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        onClick={() => void handleAssign()}
        disabled={busy || productId === null}
      >
        {busy ? "Assigning…" : "Assign set"}
      </Button>
    </div>
  )
}
