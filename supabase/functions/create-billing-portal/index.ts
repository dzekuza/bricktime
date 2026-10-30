import Stripe from "https://esm.sh/stripe@14.21.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
})

const PORTAL_CONFIG_TAG = "bricktime-no-cancel"
let portalConfigurationId: string | null = null

// Members can update cards and read invoices in the portal, but cancelling or
// switching plans there would skip the held-set rules, so both stay in the app.
async function getPortalConfigurationId(): Promise<string> {
  if (portalConfigurationId) return portalConfigurationId

  const existing = await stripe.billingPortal.configurations.list({
    is_default: false,
    limit: 100,
  })
  const found = existing.data.find(
    (config: {
      id: string
      active: boolean
      metadata?: Record<string, string> | null
    }) => config.metadata?.app === PORTAL_CONFIG_TAG && config.active
  )
  if (found) {
    portalConfigurationId = found.id
    return found.id
  }

  const created = await stripe.billingPortal.configurations.create({
    metadata: { app: PORTAL_CONFIG_TAG },
    business_profile: { headline: "BRICKTIME" },
    features: {
      customer_update: {
        enabled: true,
        allowed_updates: ["email", "address", "phone"],
      },
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: { enabled: false },
      subscription_update: { enabled: false },
    },
  })
  portalConfigurationId = created.id
  return created.id
}

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
    // Identity comes from the caller's token — a body userId would let anyone
    // open another customer's billing portal.
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

    const { returnUrl } = await req.json()

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
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
      const customers = await stripe.customers.list({
        email: userEmail,
        limit: 1,
      })
      customerId = customers.data[0]?.id ?? null
    }

    if (!customerId) {
      throw new Error("Nerasta Stripe paskyra. Pirmiausia užsakyk planą.")
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      configuration: await getPortalConfigurationId(),
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
