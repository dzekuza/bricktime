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
// A scheduled cancellation is re-checked this close to its end date, because
// a set rented while it was pending must still be returned before it takes effect.
const CANCEL_RECHECK_HOURS = 72

type PendingRow = {
  id: string
  stripe_subscription_id: string | null
  pending_plan: string | null
  pending_schedule_id: string | null
  cancel_requested: boolean
  cancel_at: string | null
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

// Only the pg_cron job knows the secret (it lives in public.cron_secrets, which
// no API role can read), so this can't be triggered with the public anon key.
async function isAuthorized(req: Request): Promise<boolean> {
  const provided = req.headers.get("x-cron-secret")
  if (!provided) return false
  const { data } = await supabase
    .from("cron_secrets")
    .select("secret")
    .eq("name", "plan_changes")
    .maybeSingle()
  return Boolean(data?.secret) && timingSafeEqual(provided, data!.secret)
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

  // A cancellation was scheduled while no sets were held, but one was rented
  // since. The fee must carry on until it is returned, so turn the cancellation
  // back into a request that waits for the return.
  if (
    !row.cancel_requested &&
    subscription.cancel_at_period_end &&
    heldValue > 0 &&
    row.cancel_at &&
    new Date(row.cancel_at).getTime() - Date.now() <=
      CANCEL_RECHECK_HOURS * 3_600_000
  ) {
    await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: false,
    })
    await supabase
      .from("subscribers")
      .update({ cancel_requested: true })
      .eq("id", row.id)
    return "cancel_postponed"
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

Deno.serve(async (req) => {
  if (!(await isAuthorized(req))) return json(401, { error: "Unauthorized" })

  const recheckBefore = new Date(
    Date.now() + CANCEL_RECHECK_HOURS * 3_600_000
  ).toISOString()
  const { data: rows, error } = await supabase
    .from("subscribers")
    .select(
      "id, stripe_subscription_id, pending_plan, pending_schedule_id, cancel_requested, cancel_at"
    )
    .or(
      `pending_plan.not.is.null,cancel_requested.eq.true,and(status.eq.active,cancel_at.not.is.null,cancel_at.lte.${recheckBefore})`
    )

  if (error) {
    console.error("process-plan-changes: load failed:", error.message)
    return json(500, { error: "Load failed" })
  }

  // Counts only: per-member ids stay in the logs, not in the response.
  const outcomes: Record<string, number> = {}
  for (const row of (rows ?? []) as PendingRow[]) {
    let outcome: string
    try {
      outcome = await processRow(row)
    } catch (err) {
      // One member's failure must not stop the rest; the next run retries.
      console.error(
        `process-plan-changes: ${row.id} failed:`,
        (err as Error).message
      )
      outcome = "error"
    }
    outcomes[outcome] = (outcomes[outcome] ?? 0) + 1
  }

  return json(200, { checked: rows?.length ?? 0, outcomes })
})
