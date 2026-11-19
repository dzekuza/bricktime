import type { MouseEvent } from "react"
import { CheckIcon, ShoppingBagIcon } from "lucide-react"

import { useAuth } from "@/hooks/useAuth"
import { useRentalCart } from "@/hooks/useRentalCart"

type ProductCardCartButtonProps = {
  productId: number
  allowedTiers: readonly string[]
  isRentedOut: boolean
}

/**
 * Add-to-cart for a catalogue card, shown only for sets the member's own plan
 * can rent. The card is one big link, so the click must not navigate.
 */
export function ProductCardCartButton({
  productId,
  allowedTiers,
  isRentedOut,
}: ProductCardCartButtonProps) {
  const { profile } = useAuth()
  const { has, add, remove } = useRentalCart()

  const isEligible =
    !isRentedOut &&
    profile?.status === "active" &&
    profile.plan != null &&
    allowedTiers.includes(profile.plan)
  if (!isEligible) return null

  const isInCart = has(productId)

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    if (isInCart) remove(productId)
    else add(productId)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isInCart}
      aria-label={isInCart ? "Pašalinti iš krepšelio" : "Į krepšelį"}
      title={isInCart ? "Pašalinti iš krepšelio" : "Į krepšelį"}
      className={`absolute right-[14px] bottom-[14px] z-20 grid size-11 place-items-center rounded-full border-2 border-ink text-ink shadow-[3px_3px_0_#001B21] transition-transform hover:-translate-x-px hover:-translate-y-px ${isInCart ? "bg-brand-yellow" : "bg-paper"}`}
    >
      {isInCart ? (
        <CheckIcon className="size-5" />
      ) : (
        <ShoppingBagIcon className="size-5" />
      )}
    </button>
  )
}
