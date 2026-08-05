import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
  productId: number
  productTitle: string
  subscriberId: string
}

interface FormState {
  legoSetCode: string
  partCode: string
  bagNumber: string
  quantity: string
}

const empty: FormState = {
  legoSetCode: "",
  partCode: "",
  bagNumber: "",
  quantity: "",
}

export function MissingPartDialog({
  open,
  onOpenChange,
  orderId,
  productId,
  productTitle,
  subscriberId,
}: Props) {
  const [form, setForm] = useState<FormState>(empty)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function field(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const isValid =
    form.legoSetCode.trim() &&
    form.partCode.trim() &&
    form.bagNumber.trim() &&
    Number(form.quantity) > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return
    setSubmitting(true)
    setError(null)
    const { error: err } = await supabase.from("missing_part_requests").insert({
      subscriber_id: subscriberId,
      order_id: orderId,
      product_id: productId,
      lego_set_code: form.legoSetCode.trim(),
      part_code: form.partCode.trim(),
      bag_number: form.bagNumber.trim(),
      quantity: Number(form.quantity),
    })
    setSubmitting(false)
    if (err) {
      setError("Nepavyko išsiųsti. Bandyk dar kartą.")
      return
    }
    setSubmitted(true)
  }

  function handleClose(open: boolean) {
    if (!open) {
      setForm(empty)
      setSubmitted(false)
      setError(null)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="brick-card w-[calc(100vw-2rem)] max-w-[420px] gap-0 border-0 bg-paper p-5 shadow-none sm:p-6">
        <DialogTitle className="heading-display text-d-xs text-ink">
          Trūkstama detalė
        </DialogTitle>
        <DialogDescription className="mt-1.5 text-[13px] leading-[1.6] text-ink/50">
          {productTitle}
        </DialogDescription>

        {submitted ? (
          <div className="mt-5 rounded-2xl border-2 border-brand-mint bg-brand-mint/10 p-5 text-center">
            <p className="font-display text-[22px] text-ink">✓ Išsiųsta!</p>
            <p className="mt-1 text-[13px] text-ink/60">
              Mes susisieksime su tavimi dėl trūkstamos detalės.
            </p>
            <Button
              className="mt-4 rounded-full border-2 border-ink bg-ink text-[13px] font-bold text-paper"
              onClick={() => handleClose(false)}
            >
              Uždaryti
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="label-mono text-ink/50">
                  LEGO® set kodas
                </Label>
                <Input
                  placeholder="pvz. 75192"
                  value={form.legoSetCode}
                  onChange={field("legoSetCode")}
                  className="rounded-xl border-2 border-ink bg-transparent text-[14px] text-ink"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="label-mono text-ink/50">Detalės kodas</Label>
                <Input
                  placeholder="pvz. 3001"
                  value={form.partCode}
                  onChange={field("partCode")}
                  className="rounded-xl border-2 border-ink bg-transparent text-[14px] text-ink"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="label-mono text-ink/50">Maišiuko nr.</Label>
                <Input
                  placeholder="pvz. 3"
                  value={form.bagNumber}
                  onChange={field("bagNumber")}
                  className="rounded-xl border-2 border-ink bg-transparent text-[14px] text-ink"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="label-mono text-ink/50">Kiekis</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="1"
                  value={form.quantity}
                  onChange={field("quantity")}
                  className="rounded-xl border-2 border-ink bg-transparent text-[14px] text-ink"
                />
              </div>
            </div>

            {error && <p className="text-[12px] text-rose-600">{error}</p>}

            <div className="mt-1 flex flex-col gap-2">
              <Button
                type="submit"
                size="lg"
                disabled={!isValid || submitting}
                className="brick-hover-sm w-full rounded-full border-2 border-ink bg-ink text-[15px] font-bold text-paper disabled:opacity-40"
              >
                {submitting ? "Siunčiama…" : "Siųsti pranešimą"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full rounded-full border-2 border-ink bg-transparent text-[15px] font-bold text-ink hover:bg-ink/5"
                onClick={() => handleClose(false)}
                disabled={submitting}
              >
                Atšaukti
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
