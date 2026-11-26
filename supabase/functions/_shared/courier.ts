// Delivery fees in euro cents. The storefront mirrors each in
// src/lib/courier.ts — keep both equal.

/** One-off door delivery of a rental or Mystery Box parcel
 *  (create-rental-courier-checkout, create-mystery-courier-checkout). */
export const COURIER_FEE_CENTS = 1000

/** One-off door delivery of a merch order, a one-way parcel (create-merch-checkout). */
export const MERCH_COURIER_FEE_CENTS = 500

/** Monthly door-delivery add-on on a subscription, per month
 *  (_shared/plan-schedule.ts, change-subscription). Legenda includes it free. */
export const HOME_DELIVERY_FEE_CENTS = 1000
