import Stripe from "https://esm.sh/stripe@14.21.0"
import {
  createClient,
  type SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2"

import { getVatTaxRateId } from "../_shared/vat.ts"
import { MERCH_COURIER_FEE_CENTS } from "../_shared/courier.ts"
import {
  isAllowedReturnUrl,
  stripeElements,
  walletSessionIdempotency,
} from "../_shared/stripe-elements.ts"

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
    const {
      items,
      itemId,
      size,
      successUrl,
      cancelUrl,
      uiMode,
      returnUrl,
      userEmail,
      code,
      deliveryMethod,
      terminal,
    } = await req.json()

    // "elements" = the on-page Express Checkout button (Apple Pay, Google Pay);
    // anything else is the hosted Stripe Checkout redirect.
    const isElements = uiMode === "elements"
    if (isElements && !isAllowedReturnUrl(returnUrl)) {
      throw new Error("Invalid return URL")
    }

    // `itemId` + `size` is the single-item shape from before the cart.
    const lines = parseLines(items ?? [{ itemId, size, quantity: 1 }])

    // The fee is decided here, never taken from the client.
    const isTerminal = deliveryMethod === "terminal"
    if (deliveryMethod !== "terminal" && deliveryMethod !== "courier") {
      throw new Error("Pasirink pristatymo būdą")
    }
    const terminalId = isTerminal ? String(terminal?.id ?? "").trim() : ""
    const terminalName = isTerminal ? String(terminal?.name ?? "").trim() : ""
    if (isTerminal && (!terminalId || !terminalName)) {
      throw new Error("Pasirink paštomatą")
    }

    // Fetch item from DB to get canonical price + name
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )
    const { data: dbItems, error } = await supabase
      .from("merch_items")
      .select("id, name, price, image_url, status, stock, sizes")
      .in(
        "id",
        lines.map((l) => l.itemId)
      )

    if (error) throw new Error("Merch item not found")
    const itemsById = new Map((dbItems ?? []).map((i) => [i.id as string, i]))

    // Link the order to the account only from a verified token — a userId in
    // the body could be anyone's.
    const token = req.headers.get("Authorization")?.replace("Bearer ", "")
    const { data: authData } = token
      ? await supabase.auth.getUser(token)
      : { data: { user: null } }
    const userId = authData.user?.id ?? ""
    const priced = lines.map((line) => {
      const item = itemsById.get(line.itemId)
      if (!item) throw new Error("Merch item not found")
      // Only an active item is for sale; coming-soon is browse-only. The size
      // must be one the item lists, so a crafted value like "constructor"
      // can't slip past the stock check.
      if (item.status !== "active") throw new Error("Item not available")
      const sizes = (item.sizes as string[] | null) ?? []
      if (!sizes.includes(line.size)) throw new Error("Unknown size")
      const stock = (item.stock as Record<string, unknown> | null) ?? {}
      const sizeStock = Object.hasOwn(stock, line.size) ? stock[line.size] : 0
      // Whole units only. The record_merch_* functions also count non-whole or
      // non-numeric stock as none, flagging the order stock_short.
      if (
        !Number.isSafeInteger(sizeStock) ||
        (sizeStock as number) < line.quantity
      ) {
        throw new Error("Out of stock")
      }
      return {
        ...line,
        name: item.name as string,
        imageUrl: item.image_url as string | null,
        unitAmount: Math.round(Number(item.price) * 100), // cents
      }
    })
    const subtotalCents = priced.reduce(
      (sum, l) => sum + l.unitAmount * l.quantity,
      0
    )

    // One code per order, priced here from the database so the client can't
    // pick its own discount. Usage is counted by the webhook once payment
    // completes — creating a session must not burn a coupon or gift card.
    const discount = code
      ? await resolveDiscount(supabase, String(code), subtotalCents, userId)
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

      const vatTaxRateId = await getVatTaxRateId(stripe)
      const sessionParams = {
        expires_at: Math.floor(Date.now() / 1000) + SESSION_TTL_MINUTES * 60,
        mode: "payment" as const,
        // Keeps the customer's invoice language Lithuanian (see create-checkout).
        locale: "lt",
        line_items: [
          ...priced.map((line) => ({
            price_data: {
              currency: "eur",
              product_data: {
                name: `${line.name} — ${line.size}`,
                ...(line.imageUrl ? { images: [line.imageUrl] } : {}),
              },
              unit_amount: line.unitAmount,
            },
            quantity: line.quantity,
            tax_rates: [vatTaxRateId],
          })),
          ...(isTerminal
            ? []
            : [
                {
                  price_data: {
                    currency: "eur",
                    product_data: { name: "Pristatymas kurjeriu iki durų" },
                    unit_amount: MERCH_COURIER_FEE_CENTS,
                  },
                  quantity: 1,
                  tax_rates: [vatTaxRateId],
                },
              ]),
        ],
        ...(isTerminal && {
          custom_text: {
            submit: { message: `Pristatymas į paštomatą: ${terminalName}` },
          },
        }),
        customer_email: userEmail ?? undefined,
        invoice_creation: { enabled: true },
        // A held code must settle inside its hold. Delayed methods can take
        // days, long after the hold lapses and someone else claims the code.
        ...(isHoldingCode && { payment_method_types: ["card"] }),
        ...(stripeCoupon && { discounts: [{ coupon: stripeCoupon.id }] }),
        metadata: {
          type: "merch",
          // Compact so six lines stay under Stripe's 500-char metadata limit.
          cart: JSON.stringify(
            lines.map((l) => ({ i: l.itemId, s: l.size, q: l.quantity }))
          ),
          userId,
          deliveryMethod,
          ...(isTerminal && {
            lpTerminalId: terminalId,
            lpTerminalName: terminalName.slice(0, 450),
          }),
          ...(discount?.kind === "coupon" && {
            couponCode: discount.code,
            ...(discount.holdId && { couponHoldId: discount.holdId }),
          }),
          ...(discount?.kind === "gift_card" && {
            giftCardCode: discount.code,
          }),
        },
        phone_number_collection: { enabled: true },
        // A terminal order is picked up, so no street address is needed.
        ...(!isTerminal && {
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
        }),
      } satisfies Stripe.Checkout.SessionCreateParams

      if (isElements) {
        // Only a verified account can share a retry key. A guest request has
        // nothing in it that is unique to the shopper, so two guests with the
        // same cart in the same moment would be handed one session (and one
        // client secret) and could overwrite each other's delivery details.
        const retryGuard = userId
          ? await walletSessionIdempotency(
              "merch-elements",
              {
                userId,
                cart: lines,
                deliveryMethod,
                terminalId,
                code: code ?? null,
                returnUrl,
              },
              SESSION_TTL_MINUTES
            )
          : null
        const session = await stripeElements.checkout.sessions.create(
          {
            ...sessionParams,
            ...(retryGuard && { expires_at: retryGuard.expiresAt }),
            ui_mode: "elements",
            return_url: returnUrl,
          } as Parameters<typeof stripeElements.checkout.sessions.create>[0],
          retryGuard ? { idempotencyKey: retryGuard.idempotencyKey } : undefined
        )
        return new Response(
          JSON.stringify({ clientSecret: session.client_secret }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      const session = await stripe.checkout.sessions.create({
        ...sessionParams,
        success_url: successUrl,
        cancel_url: cancelUrl,
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

const MAX_LINES = 6
const MAX_QUANTITY = 10

type CartLine = { itemId: string; size: string; quantity: number }

// Validates the untrusted cart and merges repeated item+size lines, so a
// crafted cart can't dodge the per-size stock check by splitting a quantity.
function parseLines(raw: unknown): CartLine[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error("Krepšelis tuščias")
  }
  const merged = new Map<string, CartLine>()
  for (const entry of raw) {
    const { itemId, size, quantity } = (entry ?? {}) as Record<string, unknown>
    if (typeof itemId !== "string" || !itemId) {
      throw new Error("itemId is required")
    }
    if (typeof size !== "string" || !size) throw new Error("Unknown size")
    if (
      !Number.isSafeInteger(quantity) ||
      (quantity as number) < 1 ||
      (quantity as number) > MAX_QUANTITY
    ) {
      throw new Error("Neteisingas kiekis")
    }
    const key = `${itemId}|${size}`
    const existing = merged.get(key)
    if (existing) existing.quantity += quantity as number
    else merged.set(key, { itemId, size, quantity: quantity as number })
  }
  const lines = [...merged.values()]
  if (lines.length > MAX_LINES) {
    throw new Error(`Krepšelyje gali būti iki ${MAX_LINES} skirtingų prekių`)
  }
  if (lines.some((l) => l.quantity > MAX_QUANTITY)) {
    throw new Error("Neteisingas kiekis")
  }
  return lines
}

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
    .or(`reserved_until.is.null,reserved_until.lte.${now.toISOString()}`)
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
