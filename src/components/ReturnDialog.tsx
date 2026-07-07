import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { TerminalPicker } from "@/components/TerminalPicker"
import { createReturnLabel, fetchLabelPdf, downloadPdf, type LpTerminal } from "@/lib/lpexpress"

interface ReturnDialogProps {
  orderId: string | null
  productTitle?: string
  defaultName: string
  defaultPhone?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after a return label is created — passes the return barcode so the parent can update its state. */
  onComplete: (orderId: string, barcode: string | null) => void
}

/** Prepaid-return flow: customer picks the paštomatas they'll drop the parcel at
 *  + a contact phone, we generate the return label and set the order to
 *  return_requested. */
export function ReturnDialog({ orderId, productTitle, defaultName, defaultPhone = "", open, onOpenChange, onComplete }: ReturnDialogProps) {
  const [terminal, setTerminal] = useState<LpTerminal | null>(null)
  const [phone, setPhone] = useState(defaultPhone)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ barcode: string | null } | null>(null)

  // Prefill the phone from the saved profile each time the dialog opens
  // (the profile may load after this component first mounts).
  useEffect(() => {
    if (open) setPhone(defaultPhone)
  }, [open, defaultPhone])

  function reset() {
    setTerminal(null)
    setPhone(defaultPhone)
    setError(null)
    setDone(null)
    setSubmitting(false)
  }

  async function submit() {
    if (!orderId || !terminal) return
    const trimmed = phone.trim()
    if (!/^\+?\d{8,15}$/.test(trimmed)) {
      setError("Įvesk teisingą telefono numerį (pvz. +37060000000)")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await createReturnLabel({
        orderId,
        terminalId: terminal.id,
        customer: { name: defaultName, phone: trimmed },
      })
      setDone({ barcode: res.barcode })
      onComplete(orderId, res.barcode)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  async function downloadLabel() {
    if (!orderId) return
    try {
      const base64 = await fetchLabelPdf(orderId, "return")
      downloadPdf(base64, `grazinimo-etikete-${orderId.slice(0, 8)}.pdf`)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
    >
      <DialogContent className="max-w-md brick-card bg-paper p-6">
        {!done ? (
          <>
            <DialogTitle className="heading-display text-d-xs text-ink">Grąžinti rinkinį</DialogTitle>
            <DialogDescription className="mt-1 text-[13px] text-ink/60">
              {productTitle ? `„${productTitle}" — ` : ""}pasirink paštomatą, į kurį nuneši siuntą. Sugeneruosim
              iš anksto apmokėtą grąžinimo etiketę.
            </DialogDescription>

            <div className="mt-5">
              <p className="label-mono mb-1 text-ink/40">Paštomatas</p>
              <TerminalPicker value={terminal} onChange={setTerminal} />
            </div>

            <div className="mt-4">
              <label className="label-mono mb-1 block text-ink/40">Telefono nr.</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+37060000000"
                className="w-full rounded-2xl border-2 border-ink/20 bg-paper px-5 py-3.5 font-mono text-[14px] text-ink outline-none focus:border-ink"
              />
              <p className="mt-1 text-[11px] text-ink/40">Reikalingas paštomato SMS kodui.</p>
            </div>

            {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}

            <button
              onClick={submit}
              disabled={!terminal || submitting}
              className="brick-hover-sm mt-6 flex w-full items-center justify-between rounded-[24px] border-2 border-ink bg-brand-orange px-6 py-3.5 text-paper transition-all disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="font-display text-[20px] leading-none">
                {submitting ? "Generuojama…" : "Gauti grąžinimo etiketę"}
              </span>
              <span className="font-display text-[28px] leading-none">→</span>
            </button>
          </>
        ) : (
          <>
            <DialogTitle className="heading-display text-d-xs text-ink">Etiketė paruošta ✓</DialogTitle>
            <DialogDescription className="mt-1 text-[13px] text-ink/60">
              Supakuok rinkinį, nunešk į pasirinktą paštomatą ir priklijuok etiketę.
            </DialogDescription>
            {done.barcode && (
              <p className="mt-4 rounded-xl border-2 border-ink/10 bg-ink/[.02] px-4 py-3 font-mono text-[13px] text-ink">
                Siuntos nr. <span className="font-bold">{done.barcode}</span>
              </p>
            )}
            {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}
            <button
              onClick={downloadLabel}
              className="brick-hover-sm mt-5 w-full rounded-[24px] border-2 border-ink bg-ink px-6 py-3.5 font-display text-[20px] text-paper transition-all"
            >
              Atsisiųsti etiketę (PDF)
            </button>
            <button
              onClick={() => onOpenChange(false)}
              className="mt-2 w-full rounded-[24px] border-2 border-ink/20 px-6 py-3 font-mono text-[13px] font-bold text-ink/60 transition-colors hover:border-ink hover:text-ink"
            >
              Uždaryti
            </button>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
