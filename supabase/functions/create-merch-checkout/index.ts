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
    const { itemId, size, successUrl, cancelUrl, userEmail } = await req.json()

    if (!itemId || !size) throw new Error("itemId and size are required")

    // Fetch item from DB to get canonical price + name
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )
    const { data: item, error } = await supabase
      .from("merch_items")
      .select("id, name, price, image_url, status, stock")
      .eq("id", itemId)
      .single()

    if (error || !item) throw new Error("Merch item not found")
    if (item.status === "draft") throw new Error("Item not available")
    const stock = (item.stock as Record<string, number> | null) ?? {}
    if (item.status === "active" && (stock[size] ?? 0) <= 0)
      throw new Error("Out of stock")

    const unitAmount = Math.round(Number(item.price) * 100) // cents

    const session = await stripe.checkout.sessions.create({
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
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { itemId, size },
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
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
