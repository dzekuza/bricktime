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
      // A renewal that fell inside the pause was voided, so the period now
      // running is unpaid: billing resumes from the next renewal and rentals
      // stay blocked until then.
      const latestInvoiceId =
        typeof subscription.latest_invoice === "string"
          ? subscription.latest_invoice
          : subscription.latest_invoice?.id
      const latestInvoice = latestInvoiceId
        ? await stripe.invoices.retrieve(latestInvoiceId)
        : null
      const rentalsFrom =
        latestInvoice?.status === "void"
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null

      if (subscription.pause_collection) {
        await stripe.subscriptions.update(subscription.id, {
          pause_collection: "",
        })
      }
      const { error: resumeError } = await supabase
        .from("subscribers")
        .update({ paused_until: rentalsFrom })
        .eq("id", user.id)
      if (resumeError) {
        throw new Error(`Resume not saved: ${resumeError.message}`)
      }
      // A pause request racing this one may have won in Stripe; mirror it.
      const after = await stripe.subscriptions.retrieve(subscription.id)
      if (after.pause_collection) {
        await syncPausedUntil(supabase, user.id, after)
        return json({ error: "Prenumerata vis dar pristabdyta." }, 409)
      }
      return json({ status: "resumed", rentalsFrom })
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

    // The renewal at the end of the paid period and the next `months - 1`
    // are voided; collection resumes an hour after the last skipped one.
    // Rentals stay blocked until the first paid renewal, `months` later.
    const periodEnd = new Date(subscription.current_period_end * 1000)
    const resumesAt = addMonthsClamped(periodEnd, months - 1)
    resumesAt.setUTCHours(resumesAt.getUTCHours() + 1)
    const rentalsBlockedUntil = addMonthsClamped(periodEnd, months)

    // Blocks new rentals first, under the same lock the rental trigger takes,
    // and refuses if a set is still at home; Stripe is only paused after.
    const { data: isStarted, error: startError } = await supabase.rpc(
      "begin_subscription_pause",
      { p_subscriber: user.id, p_until: rentalsBlockedUntil.toISOString() }
    )
    if (startError) {
      throw new Error(`begin_subscription_pause: ${startError.message}`)
    }
    if (!isStarted) {
      return json(
        {
          error:
            "Pirmiausia grąžink turimus rinkinius – tada galėsi pristabdyti.",
        },
        400
      )
    }

    try {
      await stripe.subscriptions.update(
        subscription.id,
        {
          pause_collection: {
            behavior: "void",
            resumes_at: Math.floor(resumesAt.getTime() / 1000),
          },
        },
        // Per request, so a pause after an undo isn't replayed as the old one.
        { idempotencyKey: `pause-${crypto.randomUUID()}` }
      )
    } catch (stripeErr) {
      // A timeout can still have paused the subscription, so set the flag
      // from what Stripe actually holds instead of assuming it failed.
      const actual = await stripe.subscriptions
        .retrieve(subscription.id)
        .catch(() => null)
      if (actual) {
        await syncPausedUntil(supabase, user.id, actual)
      } else {
        // If retrieve failed and it was a client error that definitely
        // didn't pause Stripe, clear the lock from begin_subscription_pause.
        const isClientError =
          (stripeErr as { type?: string }).type === "invalid_request_error" ||
          (stripeErr as { statusCode?: number }).statusCode === 400
        if (isClientError) {
          await supabase
            .from("subscribers")
            .update({ paused_until: null })
            .eq("id", user.id)
        }
      }
      throw stripeErr
    }

    return json({
      status: "paused",
      pausedUntil: rentalsBlockedUntil.toISOString(),
    })
  } catch (err) {
    console.error("pause-subscription failed:", (err as Error).message)
    return json({ error: "Nepavyko. Bandyk dar kartą." }, 400)
  }
})

// Same day next month(s), clamped to the month's last day (Jan 31 -> Feb 28).
function addMonthsClamped(date: Date, months: number): Date {
  const target = new Date(date)
  const day = target.getUTCDate()
  target.setUTCDate(1)
  target.setUTCMonth(target.getUTCMonth() + months)
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)
  ).getUTCDate()
  target.setUTCDate(Math.min(day, lastDay))
  return target
}

// paused_until from Stripe's pause_collection; cleared when not paused.
async function syncPausedUntil(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  userId: string,
  subscription: Stripe.Subscription
) {
  const pause = subscription.pause_collection
  if (!pause) {
    await supabase
      .from("subscribers")
      .update({ paused_until: null })
      .eq("id", userId)
    return
  }

  const resumesAtMs = pause.resumes_at
    ? pause.resumes_at * 1000
    : Number.POSITIVE_INFINITY

  const { data: stored } = await supabase
    .from("subscribers")
    .select("paused_until")
    .eq("id", userId)
    .maybeSingle()

  const storedPausedUntilMs = stored?.paused_until
    ? Date.parse(stored.paused_until)
    : null

  // Keep the stored date if it is already later: pause-subscription stores
  // when rentals may start again (rentalsBlockedUntil), which is later
  // than Stripe's resumes_at (the skipped months are unpaid).
  const isStoredLater =
    storedPausedUntilMs !== null &&
    (Number.isNaN(storedPausedUntilMs) || storedPausedUntilMs >= resumesAtMs)

  if (!isStoredLater) {
    await supabase
      .from("subscribers")
      .update({
        paused_until: Number.isFinite(resumesAtMs)
          ? new Date(resumesAtMs).toISOString()
          : "infinity",
      })
      .eq("id", userId)
  }
}
