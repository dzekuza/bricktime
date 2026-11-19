import { useContext } from "react"

import { MerchCartContext } from "@/contexts/MerchCartContext"

export function useMerchCart() {
  const context = useContext(MerchCartContext)
  if (!context) {
    throw new Error("useMerchCart must be used inside MerchCartProvider")
  }
  return context
}
