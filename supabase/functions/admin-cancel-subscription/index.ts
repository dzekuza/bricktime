import Stripe from "https://esm.sh/stripe@14.21.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

import { releaseSchedule } from "../_shared/plan-schedule.ts"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })

// Admin cancel ends the member's Stripe subscription immediately. Flipping only
// the `status` column leaves Stripe billing and makes create-checkout refuse a
// new plan ("a live subscription exists"), so Stripe is cancelled first and the
// row follows. No refund is issued.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401)

    const callerClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const {
      data: { user: caller },
    } = await callerClient.auth.getUser()
    if (caller?.app_metadata?.role !== "admin") {
      return json({ error: "Forbidden" }, 403)
    }

    const { ids } = await req.json()
    if (
      !Array.isArray(ids) ||
      ids.length === 0 ||
      ids.some((id) => typeof id !== "string")
    ) {
      return json({ error: "ids must be a non-empty array of ids" }, 400)
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const errors: { id: string; message: string }[] = []
    for (const id of ids as string[]) {
      try {
        await cancelOne(supabase, id)
      } catch (err) {
        console.error(
          `admin-cancel-subscription failed for ${id}:`,
          (err as Error).message
        )
        errors.push({ id, message: (err as Error).message })
      }
    }

    if (errors.length > 0) return json({ errors }, 207)
    return json({ success: true })
  } catch (err) {
    console.error("admin-cancel-subscription failed:", (err as Error).message)
    return json({ error: (err as Error).message }, 400)
  }
})

// deno-lint-ignore no-explicit-any
async function cancelOne(supabase: any, id: string) {
  const { data: subscriber, error } = await supabase
    .from("subscribers")
    .select("stripe_subscription_id")
    .eq("id", id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!subscriber) throw new Error("Subscriber not found")

  if (subscriber.stripe_subscription_id) {
    try {
      const subscription = await stripe.subscriptions.retrieve(
        subscriber.stripe_subscription_id
      )
      if (subscription.status !== "canceled") {
        // A pending-downgrade schedule owns the subscription and blocks cancel.
        await releaseSchedule(stripe, subscription)
        await stripe.subscriptions.cancel(subscription.id)
      }
    } catch (err) {
      // A stored id Stripe no longer knows is a stale row: nothing to cancel.
      if ((err as { code?: string }).code !== "resource_missing") throw err
    }
  }

  const { error: updateError } = await supabase
    .from("subscribers")
    .update({
      status: "cancelled",
      cancel_requested: false,
      cancel_at: null,
      paused_until: null,
      pending_plan: null,
      pending_home_delivery: null,
      pending_schedule_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
  if (updateError) throw new Error(updateError.message)
}
