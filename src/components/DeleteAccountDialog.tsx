import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"

const CONFIRM_PHRASE = "IŠTRINTI"

interface DeleteAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}

export function DeleteAccountDialog({
  open,
  onOpenChange,
  onDeleted,
}: DeleteAccountDialogProps) {
  const [confirmText, setConfirmText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setConfirmText("")
    setError(null)
    setSubmitting(false)
  }

  async function submit() {
    setSubmitting(true)
    setError(null)
    const { data, error: invokeError } = await supabase.functions.invoke<{
      success?: boolean
      error?: string
    }>("delete-account")
    if (invokeError || data?.error) {
      setSubmitting(false)
      setError(
        data?.error ?? invokeError?.message ?? "Nepavyko. Bandyk dar kartą."
      )
      return
    }
    await supabase.auth.signOut()
    onDeleted()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
    >
      <DialogContent className="brick-card max-w-md bg-paper p-6">
        <DialogTitle className="heading-display text-d-xs text-ink">
          Ištrinti paskyrą
        </DialogTitle>
        <DialogDescription className="mt-1 text-[13px] text-ink/60">
          Tai negrįžtama. Bus ištrinti tavo profilis, prenumeratos istorija,
          taškai ir bendruomenės įrašai. Aktyvi prenumerata bus atšaukta
          automatiškai.
        </DialogDescription>

        <div className="mt-5">
          <label className="label-mono mb-1 block text-ink/40">
            Įrašyk „{CONFIRM_PHRASE}", kad patvirtintum
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={CONFIRM_PHRASE}
            className="w-full rounded-2xl border-2 border-ink/20 bg-paper px-5 py-3.5 font-mono text-[14px] text-ink outline-none focus:border-ink"
          />
        </div>

        {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}

        <button
          onClick={submit}
          disabled={confirmText !== CONFIRM_PHRASE || submitting}
          className="brick-hover-sm mt-6 flex w-full items-center justify-between rounded-[24px] border-2 border-ink bg-red-600 px-6 py-3.5 text-paper transition-all disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="font-display text-[20px] leading-none">
            {submitting ? "Trinama…" : "Ištrinti paskyrą negrįžtamai"}
          </span>
          <span className="font-display text-[28px] leading-none">→</span>
        </button>
        <button
          onClick={() => onOpenChange(false)}
          className="mt-2 w-full rounded-[24px] border-2 border-ink/20 px-6 py-3 font-mono text-[13px] font-bold text-ink/60 transition-colors hover:border-ink hover:text-ink"
        >
          Atšaukti
        </button>
      </DialogContent>
    </Dialog>
  )
}
