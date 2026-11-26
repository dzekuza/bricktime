// One-off door-delivery ("kurjeriu iki durų") fee, in euro cents. One fee
// covers a whole parcel. Shared by create-merch-checkout,
// create-rental-courier-checkout and create-mystery-courier-checkout; the
// storefront mirrors it as COURIER_FEE in src/lib/courier.ts — keep both equal.
export const COURIER_FEE_CENTS = 1000
