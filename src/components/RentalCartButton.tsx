import { useState } from "react"
import { Link } from "react-router-dom"
import { CheckIcon, ShoppingBagIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useRentalCart } from "@/hooks/useRentalCart"

type RentalCartButtonProps = {
  productId: number
  /** "icon" is the compact square used in the sticky mobile bar. */
  layout?: "full" | "icon"
}

export function RentalCartButton({
  productId,
  layout = "full",
}: RentalCartButtonProps) {
  const { has, add, remove } = useRentalCart()
  const [note, setNote] = useState<string | null>(null)
  const isInCart = has(productId)

  function handleClick() {
    if (isInCart) {
      remove(productId)
      setNote(null)
      return
    }
    setNote(
      add(productId) === "full" ? "Krepšelyje gali būti iki 10 rinkinių." : null
    )
  }

  if (layout === "icon") {
    return (
      <Button
        size="lg"
        variant="outline"
        onClick={handleClick}
        aria-label={isInCart ? "Pašalinti iš krepšelio" : "Į krepšelį"}
        aria-pressed={isInCart}
        className={`size-12 shrink-0 rounded-full border-2 border-ink p-0 ${isInCart ? "bg-brand-yellow" : "bg-paper"}`}
      >
        {isInCart ? (
          <CheckIcon className="size-5" />
        ) : (
          <ShoppingBagIcon className="size-5" />
        )}
      </Button>
    )
  }

  return (
    // A fragment: the button sits inline in the caller's flex row and the note
    // takes the full row under it.
    <>
      <Button
        size="lg"
        variant="outline"
        onClick={handleClick}
        aria-pressed={isInCart}
        className={`brick-hover-sm min-w-[200px] flex-1 justify-center rounded-full border-2 border-ink text-[16px] font-bold text-ink ${isInCart ? "bg-brand-yellow" : "bg-paper"}`}
      >
        {isInCart ? "✓ Krepšelyje" : "Į krepšelį"}
      </Button>
      {(isInCart || note) && (
        <p className="basis-full font-mono text-[12px] text-ink/70">
          {note ?? "Pridėta."}{" "}
          <Link to="/rinkiniai/krepselis" className="font-bold underline">
            Peržiūrėti krepšelį →
          </Link>
        </p>
      )}
    </>
  )
}
