import Stripe from "https://esm.sh/stripe@14.21.0"
import {
  createClient,
  type SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
})

// Stripe's shortest allowed session lifetime. The gift card hold runs a little
// longer so the card can't be freed while the session can still be paid.
const SESSION_TTL_MINUTES = 30
const GIFT_CARD_HOLD_MINUTES = 35

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { itemId, size, successUrl, cancelUrl, userEmail, code } =
      await req.json()

    if (!itemId || !size) throw new Error("itemId and size are required")

    // Fetch item from DB to get canonical price + name
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )
    const { data: item, error } = await supabase
      .from("merch_items")
      .select("id, name, price, image_url, status, stock, sizes")
      .eq("id", itemId)
      .single()

    if (error || !item) throw new Error("Merch item not found")

    // Link the order to the account only from a verified token — a userId in
    // the body could be anyone's.
    const token = req.headers.get("Authorization")?.replace("Bearer ", "")
    const { data: authData } = token
      ? await supabase.auth.getUser(token)
      : { data: { user: null } }
    const userId = authData.user?.id ?? ""
    // Only an active item is for sale; coming-soon is browse-only. The size must
    // be one the item lists, so a crafted value like "constructor" can't slip
    // past the stock check.
    if (item.status !== "active") throw new Error("Item not available")
    const sizes = (item.sizes as string[] | null) ?? []
    if (typeof size !== "string" || !sizes.includes(size)) {
      throw new Error("Unknown size")
    }
    const stock = (item.stock as Record<string, unknown> | null) ?? {}
    const sizeStock = Object.hasOwn(stock, size) ? stock[size] : 0
    if (typeof sizeStock !== "number" || sizeStock <= 0) {
      throw new Error("Out of stock")
    }

    const unitAmount = Math.round(Number(item.price) * 100) // cents

    // One code per order, priced here from the database so the client can't
    // pick its own discount. Usage is counted by the webhook once payment
    // completes — creating a session must not burn a coupon or gift card.
    const discount = code
      ? await resolveDiscount(supabase, String(code), unitAmount)
      : null
    // From here on a gift card is held; let it go again if Stripe fails, so a
    // failed attempt doesn't lock the shopper out of their own card.
    try {
      const stripeCoupon =
        discount && discount.amountOffCents > 0
          ? await stripe.coupons.create({
              amount_off: discount.amountOffCents,
              currency: "eur",
              duration: "once",
              max_redemptions: 1,
              name:
                discount.kind === "gift_card"
                  ? "Dovanų kuponas"
                  : "Nuolaidos kodas",
            })
          : null

      const session = await stripe.checkout.sessions.create({
        expires_at: Math.floor(Date.now() / 1000) + SESSION_TTL_MINUTES * 60,
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: `${item.name} — ${size}`,
                ...(item.image_url ? { images: [item.image_url] } : {}),
              },
              unit_amount: unitAmount,
            },
            quantity: 1,
          },
        ],
        customer_email: userEmail ?? undefined,
        invoice_creation: { enabled: true },
        success_url: successUrl,
        cancel_url: cancelUrl,
        ...(stripeCoupon && { discounts: [{ coupon: stripeCoupon.id }] }),
        metadata: {
          type: "merch",
          itemId,
          size,
          userId,
          ...(discount?.kind === "coupon" && { couponCode: discount.code }),
          ...(discount?.kind === "gift_card" && {
            giftCardCode: discount.code,
          }),
        },
        // The gift card hold lasts minutes, but a delayed method (bank debit,
        // transfer) can settle days later — long enough to spend the card
        // elsewhere first. Cards settle at once, so they're the only option
        // when a gift card is applied.
        ...(discount?.kind === "gift_card" && {
          payment_method_types: ["card"],
        }),
        phone_number_collection: { enabled: true },
        shipping_address_collection: {
          allowed_countries: [
            "LT",
            "LV",
            "EE",
            "PL",
            "DE",
            "FR",
            "GB",
            "NL",
            "SE",
            "FI",
          ],
        },
      })

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    } catch (stripeError) {
      if (discount?.kind === "gift_card") {
        await releaseGiftCard(supabase, discount.code)
      }
      throw stripeError
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})

type Discount = {
  kind: "coupon" | "gift_card"
  code: string
  amountOffCents: number
}

// Coupons are checked first; a code that isn't one is tried as a gift card.
// A gift card is single-use, so any value above the item price is not kept.
async function resolveDiscount(
  supabase: SupabaseClient,
  rawCode: string,
  priceCents: number
): Promise<Discount> {
  const code = rawCode.trim().toUpperCase()

  const { data: coupon } = await supabase
    .from("coupons")
    .select(
      "discount_type, discount_value, max_uses, uses_count, expires_at, active"
    )
    .eq("code", code)
    .maybeSingle()
  if (coupon) {
    const expired =
      coupon.expires_at && new Date(coupon.expires_at) < new Date()
    const exhausted =
      coupon.max_uses != null && coupon.uses_count >= coupon.max_uses
    if (!coupon.active || expired || exhausted)
      throw new Error("Kodas negalioja")
    const value = Number(coupon.discount_value)
    const off =
      coupon.discount_type === "percentage"
        ? Math.round((priceCents * value) / 100)
        : Math.round(value * 100)
    return { kind: "coupon", code, amountOffCents: Math.min(off, priceCents) }
  }

  // Check and claim in one conditional UPDATE, so two checkouts racing for the
  // same card can't both get it.
  const now = new Date()
  const holdUntil = new Date(now.getTime() + GIFT_CARD_HOLD_MINUTES * 60_000)
  const { data: card, error: holdError } = await supabase
    .from("gift_cards")
    .update({ reserved_until: holdUntil.toISOString() })
    .eq("code", code)
    .eq("status", "active")
    .gt("expires_at", now.toISOString())
    .or(`reserved_until.is.null,reserved_until.lte."${now.toISOString()}"`)
    .select("amount_cents")
    .maybeSingle()
  if (holdError) {
    console.error(`Gift card hold failed for ${code}: ${holdError.message}`)
    throw new Error("Dovanų kupono patikrinti nepavyko. Bandyk dar kartą.")
  }
  if (!card) {
    const { data: existing } = await supabase
      .from("gift_cards")
      .select("status, expires_at, reserved_until")
      .eq("code", code)
      .maybeSingle()
    const isHeld =
      existing?.status === "active" &&
      new Date(existing.expires_at) > now &&
      existing.reserved_until != null &&
      new Date(existing.reserved_until) > now
    throw new Error(
      isHeld
        ? "Šis dovanų kuponas jau naudojamas kitame neužbaigtame užsakyme. Pabandyk po 30 min."
        : "Kodas nerastas arba nebegalioja"
    )
  }
  return {
    kind: "gift_card",
    code,
    amountOffCents: Math.min(card.amount_cents, priceCents),
  }
}

async function releaseGiftCard(supabase: SupabaseClient, code: string) {
  const { error } = await supabase
    .from("gift_cards")
    .update({ reserved_until: null })
    .eq("code", code)
    .eq("status", "active")
  if (error)
    console.error(`Releasing gift card ${code} failed: ${error.message}`)
}
