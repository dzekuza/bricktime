import { useState } from "react"

import { TerminalPicker } from "@/components/TerminalPicker"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { useSavedTerminal } from "@/hooks/useSavedTerminal"
import { readFunctionError } from "@/lib/function-error"
import { RENTAL_COURIER_FEE } from "@/lib/rental"
import { supabase } from "@/lib/supabase"

type Delivery = "locker" | "courier"

interface MysteryBoxRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRequested: () => void
}

// The request rules' reasons, in the member's words.
function toMysteryErrorMessage(reason: string): string {
  if (reason.includes("already requested")) {
    return "Šiame atsiskaitymo laikotarpyje Mystery Box jau užsakytas."
  }
  if (reason.includes("Return your current")) {
    return "Pirma grąžink turimą Mystery Box."
  }
  if (reason.includes("paused")) {
    return "Prenumerata pristabdyta – atnaujink ją paskyroje."
  }
  if (reason.includes("ends too soon")) {
    return "Prenumerata greitai baigiasi – naujų užsakymų pradėti nebegalima."
  }
  if (reason.includes("full address")) {
    return "Pristatymui į duris reikia vardo, telefono ir pilno adreso."
  }
  if (reason.includes("parcel locker")) {
    return "Pasirink paštomatą."
  }
  return "Užsakymo pateikti nepavyko. Bandyk dar kartą arba susisiek su mumis."
}

/** Delivery choice for a Mystery Box request: locker is free, courier is paid through Stripe. */
export function MysteryBoxRequestDialog({
  open,
  onOpenChange,
  onRequested,
}: MysteryBoxRequestDialogProps) {
  const [terminal, setTerminal] = useSavedTerminal()
  const [delivery, setDelivery] = useState<Delivery>("locker")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setSubmitting(true)
    setError(null)

    if (delivery === "courier") {
      const origin = window.location.origin
      const { data, error: checkoutError } = await supabase.functions.invoke(
        "create-mystery-courier-checkout",
        {
          body: {
            successUrl: `${origin}/account?mystery_paid=true&session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${origin}/account`,
          },
        }
      )
      if (checkoutError || !data?.url) {
        setSubmitting(false)
        setError(
          toMysteryErrorMessage(await readFunctionError(checkoutError, ""))
        )
        return
      }
      window.location.assign(data.url)
      return
    }

    const { error: rpcError } = await supabase.rpc("request_mystery_box", {
      p_terminal_id: terminal?.id,
      p_terminal_name: terminal?.name,
    })
    setSubmitting(false)
    if (rpcError) {
      setError(toMysteryErrorMessage(rpcError.message))
      return
    }
    onRequested()
    onOpenChange(false)
  }

  const optionClass = (isSelected: boolean) =>
    `flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 text-left text-[14px] font-bold text-ink transition-colors ${
      isSelected
        ? "border-ink bg-brand-yellow"
        : "border-ink/20 hover:border-ink"
    }`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="brick-card max-w-md bg-paper p-6">
        <DialogTitle className="heading-display text-d-xs text-ink">
          Užsakyti Mystery Box
        </DialogTitle>
        <DialogDescription className="mt-1 text-[13px] text-ink/60">
          Rinkinį parinksime mes. Pasirink, kur jį pristatyti.
        </DialogDescription>

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setDelivery("locker")}
            className={optionClass(delivery === "locker")}
          >
            <span>Paštomatas</span>
            <span className="font-mono text-[12px]">nemokamai</span>
          </button>
          <button
            type="button"
            onClick={() => setDelivery("courier")}
            className={optionClass(delivery === "courier")}
          >
            <span>Kurjeris į duris</span>
            <span className="font-mono text-[12px]">
              {RENTAL_COURIER_FEE} €
            </span>
          </button>
        </div>

        {delivery === "locker" && (
          <div className="mt-4">
            <p className="label-mono mb-1 text-ink/40">Paštomatas</p>
            <TerminalPicker value={terminal} onChange={setTerminal} />
          </div>
        )}
        {delivery === "courier" && (
          <p className="mt-4 text-[12px] text-ink/50">
            Pristatysime į paskyroje nurodytą adresą. Užsakymas bus sukurtas
            apmokėjus {RENTAL_COURIER_FEE} € pristatymo mokestį.
          </p>
        )}

        {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}

        <button
          onClick={() => void submit()}
          disabled={submitting || (delivery === "locker" && !terminal)}
          className="brick-hover-sm mt-6 flex w-full items-center justify-between rounded-[24px] border-2 border-ink bg-brand-orange px-6 py-3.5 text-paper transition-all disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="font-display text-[20px] leading-none">
            {submitting
              ? "Vykdoma…"
              : delivery === "courier"
                ? `Apmokėti ${RENTAL_COURIER_FEE} € ir užsakyti`
                : "Užsakyti"}
          </span>
          <span className="font-display text-[28px] leading-none">→</span>
        </button>
      </DialogContent>
    </Dialog>
  )
}
