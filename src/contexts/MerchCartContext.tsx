import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

export const MERCH_CART_MAX_LINES = 6
export const MERCH_CART_MAX_QUANTITY = 10

export interface MerchCartLine {
  itemId: string
  size: string
  quantity: number
}

export type AddToMerchCartResult = "added" | "full"

interface MerchCartContextValue {
  lines: MerchCartLine[]
  count: number
  addLine: (
    itemId: string,
    size: string,
    quantity?: number
  ) => AddToMerchCartResult
  setQuantity: (itemId: string, size: string, quantity: number) => void
  removeLine: (itemId: string, size: string) => void
  clear: () => void
}

const STORAGE_KEY = "bricktime.merch-cart.v1"

export const MerchCartContext = createContext<MerchCartContextValue | null>(
  null
)

function isLine(value: unknown): value is MerchCartLine {
  if (typeof value !== "object" || value === null) return false
  const line = value as Record<string, unknown>
  return (
    typeof line.itemId === "string" &&
    typeof line.size === "string" &&
    Number.isSafeInteger(line.quantity) &&
    (line.quantity as number) >= 1 &&
    (line.quantity as number) <= MERCH_CART_MAX_QUANTITY
  )
}

function readStored(): MerchCartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isLine).slice(0, MERCH_CART_MAX_LINES)
  } catch {
    return []
  }
}

const sameLine = (line: MerchCartLine, itemId: string, size: string) =>
  line.itemId === itemId && line.size === size

export function MerchCartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<MerchCartLine[]>(readStored)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
    } catch {
      // Private mode or blocked storage: the cart just lives for this tab.
    }
  }, [lines])

  const addLine = useCallback(
    (itemId: string, size: string, quantity = 1): AddToMerchCartResult => {
      const exists = lines.some((l) => sameLine(l, itemId, size))
      if (!exists && lines.length >= MERCH_CART_MAX_LINES) return "full"
      setLines((prev) =>
        prev.some((l) => sameLine(l, itemId, size))
          ? prev.map((l) =>
              sameLine(l, itemId, size)
                ? {
                    ...l,
                    quantity: Math.min(
                      l.quantity + quantity,
                      MERCH_CART_MAX_QUANTITY
                    ),
                  }
                : l
            )
          : [
              ...prev,
              {
                itemId,
                size,
                quantity: Math.min(quantity, MERCH_CART_MAX_QUANTITY),
              },
            ]
      )
      return "added"
    },
    [lines]
  )

  const setQuantity = useCallback(
    (itemId: string, size: string, quantity: number) => {
      const clamped = Math.min(
        Math.max(Math.trunc(quantity), 1),
        MERCH_CART_MAX_QUANTITY
      )
      setLines((prev) =>
        prev.map((l) =>
          sameLine(l, itemId, size) ? { ...l, quantity: clamped } : l
        )
      )
    },
    []
  )

  const removeLine = useCallback((itemId: string, size: string) => {
    setLines((prev) => prev.filter((l) => !sameLine(l, itemId, size)))
  }, [])

  const clear = useCallback(() => setLines([]), [])

  const value = useMemo<MerchCartContextValue>(
    () => ({
      lines,
      count: lines.reduce((sum, l) => sum + l.quantity, 0),
      addLine,
      setQuantity,
      removeLine,
      clear,
    }),
    [lines, addLine, setQuantity, removeLine, clear]
  )

  return (
    <MerchCartContext.Provider value={value}>
      {children}
    </MerchCartContext.Provider>
  )
}
