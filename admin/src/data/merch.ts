export type MerchType = "hoodie" | "t-shirt"
export type MerchStatus = "active" | "coming-soon" | "draft"

/** Mirrors a `merch_items` row. */
export interface MerchItem {
  id: string
  name: string
  slug: string
  type: MerchType
  description: string
  price: number
  sizes: string[]
  /** Per-size stock, e.g. `{ S: 4, M: 0, L: 2 }`. Keys should match `sizes`. */
  stock: Record<string, number>
  bg: string
  image_url: string | null
  image_urls: string[]
  status: MerchStatus
  sort_order: number
  created_at: string
  updated_at: string
}
