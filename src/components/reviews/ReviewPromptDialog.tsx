import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { ReviewForm } from "@/components/reviews/ReviewForm"

interface ReviewPromptDialogProps {
  productId: number | null
  productTitle?: string
  subscriberId: string
  /** Closes the prompt, whether the review was sent or skipped. */
  onClose: () => void
}

/** Asks for a review of a set right after the customer has arranged its return. */
export function ReviewPromptDialog({
  productId,
  productTitle,
  subscriberId,
  onClose,
}: ReviewPromptDialogProps) {
  return (
    <Dialog open={productId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="brick-card max-w-md bg-paper p-6">
        <DialogTitle className="heading-display text-d-xs text-ink">
          Kaip sekėsi konstruoti?
        </DialogTitle>
        <DialogDescription className="mt-1 text-[13px] text-ink/60">
          {productTitle ? `„${productTitle}" — ` : ""}palik atsiliepimą, tai
          padės kitiems pasirinkti rinkinį.
        </DialogDescription>
        <div className="mt-5">
          {productId !== null && (
            <ReviewForm
              productId={productId}
              subscriberId={subscriberId}
              onSubmitted={onClose}
            />
          )}
        </div>
        <button
          onClick={onClose}
          className="mt-2 w-full rounded-[24px] border-2 border-ink/20 px-6 py-3 font-mono text-[13px] font-bold text-ink/60 transition-colors hover:border-ink hover:text-ink"
        >
          Vėliau
        </button>
      </DialogContent>
    </Dialog>
  )
}
