// Delivery fees in euro shown on the storefront. Each mirrors a value in
// supabase/functions/_shared/courier.ts — the server charges that value, so
// keep both equal.

/** One-off door delivery ("kurjeriu iki durų") of a rental or Mystery Box parcel. */
export const COURIER_FEE = 10

/** One-off door delivery of a merch order (one-way parcel, so cheaper). */
export const MERCH_COURIER_FEE = 5

/** Monthly door-delivery add-on on a subscription (Legenda includes it free). */
export const HOME_DELIVERY_MONTHLY_FEE = 10
