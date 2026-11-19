import type { RentedOrder } from "@/components/account/RentedOrderCard"

export const MYSTERY_TITLE = "Mystery Box"

/** The set stays a surprise until the parcel has been delivered (status leaves "processing"). */
export const isMysteryHidden = (order: Pick<RentedOrder, "isMystery" | "status">) =>
  !!order.isMystery && order.status === "processing"
