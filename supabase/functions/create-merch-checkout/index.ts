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
    // Whole units only. record_merch_order also counts non-whole or non-numeric
    // stock as none, flagging the order stock_short instead of taking a unit.
    if (!Number.isSafeInteger(sizeStock) || (sizeStock as number) < 1) {
      throw new Error("Out of stock")
    }

    const unitAmount = Math.round(Number(item.price) * 100) // cents

    // One code per order, priced here from the database so the client can't
    // pick its own discount. Usage is counted by the webhook once payment
    // completes — creating a session must not burn a coupon or gift card.
    const discount = code
      ? await resolveDiscount(supabase, String(code), unitAmount, userId)
      : null
    // From here on the code is held; let it go again if Stripe fails, so a
    // failed attempt doesn't lock the shopper out of their own card or use.
    const isHoldingCode =
      discount?.kind === "gift_card" ||
      (discount?.kind === "coupon" && discount.holdId != null)
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
        // A held code must settle inside its hold. Delayed methods can take
        // days, long after the hold lapses and someone else claims the code.
        ...(isHoldingCode && { payment_method_types: ["card"] }),
        success_url: successUrl,
        cancel_url: cancelUrl,
        ...(stripeCoupon && { discounts: [{ coupon: stripeCoupon.id }] }),
        metadata: {
          type: "merch",
          itemId,
          size,
          userId,
          ...(discount?.kind === "coupon" && {
            couponCode: discount.code,
            ...(discount.holdId && { couponHoldId: discount.holdId }),
          }),
          ...(discount?.kind === "gift_card" && {
            giftCardCode: discount.code,
          }),
        },
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
        await releaseGiftCard(supabase, discount.code, userId)
      } else if (discount?.kind === "coupon" && discount.holdId) {
        await releaseCouponHold(supabase, discount.holdId)
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

type Discount =
  | {
      kind: "coupon"
      code: string
      amountOffCents: number
      holdId: string | null
    }
  | { kind: "gift_card"; code: string; amountOffCents: number }

// One message for every rejected gift card, so the response never reveals
// whether a typed code exists or is held by someone else.
const GIFT_CARD_REJECTED =
  "Kodas nerastas, nebegalioja arba šiuo metu naudojamas"
const OWN_OPEN_CHECKOUT =
  "Šį kodą jau naudoji kitame neužbaigtame užsakyme. Pabandyk po 35 min."

// Coupons are checked first; a code that isn't one is tried as a gift card.
// A gift card is single-use, so any value above the item price is not kept.
async function resolveDiscount(
  supabase: SupabaseClient,
  rawCode: string,
  priceCents: number,
  userId: string
): Promise<Discount> {
  const code = rawCode.trim().toUpperCase()

  const { data: coupon } = await supabase
    .from("coupons")
    .select("discount_type, discount_value, max_uses, active, expires_at")
    .eq("code", code)
    .maybeSingle()
  if (coupon) {
    let holdId: string | null = null
    if (coupon.max_uses == null) {
      // Unlimited: nothing to run out of, so nothing to reserve.
      const expired =
        coupon.expires_at && new Date(coupon.expires_at) <= new Date()
      if (!coupon.active || expired) throw new Error("Kodas negalioja")
    } else {
      // Reserving a limited use needs an account, one live hold each, so
      // nobody can drain the remaining uses by opening checkouts.
      if (!userId) {
        throw new Error("Prisijunk, kad galėtum panaudoti šį nuolaidos kodą")
      }
      const { data, error: holdError } = await supabase.rpc(
        "claim_coupon_hold",
        { p_code: code, p_minutes: GIFT_CARD_HOLD_MINUTES, p_user_id: userId }
      )
      if (holdError?.message.includes("own_hold_open")) {
        throw new Error(OWN_OPEN_CHECKOUT)
      }
      if (holdError) {
        console.error(`Coupon hold failed for ${code}: ${holdError.message}`)
        throw new Error("Kodo patikrinti nepavyko. Bandyk dar kartą.")
      }
      if (!data) throw new Error("Kodas negalioja")
      holdId = String(data)
    }
    const value = Number(coupon.discount_value)
    const off =
      coupon.discount_type === "percentage"
        ? Math.round((priceCents * value) / 100)
        : Math.round(value * 100)
    return {
      kind: "coupon",
      code,
      amountOffCents: Math.min(off, priceCents),
      holdId,
    }
  }

  // A hold needs an owner, otherwise anyone who saw a code could keep it
  // locked away from the person it was bought for.
  if (!userId) {
    throw new Error("Prisijunk, kad galėtum panaudoti dovanų kuponą")
  }

  // Check and claim in one conditional UPDATE, so two checkouts racing for the
  // same card can't both get it. A live hold blocks its own holder too: a
  // second session for the same card would let one card pay twice.
  const now = new Date()
  const holdUntil = new Date(now.getTime() + GIFT_CARD_HOLD_MINUTES * 60_000)
  const { data: card, error: holdError } = await supabase
    .from("gift_cards")
    .update({ reserved_until: holdUntil.toISOString(), reserved_by: userId })
    .eq("code", code)
    .eq("status", "active")
    .gt("expires_at", now.toISOString())
    .or(`reserved_until.is.null,reserved_until.lte."${now.toISOString()}"`)
    .select("amount_cents")
    .maybeSingle()
  if (holdError) {
    console.error(`Gift card hold failed: ${holdError.message}`)
    throw new Error("Dovanų kupono patikrinti nepavyko. Bandyk dar kartą.")
  }
  if (!card) {
    // Telling holders about their own open checkout reveals nothing new.
    const { data: ownHold } = await supabase
      .from("gift_cards")
      .select("code")
      .eq("code", code)
      .eq("reserved_by", userId)
      .gt("reserved_until", now.toISOString())
      .maybeSingle()
    throw new Error(ownHold ? OWN_OPEN_CHECKOUT : GIFT_CARD_REJECTED)
  }
  return {
    kind: "gift_card",
    code,
    amountOffCents: Math.min(card.amount_cents, priceCents),
  }
}

async function releaseGiftCard(
  supabase: SupabaseClient,
  code: string,
  userId: string
) {
  const { error } = await supabase
    .from("gift_cards")
    .update({ reserved_until: null, reserved_by: null })
    .eq("code", code)
    .eq("status", "active")
    .eq("reserved_by", userId)
  if (error) console.error(`Releasing gift card hold failed: ${error.message}`)
}

async function releaseCouponHold(supabase: SupabaseClient, holdId: string) {
  const { error } = await supabase
    .from("coupon_holds")
    .delete()
    .eq("id", holdId)
  if (error)
    console.error(`Releasing coupon hold ${holdId} failed: ${error.message}`)
}
