import { CheckIcon, ShoppingBagIcon } from "lucide-react"

import { useAuth } from "@/hooks/useAuth"
import { RENTAL_CART_MAX_SETS } from "@/contexts/RentalCartContext"
import { useRentalCart } from "@/hooks/useRentalCart"

type ProductCardCartButtonProps = {
  productId: number
  title: string
  allowedTiers: readonly string[]
  isRentedOut: boolean
}

/**
 * Add-to-cart for a catalogue card, shown only for sets the member's own plan
 * can rent. It sits above the card's cover link as its own control.
 */
export function ProductCardCartButton({
  productId,
  title,
  allowedTiers,
  isRentedOut,
}: ProductCardCartButtonProps) {
  const { profile } = useAuth()
  const { has, add, remove, count } = useRentalCart()

  const isEligible =
    !isRentedOut &&
    profile?.status === "active" &&
    profile.plan != null &&
    allowedTiers.includes(profile.plan)
  if (!isEligible) return null

  const isInCart = has(productId)
  const isCartFull = !isInCart && count >= RENTAL_CART_MAX_SETS
  const label = isInCart
    ? `Pašalinti iš krepšelio: ${title}`
    : isCartFull
      ? "Krepšelyje gali būti iki 10 rinkinių"
      : `Į krepšelį: ${title}`

  function handleClick() {
    if (isInCart) remove(productId)
    else add(productId)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isInCart}
      disabled={isCartFull}
      aria-label={label}
      title={label}
      className={`absolute right-[14px] bottom-[14px] z-20 grid size-11 place-items-center rounded-full border-2 border-ink text-ink shadow-[3px_3px_0_#001B21] transition-transform hover:-translate-x-px hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-40 ${isInCart ? "bg-brand-yellow" : "bg-paper"}`}
    >
      {isInCart ? (
        <CheckIcon className="size-5" />
      ) : (
        <ShoppingBagIcon className="size-5" />
      )}
    </button>
  )
}
