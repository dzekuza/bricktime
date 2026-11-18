import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface CancelSubscriptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  periodEnd: string | null
  busy: boolean
  onConfirm: () => void
}

export function CancelSubscriptionDialog({
  open,
  onOpenChange,
  periodEnd,
  busy,
  onConfirm,
}: CancelSubscriptionDialogProps) {
  const endLabel = periodEnd
    ? new Date(periodEnd).toLocaleDateString("lt-LT")
    : null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atšaukti prenumeratą?</DialogTitle>
          <DialogDescription>
            {endLabel
              ? `Prenumerata galios iki ${endLabel}, po to nebebus nuskaitoma. `
              : "Prenumerata galios iki apmokėto laikotarpio pabaigos, po to nebebus nuskaitoma. "}
            Jei dar turi nuomojamų rinkinių, prenumeratą atšauksime, kai
            grąžinsi visus – iki tol mokestis tęsiasi.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Palikti
          </Button>
          <Button onClick={onConfirm} disabled={busy}>
            {busy ? "Atšaukiama…" : "Taip, atšaukti"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
