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

// Orders not yet fully returned — deleting the account would cascade-delete
// these rows and lose the record of a physical LEGO set still out with the customer.
const OPEN_ORDER_STATUSES = [
  "processing",
  "active",
  "overdue",
  "return_requested",
]

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

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const { count: openOrders } = await adminClient
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("subscriber_id", caller.id)
      .in("status", OPEN_ORDER_STATUSES)

    if ((openOrders ?? 0) > 0) {
      return new Response(
        JSON.stringify({
          error:
            "Prieš ištrindamas paskyrą, grąžink visus išsinuomotus rinkinius.",
        }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const { data: subscriber } = await adminClient
      .from("subscribers")
      .select("stripe_subscription_id")
      .eq("id", caller.id)
      .maybeSingle()

    if (subscriber?.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(subscriber.stripe_subscription_id)
      } catch (err) {
        // Already cancelled or gone on Stripe's side — not a reason to block deletion.
        console.error(
          "Stripe subscription cancel failed:",
          (err as Error).message
        )
      }
    }

    // Cascades to subscribers + every row that FKs to it (orders, feed_items, etc).
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(
      caller.id
    )
    if (deleteError) throw deleteError

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
