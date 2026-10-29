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
    // Identity comes from the caller's token — a body userId would let anyone
    // open another customer's billing portal.
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return unauthorized()
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: authData } = await userClient.auth.getUser()
    if (!authData.user) return unauthorized()
    const userId = authData.user.id
    const userEmail = authData.user.email

    const { returnUrl } = await req.json()

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )

    let customerId: string | null = null

    if (userId) {
      const { data: subscriber } = await supabase
        .from("subscribers")
        .select("stripe_customer_id")
        .eq("id", userId)
        .maybeSingle()
      customerId = subscriber?.stripe_customer_id ?? null
    }

    // Email fallback only for a confirmed address; an unverified sign-up must
    // not reach another person's billing portal.
    if (!customerId && userEmail && authData.user.email_confirmed_at) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 })
      customerId = customers.data[0]?.id ?? null
    }

    if (!customerId) {
      throw new Error("Nerasta Stripe paskyra. Pirmiausia užsakyk planą.")
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
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
