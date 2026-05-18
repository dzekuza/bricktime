import Stripe from "https://esm.sh/stripe@14.21.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const raw = Array.from(
    { length: 12 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("")
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { amountCents, recipientEmail, buyerEmail, message, successUrl, cancelUrl } =
      await req.json()

    if (!amountCents || !recipientEmail || !buyerEmail || !successUrl || !cancelUrl) {
      throw new Error("amountCents, recipientEmail, buyerEmail, successUrl, cancelUrl are required")
    }

    const validAmounts = [2000, 3000, 5000, 8000, 10000, 20000]
    if (!validAmounts.includes(amountCents)) {
      throw new Error("Invalid gift card amount")
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )

    let code = generateCode()
    let attempts = 0
    while (attempts < 5) {
      const { data: existing } = await supabase
        .from("gift_cards")
        .select("id")
        .eq("code", code)
        .maybeSingle()
      if (!existing) break
      code = generateCode()
      attempts++
    }

    const amountEur = amountCents / 100

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `BRICKTIME dovanų kortelė — €${amountEur}`,
              description: `Gavėjas: ${recipientEmail}`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      customer_email: buyerEmail,
      success_url: successUrl
        .replace("{CODE}", encodeURIComponent(code))
        .replace("{SESSION_ID}", "{CHECKOUT_SESSION_ID}"),
      cancel_url: cancelUrl,
      metadata: { code, recipientEmail, buyerEmail },
    })

    await supabase.from("gift_cards").insert({
      code,
      amount_cents: amountCents,
      recipient_email: recipientEmail,
      buyer_email: buyerEmail,
      message: message ?? null,
      status: "active",
      stripe_session_id: session.id,
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
