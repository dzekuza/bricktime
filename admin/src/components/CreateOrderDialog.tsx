import { useEffect, useMemo, useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SetPicker } from "@/components/SetPicker"
import { supabase } from "@/lib/supabase"

interface CustomerOption {
  id: string
  name: string
  lastName: string | null
  email: string
  plan: string
  phone: string | null
  homeDelivery: boolean
  street: string | null
  houseNo: string | null
  flat: string | null
  city: string | null
  postalCode: string | null
  terminalId: string | null
  terminalName: string | null
}

interface CreateOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

// Long set titles must truncate inside the dialog instead of stretching it.
const TRIGGER_CLASS =
  "w-full min-w-0 *:data-[slot=select-value]:block! *:data-[slot=select-value]:truncate"

const RENTAL_DAYS = 30
const isMysteryPlan = (plan: string) => plan.startsWith("mystery")
const toDateString = (d: Date) => d.toISOString().slice(0, 10)

/** Lets an admin place a rental for a customer, e.g. the set picked for a Mystery Box plan. */
export function CreateOrderDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateOrderDialogProps) {
  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [customerSearch, setCustomerSearch] = useState("")
  const [customerId, setCustomerId] = useState("")
  const [productId, setProductId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setCustomerSearch("")
    setCustomerId("")
    setProductId(null)
    setError(null)
    void supabase
      .from("subscribers")
      .select(
        "id, name, last_name, email, plan, phone, home_delivery, street, house_no, flat, city, postal_code, lp_terminal_id, lp_terminal_name"
      )
      .eq("status", "active")
      .order("name")
      .then(({ data: subs }) => {
        setCustomers(
          (subs ?? []).map((s) => ({
            id: s.id,
            name: s.name ?? "",
            lastName: s.last_name,
            email: s.email ?? "",
            plan: s.plan,
            phone: s.phone,
            homeDelivery: s.home_delivery,
            street: s.street,
            houseNo: s.house_no,
            flat: s.flat,
            city: s.city,
            postalCode: s.postal_code,
            terminalId: s.lp_terminal_id,
            terminalName: s.lp_terminal_name,
          }))
        )
      })
  }, [open])

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase()
    if (!q) return customers
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    )
  }, [customers, customerSearch])

  const customer = customers.find((c) => c.id === customerId)
  const delivery = !customer
    ? null
    : customer.homeDelivery
      ? "Home delivery"
      : customer.terminalName
        ? `Locker · ${customer.terminalName}`
        : "No saved locker. Set the delivery when shipping."

  async function handleCreate() {
    if (!customer || productId === null) return
    setBusy(true)
    setError(null)
    const today = new Date()
    const due = new Date(today)
    due.setDate(due.getDate() + RENTAL_DAYS)
    const { error: insertError } = await supabase.from("orders").insert({
      subscriber_id: customer.id,
      product_id: productId,
      amount: 0,
      start_date: toDateString(today),
      due_date: toDateString(due),
      status: "processing",
      is_mystery: isMysteryPlan(customer.plan),
      home_delivery: customer.homeDelivery,
      lp_terminal_id: customer.homeDelivery ? null : customer.terminalId,
      lp_terminal_name: customer.homeDelivery ? null : customer.terminalName,
      delivery_name:
        [customer.name, customer.lastName].filter(Boolean).join(" ") || null,
      delivery_phone: customer.phone,
      ...(customer.homeDelivery && {
        delivery_street: customer.street,
        delivery_house_no: customer.houseNo,
        delivery_flat: customer.flat,
        delivery_city: customer.city,
        delivery_postal_code: customer.postalCode,
      }),
    })
    setBusy(false)
    if (insertError) {
      setError(
        insertError.message.includes("fully rented out")
          ? "That set is fully rented out."
          : insertError.message
      )
      return
    }
    onCreated()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create order</DialogTitle>
          <DialogDescription>
            Place a rental for a customer. Orders on a Mystery Box plan stay
            hidden from the customer until delivered.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="order-customer-search">Customer</Label>
            <Input
              id="order-customer-search"
              placeholder="Search name or email…"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
            />
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger className={TRIGGER_CLASS}>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {filteredCustomers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name || c.email} · {c.plan}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {customer && (
              <p className="text-xs text-muted-foreground">{delivery}</p>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-1.5">
            <Label>Set</Label>
            <SetPicker
              customerId={customerId || null}
              customerPlan={customer?.plan ?? null}
              value={productId}
              onChange={setProductId}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleCreate()}
            disabled={busy || !customer || productId === null}
          >
            {busy ? "Creating…" : "Create order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
