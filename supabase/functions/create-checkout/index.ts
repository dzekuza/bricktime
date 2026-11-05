import Stripe from "https://esm.sh/stripe@14.21.0"
import {
  createClient,
  type SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2"

import { applyCoupon } from "../_shared/coupon.ts"
import { assertNoDowngradeWhileHolding } from "../_shared/downgrade-guard.ts"

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

const unauthorized = () =>
  new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Identity comes from the caller's token — body userId/userEmail are ignored
    // so nobody can start a checkout against another user's Stripe customer.
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return unauthorized()
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: authData } = await userClient.auth.getUser()
    if (!authData.user) return unauthorized()
    const userId = authData.user.id
    const userEmail = authData.user.email

    const {
      planKey,
      billing,
      successUrl,
      cancelUrl,
      giftCardCode,
      couponCode,
      homeDelivery,
    } = await req.json()

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("name, price, annual_price")
      .eq("id", planKey)
      .eq("active", true)
      .single()

    if (planError || !plan) throw new Error(`Unknown plan: ${planKey}`)

    const { data: subscriber } = await supabase
      .from("subscribers")
      .select("stripe_customer_id, plan")
      .eq("id", userId)
      .maybeSingle()

    // Cancelling and re-subscribing must not dodge the downgrade check: the
    // old plan stays on the subscriber row after cancellation.
    await assertNoDowngradeWhileHolding(
      supabase,
      userId,
      subscriber?.plan,
      planKey,
      plan.price
    )

    // Reuse the stored Stripe customer so history and subscriptions stay on one
    // customer; fall back to the email when it is missing or no longer exists.
    let customerId: string | null = null
    if (subscriber?.stripe_customer_id) {
      try {
        const customer = await stripe.customers.retrieve(
          subscriber.stripe_customer_id
        )
        if (!customer.deleted) customerId = customer.id
      } catch {
        customerId = null
      }
    }

    // Legenda (mega) includes free courier delivery — never charge the add-on fee for it.
    const chargeHomeDeliveryFee = homeDelivery && planKey !== "mega"

    // plans.annual_price is the discounted per-month rate; yearly billing charges
    // 12 of those once a year, so every line item must use the same interval.
    const isAnnual = billing === "annual"
    const interval = isAnnual ? "year" : "month"
    const monthsPerInterval = isAnnual ? 12 : 1

    const planPrice = isAnnual ? (plan.annual_price ?? plan.price) : plan.price

    // A coupon sent by code is priced here from the database, so the client
    // can't choose its own amount. Usage is counted by the webhook once the
    // session completes, not here — creating a session must not burn a use.
    let couponPlanPrice = planPrice
    let stripeCouponId: string | null = null
    let appliedCouponCode: string | null = null
    if (couponCode && !giftCardCode) {
      const { data: coupon } = await supabase
        .from("coupons")
        .select(
          "discount_type, discount_value, duration_months, max_uses, uses_count, expires_at, active"
        )
        .eq("code", String(couponCode).trim().toUpperCase())
        .maybeSingle()
      const expired =
        coupon?.expires_at && new Date(coupon.expires_at) < new Date()
      const exhausted =
        coupon?.max_uses != null && coupon.uses_count >= coupon.max_uses
      if (!coupon || !coupon.active || expired || exhausted) {
        throw new Error("Kodas negalioja")
      }
      const priced = await applyCoupon(
        stripe,
        {
          type: coupon.discount_type,
          value: Number(coupon.discount_value),
          durationMonths: coupon.duration_months,
        },
        planPrice,
        monthsPerInterval
      )
      couponPlanPrice = priced.monthlyPrice
      stripeCouponId = priced.stripeCouponId
      appliedCouponCode = String(couponCode).trim().toUpperCase()
    }

    // Prices always come from the database; the client never sends an amount.
    const unitAmount = Math.round(couponPlanPrice * 100) * monthsPerInterval

    let giftCardDiscountCents = 0
    const heldGiftCardCode = giftCardCode
      ? String(giftCardCode).toUpperCase()
      : null
    if (heldGiftCardCode) {
      const amountCents = await holdGiftCard(supabase, heldGiftCardCode)

      // Cap at the first invoice so Stripe never sees an oversized coupon.
      const firstInvoiceCents =
        unitAmount + (chargeHomeDeliveryFee ? 300 * monthsPerInterval : 0)
      giftCardDiscountCents = Math.min(amountCents, firstInvoiceCents)
    }

    // From here on a gift card is held; let it go again if Stripe fails, so a
    // failed attempt doesn't lock the member out of their own card.
    try {
      // `once` keeps the credit on the first invoice only; later months bill in full.
      const giftCardCoupon =
        giftCardDiscountCents > 0
          ? await stripe.coupons.create({
              amount_off: giftCardDiscountCents,
              currency: "eur",
              duration: "once",
              max_redemptions: 1,
              name: "Dovanų kortelė",
            })
          : null

      const session = await stripe.checkout.sessions.create({
        expires_at: Math.floor(Date.now() / 1000) + SESSION_TTL_MINUTES * 60,
        mode: "subscription",
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: { name: plan.name ?? `BRICKTIME ${planKey}` },
              unit_amount: unitAmount,
              recurring: { interval },
            },
            quantity: 1,
          },
          ...(chargeHomeDeliveryFee
            ? [
                {
                  price_data: {
                    currency: "eur",
                    product_data: { name: "Pristatymas į duris" },
                    unit_amount: 300 * monthsPerInterval,
                    recurring: { interval },
                  },
                  quantity: 1,
                },
              ]
            : []),
        ],
        ...((giftCardCoupon || stripeCouponId) && {
          discounts: [{ coupon: (giftCardCoupon?.id ?? stripeCouponId)! }],
        }),
        ...(customerId
          ? { customer: customerId }
          : { customer_email: userEmail ?? undefined }),
        client_reference_id: userId,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId,
          planKey,
          billing: billing ?? "monthly",
          homeDelivery: homeDelivery ? "true" : "false",
          ...(giftCardCoupon && {
            giftCardCode: String(giftCardCode).toUpperCase(),
          }),
          ...(appliedCouponCode && { couponCode: appliedCouponCode }),
        },
        subscription_data: {
          metadata: {
            userId,
            planKey,
            billing: billing ?? "monthly",
            homeDelivery: homeDelivery ? "true" : "false",
          },
        },
      })

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    } catch (stripeError) {
      if (heldGiftCardCode) await releaseGiftCard(supabase, heldGiftCardCode)
      throw stripeError
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})

// Check and claim in one conditional UPDATE, so two checkouts racing for the
// same card can't both get it. Returns the card's value in cents.
async function holdGiftCard(
  supabase: SupabaseClient,
  code: string
): Promise<number> {
  const now = new Date()
  const holdUntil = new Date(now.getTime() + GIFT_CARD_HOLD_MINUTES * 60_000)
  const { data: card, error } = await supabase
    .from("gift_cards")
    .update({ reserved_until: holdUntil.toISOString() })
    .eq("code", code)
    .eq("status", "active")
    .gt("expires_at", now.toISOString())
    .or(`reserved_until.is.null,reserved_until.lte."${now.toISOString()}"`)
    .select("amount_cents")
    .maybeSingle()
  if (error) {
    console.error(`Gift card hold failed for ${code}: ${error.message}`)
    throw new Error("Dovanų kortelės patikrinti nepavyko. Bandyk dar kartą.")
  }
  if (card) return card.amount_cents

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
      ? "Ši dovanų kortelė jau naudojama kitame neužbaigtame užsakyme. Pabandyk po 35 min."
      : "Dovanų kortelė negalioja"
  )
}

async function releaseGiftCard(supabase: SupabaseClient, code: string) {
  const { error } = await supabase
    .from("gift_cards")
    .update({ reserved_until: null })
    .eq("code", code)
    .eq("status", "active")
  if (error) {
    console.error(`Releasing gift card ${code} failed: ${error.message}`)
  }
}
