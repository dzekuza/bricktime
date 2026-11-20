import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"

import { MysteryBoxRequestDialog } from "@/components/account/MysteryBoxRequestDialog"
import type { RentedOrder } from "@/components/account/RentedOrderCard"
import { useBillingCountdown } from "@/hooks/useBillingCountdown"
import { usePaidCourierReturn } from "@/hooks/usePaidCourierReturn"
import { supabase } from "@/lib/supabase"

interface MysteryBoxRequestProps {
  userId: string
  orders: RentedOrder[]
  onRequested: () => void
}

interface BillingWindow {
  windowStart: string | null
  windowEnd: string | null
}

/** "Order a Mystery Box" card for Mystery plans, with the countdown to the next allowed request. */
export function MysteryBoxRequest({
  userId,
  orders,
  onRequested,
}: MysteryBoxRequestProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [billingWindow, setBillingWindow] = useState<BillingWindow | null>(null)

  useEffect(() => {
    void supabase
      .rpc("billing_window", { p_subscriber_id: userId })
      .then(({ data }) => {
        const row = data?.[0]
        setBillingWindow({
          windowStart: row?.window_start ?? null,
          windowEnd: row?.window_end ?? null,
        })
      })
  }, [userId, orders.length])

  // Back from Stripe after the courier fee: wait for the webhook's order.
  const [params] = useSearchParams()
  const returnSessionId =
    params.get("mystery_paid") === "true" ? params.get("session_id") : null
  const paidReturn = usePaidCourierReturn(userId, returnSessionId)
  useEffect(() => {
    if (paidReturn === "placed") onRequested()
  }, [paidReturn, onRequested])

  const mysteryOrders = orders.filter((o) => o.isMystery)
  const holdsBox = mysteryOrders.some((o) => o.status !== "returned")
  const windowStart = billingWindow?.windowStart ?? null
  const usedThisPeriod =
    windowStart !== null &&
    mysteryOrders.some((o) => new Date(o.createdAt) >= new Date(windowStart))
  const countdown = useBillingCountdown(
    usedThisPeriod ? (billingWindow?.windowEnd ?? null) : null
  )
  const canRequest = billingWindow !== null && !holdsBox && !usedThisPeriod

  const hint = (() => {
    if (paidReturn === "waiting") return "Apdorojame tavo apmokėjimą…"
    if (paidReturn === "missing")
      return "Užsakymo sukurti nepavyko, mokestis bus grąžintas. Bandyk dar kartą arba susisiek su mumis."
    if (canRequest) return "Užsakyk kitą Mystery Box – rinkinį parinksime mes."
    if (countdown)
      return holdsBox
        ? `Kitą Mystery Box galėsi užsisakyti po ${countdown}, jei grąžinsi turimą rinkinį.`
        : `Kitą Mystery Box galėsi užsisakyti po ${countdown}.`
    if (holdsBox)
      return "Grąžink turimą Mystery Box, kad galėtum užsisakyti kitą."
    return "Kraunama…"
  })()

  return (
    <div className="brick-card mt-6 flex flex-col gap-3 bg-brand-yellow p-5 md:flex-row md:items-center md:justify-between md:p-6">
      <div>
        <p className="label-mono text-ink/60">Mystery Box</p>
        <p className="mt-1 text-[15px] font-bold text-ink">{hint}</p>
      </div>
      <button
        onClick={() => setDialogOpen(true)}
        disabled={!canRequest || paidReturn === "waiting"}
        className="brick-hover-sm rounded-full border-2 border-ink bg-ink px-5 py-2.5 text-[13px] font-bold text-paper transition-all disabled:cursor-not-allowed disabled:opacity-40"
      >
        Užsakyti Mystery Box
      </button>
      <MysteryBoxRequestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onRequested={onRequested}
      />
    </div>
  )
}
