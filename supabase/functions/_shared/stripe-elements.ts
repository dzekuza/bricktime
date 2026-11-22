import Stripe from "https://esm.sh/stripe@23.2.0"

// Checkout Sessions with `ui_mode: "elements"` (the Express Checkout Element on
// our own pages) need a newer API version than the one the rest of these
// functions are pinned to. Only the session create call uses this client, so
// the hosted-checkout path is untouched. Customers, coupons and tax rates keep
// coming from the pinned client: their ids are valid across API versions.
export const ELEMENTS_API_VERSION = "2026-11-18.endive"

export const stripeElements = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: ELEMENTS_API_VERSION,
  httpClient: Stripe.createFetchHttpClient(),
})

/** Where the wallet flow returns to; only our own origin is accepted. */
export function isAllowedReturnUrl(value: unknown): value is string {
  if (typeof value !== "string") return false
  try {
    const { origin } = new URL(value.replace("{CHECKOUT_SESSION_ID}", "x"))
    return ALLOWED_ORIGINS.includes(origin)
  } catch {
    return false
  }
}

const ALLOWED_ORIGINS = (
  Deno.env.get("CHECKOUT_RETURN_ORIGINS") ??
  "https://www.bricktime.lt,https://bricktime.lt"
)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean)
