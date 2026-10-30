import Stripe from "https://esm.sh/stripe@14.21.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

import {
  fitsWithinCredits,
  getHeldBrickValue,
  releaseSchedule,
  schedulePlanChange,
} from "../_shared/plan-schedule.ts"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
})

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

const ACTIVE_STATUSES = new Set(["active", "trialing"])

type PendingRow = {
  id: string
  stripe_subscription_id: string | null
  pending_plan: string | null
  pending_schedule_id: string | null
  cancel_requested: boolean
}

async function clearPending(id: string) {
  await supabase
    .from("subscribers")
    .update({
      pending_plan: null,
      pending_home_delivery: null,
      pending_schedule_id: null,
    })
    .eq("id", id)
}

// Keeps Stripe in step with what the member holds: a pending downgrade is
// scheduled while the held sets fit the new plan and un-scheduled when they
// stop fitting (the old plan then renews at its own price), and a requested
// cancellation takes effect only once everything is returned. Safe to run as
// often as needed; it only reads state the database already holds.
async function processRow(row: PendingRow): Promise<string> {
  if (!row.stripe_subscription_id) return "no_subscription"

  let subscription: Stripe.Subscription
  try {
    subscription = await stripe.subscriptions.retrieve(
      row.stripe_subscription_id
    )
  } catch (err) {
    if ((err as { code?: string }).code === "resource_missing") {
      await clearPending(row.id)
      await supabase
        .from("subscribers")
        .update({ cancel_requested: false })
        .eq("id", row.id)
      return "stale_subscription"
    }
    throw err
  }
  if (!ACTIVE_STATUSES.has(subscription.status)) return "inactive"

  // The webhook normally moves the plan when the scheduled phase starts; this
  // catches the same moment from the schedule itself in case it didn't.
  if (row.pending_plan && row.pending_schedule_id) {
    try {
      const schedule = await stripe.subscriptionSchedules.retrieve(
        row.pending_schedule_id
      )
      const nextPhase = schedule.phases[1]
      const landed =
        schedule.status === "released" ||
        schedule.status === "completed" ||
        (nextPhase != null &&
          schedule.current_phase != null &&
          schedule.current_phase.start_date >= nextPhase.start_date)
      if (landed) {
        const { data: pending } = await supabase
          .from("subscribers")
          .select("pending_home_delivery")
          .eq("id", row.id)
          .maybeSingle()
        await supabase
          .from("subscribers")
          .update({
            plan: row.pending_plan,
            ...(pending?.pending_home_delivery != null && {
              home_delivery: pending.pending_home_delivery,
            }),
            pending_plan: null,
            pending_home_delivery: null,
            pending_schedule_id: null,
          })
          .eq("id", row.id)
        return "downgrade_applied"
      }
    } catch (err) {
      if ((err as { code?: string }).code !== "resource_missing") throw err
      await supabase
        .from("subscribers")
        .update({ pending_schedule_id: null })
        .eq("id", row.id)
      row.pending_schedule_id = null
    }
  }

  const heldValue = await getHeldBrickValue(supabase, row.id)
  const actions: string[] = []

  if (row.cancel_requested && heldValue === 0) {
    // A schedule would block the update, and cancelling supersedes it.
    await releaseSchedule(stripe, subscription)
    await clearPending(row.id)
    await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
    })
    await supabase
      .from("subscribers")
      .update({ cancel_requested: false })
      .eq("id", row.id)
    return "cancel_scheduled"
  }

  if (row.pending_plan) {
    const { data: target } = await supabase
      .from("plans")
      .select("credits")
      .eq("id", row.pending_plan)
      .maybeSingle()
    if (!target) return "unknown_pending_plan"

    const fits = fitsWithinCredits(heldValue, target.credits)
    if (fits && !row.pending_schedule_id) {
      const scheduled = await schedulePlanChange(stripe, supabase, row.id)
      await supabase
        .from("subscribers")
        .update({ pending_schedule_id: scheduled.scheduleId })
        .eq("id", row.id)
      actions.push("downgrade_scheduled")
    } else if (!fits && row.pending_schedule_id) {
      await releaseSchedule(stripe, subscription)
      await supabase
        .from("subscribers")
        .update({ pending_schedule_id: null })
        .eq("id", row.id)
      actions.push("downgrade_postponed")
    }
  }

  return actions.join(",") || "unchanged"
}

Deno.serve(async () => {
  const { data: rows, error } = await supabase
    .from("subscribers")
    .select(
      "id, stripe_subscription_id, pending_plan, pending_schedule_id, cancel_requested"
    )
    .or("pending_plan.not.is.null,cancel_requested.eq.true")

  if (error) {
    console.error("process-plan-changes: load failed:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }

  const results: Record<string, string> = {}
  for (const row of (rows ?? []) as PendingRow[]) {
    try {
      results[row.id] = await processRow(row)
    } catch (err) {
      // One member's failure must not stop the rest; the next run retries.
      console.error(
        `process-plan-changes: ${row.id} failed:`,
        (err as Error).message
      )
      results[row.id] = "error"
    }
  }

  return new Response(JSON.stringify({ processed: results }), {
    headers: { "Content-Type": "application/json" },
  })
})
