import type { Tables } from "@/lib/supabase"

export type MerchOrder = Tables<"merch_orders">
export type MerchOrderPatch = Partial<
  Pick<MerchOrder, "status" | "tracking_number" | "shipped_at">
>
export type MerchOrderStatus =
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"

export const MERCH_ORDER_STATUS_LABEL: Record<MerchOrderStatus, string> = {
  paid: "Paid — to ship",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
}

export const MERCH_ORDER_STATUS_VARIANT: Record<
  MerchOrderStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  paid: "default",
  shipped: "secondary",
  delivered: "outline",
  cancelled: "destructive",
  refunded: "destructive",
}

export const STOCK_SHORT_LABEL = "Out of stock"
export const STOCK_SHORT_HINT =
  "Paid, but no unit of this size was left when the order came in. Restock, offer another size, or refund."
