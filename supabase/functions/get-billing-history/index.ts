import Stripe from "https://esm.sh/stripe@14.21.0"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { userEmail } = await req.json()

    const customers = await stripe.customers.list({ email: userEmail, limit: 1 })
    if (!customers.data.length) {
      return new Response(JSON.stringify({ invoices: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const customerId = customers.data[0].id
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 24,
      status: "paid",
    })

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
