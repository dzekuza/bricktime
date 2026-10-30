import Stripe from "https://esm.sh/stripe@14.21.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

import { applyCoupon } from "../_shared/coupon.ts"
import { assertNoDowngradeWhileHolding } from "../_shared/downgrade-guard.ts"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
})

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
    if (giftCardCode) {
      const { data: card } = await supabase
        .from("gift_cards")
        .select("amount_cents, status, expires_at")
        .eq("code", String(giftCardCode).toUpperCase())
        .maybeSingle()

      if (
        !card ||
        card.status !== "active" ||
        new Date(card.expires_at) < new Date()
      ) {
        throw new Error("Dovanų kortelė negalioja")
      }

      // Cap at the first invoice so Stripe never sees an oversized coupon.
      const firstInvoiceCents =
        unitAmount + (chargeHomeDeliveryFee ? 300 * monthsPerInterval : 0)
      giftCardDiscountCents = Math.min(card.amount_cents, firstInvoiceCents)
    }

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
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
