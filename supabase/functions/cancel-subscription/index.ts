import Stripe from "https://esm.sh/stripe@14.21.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

import { getHeldBrickValue, releaseSchedule } from "../_shared/plan-schedule.ts"

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

// Cancelling ends the subscription at the end of the paid period, but only once
// every set is returned: while sets are still at home the fee keeps running, so
// the request waits (cancel_requested) and process-plan-changes finishes it.
// `undo` withdraws either state.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return json({ error: "Unauthorized" }, 401)

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: userData } = await userClient.auth.getUser()
    const user = userData.user
    if (!user) return json({ error: "Unauthorized" }, 401)

    const { undo } = await req.json().catch(() => ({ undo: false }))

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const { data: subscriber } = await supabase
      .from("subscribers")
      .select("stripe_subscription_id")
      .eq("id", user.id)
      .maybeSingle()
    if (!subscriber?.stripe_subscription_id) {
      return json({ error: "Aktyvios prenumeratos nerasta." }, 400)
    }

    const subscription = await stripe.subscriptions.retrieve(
      subscriber.stripe_subscription_id
    )
    if (!["active", "trialing"].includes(subscription.status)) {
      return json({ error: "Aktyvios prenumeratos nerasta." }, 400)
    }

    if (undo) {
      await supabase
        .from("subscribers")
        .update({ cancel_requested: false })
        .eq("id", user.id)
      if (subscription.cancel_at_period_end) {
        await stripe.subscriptions.update(subscription.id, {
          cancel_at_period_end: false,
        })
      }
      return json({ status: "undone" })
    }

    const heldValue = await getHeldBrickValue(supabase, user.id)
    if (heldValue > 0) {
      await supabase
        .from("subscribers")
        .update({ cancel_requested: true })
        .eq("id", user.id)
      return json({ status: "pending_returns", heldValue })
    }

    // Cancelling supersedes a pending downgrade, and a schedule would block the
    // update below.
    await releaseSchedule(stripe, subscription)
    await supabase
      .from("subscribers")
      .update({
        pending_plan: null,
        pending_home_delivery: null,
        pending_schedule_id: null,
        cancel_requested: false,
      })
      .eq("id", user.id)
    await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
    })
    return json({
      status: "scheduled",
      cancelAt: new Date(subscription.current_period_end * 1000).toISOString(),
    })
  } catch (err) {
    console.error("cancel-subscription failed:", (err as Error).message)
    return json({ error: (err as Error).message }, 400)
  }
})
