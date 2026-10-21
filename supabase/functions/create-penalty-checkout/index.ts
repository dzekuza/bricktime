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

// subscribers.stripe_customer_id is writable by the row's owner, so only reuse
// it when Stripe confirms the customer belongs to the caller's email.
async function getOwnedCustomerId(
  customerId: string | null,
  userEmail: string | undefined
) {
  if (!customerId || !userEmail) return null
  try {
    const customer = await stripe.customers.retrieve(customerId)
    if (customer.deleted) return null
    return customer.email?.toLowerCase() === userEmail.toLowerCase()
      ? customer.id
      : null
  } catch (err) {
    // Only a confirmed-missing customer falls back to customer_email; any other
    // Stripe failure aborts so the invoice isn't silently split from the account.
    if ((err as { code?: string } | null)?.code === "resource_missing") {
      return null
    }
    throw err
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const callerClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const {
      data: { user: caller },
    } = await callerClient.auth.getUser()

    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { successUrl, cancelUrl } = await req.json()

    const userId = caller.id
    const userEmail = caller.email

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )
    const { data: subscriber, error: subscriberError } = await supabase
      .from("subscribers")
      .select("stripe_customer_id, penalty_amount, penalty_reason")
      .eq("id", userId)
      .maybeSingle()

    if (subscriberError) {
      console.error("create-penalty-checkout: subscriber lookup failed", {
        userId,
        error: subscriberError,
      })
      return new Response(JSON.stringify({ error: "Failed to load penalty" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const amount = subscriber?.penalty_amount ?? 0
    if (amount <= 0) throw new Error("No outstanding penalty")

    const reason = subscriber?.penalty_reason

    // Lets the webhook resolve exactly the penalty record this payment covers.
    const { data: penaltyRecord, error: recordError } = await supabase
      .from("subscriber_penalties")
      .select("id")
      .eq("subscriber_email", userEmail ?? "")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (recordError) {
      console.error("create-penalty-checkout: penalty record lookup failed", {
        userId,
        error: recordError,
      })
      return new Response(JSON.stringify({ error: "Failed to load penalty" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const customerId = await getOwnedCustomerId(
      subscriber?.stripe_customer_id ?? null,
      userEmail
    )

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "BRICKTIME Bauda",
              description: reason ?? "Baudos mokestis",
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      // Reusing the subscription's customer puts this invoice in the same
      // billing history (get-billing-history lists invoices per customer).
      ...(customerId
        ? { customer: customerId }
        : { customer_email: userEmail ?? undefined }),
      invoice_creation: { enabled: true },
      client_reference_id: userId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        type: "penalty",
        ...(penaltyRecord ? { penaltyRecordId: penaltyRecord.id } : {}),
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
