import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

// Mirrors the limit claim_rentals enforces.
export const RENTAL_CART_MAX_SETS = 10

export type AddToRentalCartResult = "added" | "full"

interface RentalCartContextValue {
  productIds: number[]
  count: number
  has: (productId: number) => boolean
  add: (productId: number) => AddToRentalCartResult
  remove: (productId: number) => void
  clear: () => void
}

const STORAGE_KEY = "bricktime.rental-cart.v1"

export const RentalCartContext = createContext<RentalCartContextValue | null>(
  null
)

function readStored(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return [...new Set(parsed.filter(Number.isSafeInteger))].slice(
      0,
      RENTAL_CART_MAX_SETS
    ) as number[]
  } catch {
    return []
  }
}

export function RentalCartProvider({ children }: { children: ReactNode }) {
  const [productIds, setProductIds] = useState<number[]>(readStored)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(productIds))
    } catch {
      // Private mode or blocked storage: the cart just lives for this tab.
    }
  }, [productIds])

  const has = useCallback(
    (productId: number) => productIds.includes(productId),
    [productIds]
  )

  const add = useCallback(
    (productId: number): AddToRentalCartResult => {
      if (productIds.includes(productId)) return "added"
      if (productIds.length >= RENTAL_CART_MAX_SETS) return "full"
      setProductIds((prev) =>
        prev.includes(productId) ? prev : [...prev, productId]
      )
      return "added"
    },
    [productIds]
  )

  const remove = useCallback((productId: number) => {
    setProductIds((prev) => prev.filter((id) => id !== productId))
  }, [])

  const clear = useCallback(() => setProductIds([]), [])

  const value = useMemo<RentalCartContextValue>(
    () => ({
      productIds,
      count: productIds.length,
      has,
      add,
      remove,
      clear,
    }),
    [productIds, has, add, remove, clear]
  )

  return (
    <RentalCartContext.Provider value={value}>
      {children}
    </RentalCartContext.Provider>
  )
}
