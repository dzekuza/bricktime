import Stripe from "https://esm.sh/stripe@14.21.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

const HOME_DELIVERY_FEE_CENTS = 300
const SWAPPABLE_STATUSES = new Set(["active", "trialing"])

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })

// Swaps the plan on the caller's existing Stripe subscription instead of
// opening a second checkout. Returns { changed: false } when there is nothing
// to swap so the client can fall back to a normal checkout.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return json({ error: "Unauthorized" }, 401)

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: userData } = await userClient.auth.getUser()
    const user = userData.user
    if (!user) return json({ error: "Unauthorized" }, 401)

    const { planKey, billing, homeDelivery } = await req.json()

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const { data: subscriber } = await supabase
      .from("subscribers")
      .select("stripe_subscription_id")
      .eq("id", user.id)
      .maybeSingle()

    if (!subscriber?.stripe_subscription_id) {
      return json({ changed: false, reason: "no_active_subscription" })
    }

    // A stored id Stripe no longer knows (deleted, or from the other Stripe
    // mode) is a stale row, not a failure — fall back to a fresh checkout.
    let subscription: Stripe.Subscription
    try {
      subscription = await stripe.subscriptions.retrieve(
        subscriber.stripe_subscription_id
      )
    } catch (err) {
      if ((err as { code?: string }).code === "resource_missing") {
        return json({ changed: false, reason: "no_active_subscription" })
      }
      throw err
    }
    if (!SWAPPABLE_STATUSES.has(subscription.status)) {
      return json({ changed: false, reason: "no_active_subscription" })
    }

    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("name, price, annual_price")
      .eq("id", planKey)
      .eq("active", true)
      .single()
    if (planError || !plan) throw new Error(`Unknown plan: ${planKey}`)

    // Legenda (mega) includes free courier delivery.
    const chargeHomeDeliveryFee = homeDelivery && planKey !== "mega"

    // plans.annual_price is the discounted per-month rate; yearly billing
    // charges 12 of those once a year, and every item must share an interval.
    const isAnnual = billing === "annual"
    const interval = isAnnual ? "year" : "month"
    const monthsPerInterval = isAnnual ? 12 : 1
    const monthlyPrice = isAnnual
      ? (plan.annual_price ?? plan.price)
      : plan.price

    const planProduct = await stripe.products.create({
      name: plan.name ?? `BRICKTIME ${planKey}`,
    })
    const deliveryProduct = chargeHomeDeliveryFee
      ? await stripe.products.create({ name: "Pristatymas į duris" })
      : null

    const metadata = {
      userId: user.id,
      planKey,
      billing: billing ?? "monthly",
      homeDelivery: homeDelivery ? "true" : "false",
    }

    // always_invoice bills the price difference now, and error_if_incomplete
    // leaves the old plan in place if that payment fails — so a plan is never
    // granted before it is paid for.
    await stripe.subscriptions.update(subscription.id, {
      items: [
        ...subscription.items.data.map((item) => ({
          id: item.id,
          deleted: true,
        })),
        {
          price_data: {
            currency: "eur",
            product: planProduct.id,
            unit_amount: Math.round(monthlyPrice * 100) * monthsPerInterval,
            recurring: { interval },
          },
          quantity: 1,
        },
        ...(deliveryProduct
          ? [
              {
                price_data: {
                  currency: "eur",
                  product: deliveryProduct.id,
                  unit_amount: HOME_DELIVERY_FEE_CENTS * monthsPerInterval,
                  recurring: { interval },
                },
                quantity: 1,
              },
            ]
          : []),
      ],
      proration_behavior: "always_invoice",
      payment_behavior: "error_if_incomplete",
      cancel_at_period_end: false,
      metadata,
    })

    return json({ changed: true })
  } catch (err) {
    console.error("change-subscription failed:", (err as Error).message)
    return json({ error: (err as Error).message }, 400)
  }
})
