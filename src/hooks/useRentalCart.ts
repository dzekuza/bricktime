import { useContext } from "react"

import { RentalCartContext } from "@/contexts/RentalCartContext"

export function useRentalCart() {
  const context = useContext(RentalCartContext)
  if (!context) {
    throw new Error("useRentalCart must be used inside RentalCartProvider")
  }
  return context
}
