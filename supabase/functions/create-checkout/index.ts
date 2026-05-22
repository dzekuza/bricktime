import Stripe from "https://esm.sh/stripe@14.21.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
})

const PLAN_CONFIG: Record<string, { name: string; amount: number }> = {
  mystery_s: { name: "Mystery Box Mėgėjams",  amount: 1999 },
  nano:      { name: "BRICKTIME Mėgėjas",     amount: 2499 },
  mystery_m: { name: "Mystery Box Kūrėjams",  amount: 2999 },
  mini:      { name: "BRICKTIME Kūrėjas",     amount: 3499 },
  standard:  { name: "BRICKTIME Standard",    amount: 2400 },
  pro:       { name: "BRICKTIME Pro",         amount: 3500 },
  mega:      { name: "BRICKTIME Mega",        amount: 5500 },
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { planKey, userId, userEmail, successUrl, cancelUrl, discountedAmount, giftCardCode, homeDelivery } =
      await req.json()

    const plan = PLAN_CONFIG[planKey]
    if (!plan) throw new Error(`Unknown plan: ${planKey}`)

    const unitAmount =
      discountedAmount != null && discountedAmount > 0
        ? Math.round(discountedAmount * 100)
        : plan.amount

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: plan.name },
            unit_amount: unitAmount,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
        ...(homeDelivery ? [{
          price_data: {
            currency: "eur",
            product_data: { name: "Pristatymas į duris" },
            unit_amount: 300,
            recurring: { interval: "month" },
          },
          quantity: 1,
        }] : []),
      ],
      customer_email: userEmail ?? undefined,
      client_reference_id: userId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId, planKey },
    })

    if (giftCardCode) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      )
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
