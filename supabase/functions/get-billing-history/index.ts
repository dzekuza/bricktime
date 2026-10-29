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
    const { userId, userEmail } = await req.json()

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    // Older checkouts created a new Stripe customer each time, so history spans
    // the stored customer plus every customer sharing the account email.
    const customerIds = new Set<string>()

    if (userId) {
      const { data: subscriber } = await supabase
        .from("subscribers")
        .select("stripe_customer_id")
        .eq("id", userId)
        .maybeSingle()
      if (subscriber?.stripe_customer_id) {
        customerIds.add(subscriber.stripe_customer_id)
      }
    }

    if (userEmail) {
      const customers = await stripe.customers.list({
        email: userEmail,
        limit: 10,
      })
      for (const customer of customers.data) customerIds.add(customer.id)
    }

    if (customerIds.size === 0) {
      return new Response(JSON.stringify({ invoices: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const lists = await Promise.all(
      [...customerIds].map((customer) =>
        stripe.invoices.list({ customer, limit: 24, status: "paid" })
      )
    )
    const invoices = {
      data: lists
        .flatMap((list) => list.data)
        .sort((a, b) => b.created - a.created)
        .slice(0, 24),
    }

    const result = invoices.data.map((inv) => ({
      id: inv.id,
      amount: inv.amount_paid / 100,
      currency: inv.currency,
      description: inv.lines.data[0]?.description ?? inv.id,
      date: inv.created,
      status: inv.status,
      pdf: inv.invoice_pdf,
    }))

    return new Response(JSON.stringify({ invoices: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
