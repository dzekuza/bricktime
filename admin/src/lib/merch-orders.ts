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
  "Paid, but stock for this size couldn't be taken when the order came in (none left, a bad stock value, or the item was deleted). Check the stock count, then restock, offer another size, or refund."
