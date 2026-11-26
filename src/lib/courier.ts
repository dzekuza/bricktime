// One-off door-delivery ("kurjeriu iki durų") fee in euro, shown on rental,
// mystery-box and merch checkouts. One fee covers a whole parcel. Mirrors
// COURIER_FEE_CENTS in supabase/functions/_shared/courier.ts — the server
// charges that value, so keep both equal.
export const COURIER_FEE = 10
