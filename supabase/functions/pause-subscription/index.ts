import Stripe from "https://esm.sh/stripe@14.21.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

import { getHeldBrickValue } from "../_shared/plan-schedule.ts"

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

const MAX_PAUSE_MONTHS = 3

// Pauses billing for 1–3 monthly renewals: Stripe voids the invoices that
// fall inside the pause, and no new rentals start until it ends (the order
// insert trigger checks subscribers.paused_until). The paid current period
// is not refunded. Only a monthly plan with every set returned can pause.
// `undo` resumes billing straight away.
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

    const body = await req.json().catch(() => ({}))
    const undo = body?.undo === true
    const months = Number(body?.months)

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const { data: subscriber } = await supabase
      .from("subscribers")
      .select("stripe_subscription_id, cancel_requested, pending_plan")
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
      if (subscription.pause_collection) {
        await stripe.subscriptions.update(subscription.id, {
          pause_collection: "",
        })
      }
      await supabase
        .from("subscribers")
        .update({ paused_until: null })
        .eq("id", user.id)
      return json({ status: "resumed" })
    }

    if (!Number.isInteger(months) || months < 1 || months > MAX_PAUSE_MONTHS) {
      return json({ error: "Pristabdyti galima 1–3 mėnesiams." }, 400)
    }
    if (subscription.pause_collection) {
      return json({ error: "Prenumerata jau pristabdyta." }, 400)
    }
    if (subscription.cancel_at_period_end || subscriber.cancel_requested) {
      return json({ error: "Prenumerata jau atšaukiama." }, 400)
    }
    if (subscriber.pending_plan || subscription.schedule) {
      return json({ error: "Pirmiausia atšauk suplanuotą plano keitimą." }, 400)
    }
    const isMonthly = subscription.items.data.every(
      (item: Stripe.SubscriptionItem) =>
        item.price.recurring?.interval === "month"
    )
    if (!isMonthly) {
      return json(
        { error: "Pristabdyti galima tik mėnesinę prenumeratą." },
        400
      )
    }
    const heldValue = await getHeldBrickValue(supabase, user.id)
    if (heldValue > 0) {
      return json(
        {
          error:
            "Pirmiausia grąžink turimus rinkinius – tada galėsi pristabdyti.",
          heldValue,
        },
        400
      )
    }

    // Runs past `months` renewals after the paid period, so exactly that
    // many invoices are voided.
    const resumesAt = new Date(subscription.current_period_end * 1000)
    resumesAt.setMonth(resumesAt.getMonth() + months)
    resumesAt.setHours(resumesAt.getHours() + 1)

    await stripe.subscriptions.update(subscription.id, {
      pause_collection: {
        behavior: "void",
        resumes_at: Math.floor(resumesAt.getTime() / 1000),
      },
    })
    await supabase
      .from("subscribers")
      .update({ paused_until: resumesAt.toISOString() })
      .eq("id", user.id)

    return json({ status: "paused", pausedUntil: resumesAt.toISOString() })
  } catch (err) {
    console.error("pause-subscription failed:", (err as Error).message)
    return json({ error: "Nepavyko. Bandyk dar kartą." }, 400)
  }
})
