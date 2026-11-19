import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { setTrackingCode } from "@/lib/lpexpress"

interface ManualTrackingFormProps {
  orderIds: string[]
  onSaved: (barcode: string) => void
}

/** For shipments the admin created on the LP Express site: store its code so tracking works. */
export function ManualTrackingForm({
  orderIds,
  onSaved,
}: ManualTrackingFormProps) {
  const [barcode, setBarcode] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    const code = barcode.trim()
    if (!code) {
      setError("Enter the shipping code")
      return
    }
    setBusy(true)
    setError(null)
    try {
      const saved = await setTrackingCode(orderIds, code)
      onSaved(saved)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">
        Already shipped on the LP Express site? Enter the shipping code instead.
      </p>
      <div className="flex gap-2">
        <Input
          aria-label="Shipping code"
          placeholder="Shipping code"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          className="h-9 font-mono"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => void handleSave()}
          disabled={busy}
        >
          {busy ? "Saving…" : "Save code"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
