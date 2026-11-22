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

const IDEMPOTENCY_BUCKET_SECONDS = 10

/**
 * Key and expiry for a wallet Checkout Session. Both come from the same
 * 10-second bucket plus a hash of the whole order, so a retry of the same
 * order sends identical parameters (Stripe returns the same session), while a
 * changed order gets a new key instead of an idempotency conflict.
 */
export async function walletSessionIdempotency(
  scope: string,
  intent: unknown,
  ttlMinutes: number
): Promise<{ idempotencyKey: string; expiresAt: number }> {
  const bucket = Math.floor(Date.now() / 1000 / IDEMPOTENCY_BUCKET_SECONDS)
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify(intent))
  )
  const hash = [...new Uint8Array(digest)]
    .slice(0, 12)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
  return {
    idempotencyKey: `${scope}-${hash}-${bucket}`,
    // The end of the bucket plus the lifetime: always at least `ttlMinutes`
    // from now, as Stripe requires, and identical for every call in the bucket.
    expiresAt: (bucket + 1) * IDEMPOTENCY_BUCKET_SECONDS + ttlMinutes * 60,
  }
}
