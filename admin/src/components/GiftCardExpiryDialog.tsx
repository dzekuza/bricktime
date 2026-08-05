import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Tables } from "@/lib/database.types"

type GiftCard = Tables<"gift_cards">

type GiftCardExpiryDialogProps = {
  giftCard: GiftCard | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (id: string, expiresAt: string) => Promise<void>
}

export function GiftCardExpiryDialog({
  giftCard,
  open,
  onOpenChange,
  onSave,
}: GiftCardExpiryDialogProps) {
  const [expiresAt, setExpiresAt] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (giftCard) setExpiresAt(giftCard.expires_at.slice(0, 10))
  }, [giftCard])

  if (!giftCard) return null

  async function handleSave() {
    if (!giftCard || !expiresAt) return
    setSaving(true)
    await onSave(giftCard.id, new Date(expiresAt).toISOString())
    setSaving(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pratęsti galiojimą</DialogTitle>
          <DialogDescription>
            Dovanų kortelė <span className="font-mono">{giftCard.code}</span>{" "}
            galioja iki{" "}
            {new Date(giftCard.expires_at).toLocaleDateString("lt-LT")}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="gift-card-expiry">Nauja galiojimo data</Label>
          <Input
            id="gift-card-expiry"
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Atšaukti
          </Button>
          <Button onClick={handleSave} disabled={saving || !expiresAt}>
            {saving ? "Saugoma…" : "Išsaugoti"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
