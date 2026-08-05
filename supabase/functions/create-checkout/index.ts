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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const {
      planKey,
      billing,
      userId,
      userEmail,
      successUrl,
      cancelUrl,
      discountedAmount,
      giftCardCode,
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

    const planPrice =
      billing === "annual" ? (plan.annual_price ?? plan.price) : plan.price

    const unitAmount =
      discountedAmount != null && discountedAmount > 0
        ? Math.round(discountedAmount * 100)
        : Math.round(planPrice * 100)

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: plan.name ?? `BRICKTIME ${planKey}` },
            unit_amount: unitAmount,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
        ...(homeDelivery
          ? [
              {
                price_data: {
                  currency: "eur",
                  product_data: { name: "Pristatymas į duris" },
                  unit_amount: 300,
                  recurring: { interval: "month" },
                },
                quantity: 1,
              },
            ]
          : []),
      ],
      customer_email: userEmail ?? undefined,
      client_reference_id: userId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        planKey,
        billing: billing ?? "monthly",
        homeDelivery: homeDelivery ? "true" : "false",
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

    if (giftCardCode) {
      await supabase
        .from("gift_cards")
        .update({ status: "used", redeemed_at: new Date().toISOString() })
        .eq("code", giftCardCode)
        .eq("status", "active")
    }

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
