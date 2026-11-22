// Drains the admin_notifications outbox to WhatsApp (Meta Cloud API or Twilio).
//
// Service-role only: invoked every minute by pg_cron (see the
// 20261122120000_admin_notifications migration). Alerts that arrive while
// alerts, or their kind, are switched off are marked 'skipped' rather than left
// pending, so turning them on later does not flush a backlog of stale alerts.
// Rows are left pending only when WhatsApp is not configured yet or a send
// failed in a way worth retrying.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { formatAdminMessage } from "../_shared/admin-notifications.ts"
import { isWhatsAppConfigured, sendWhatsAppAlert } from "../_shared/whatsapp.ts"

// Total sends per alert: the first try plus three retries.
const MAX_ATTEMPTS = 4
const BATCH_SIZE = 20
// Wall-clock budget for one run. Each send has its own timeout, but 20 slow
// sends in a row would outlast the cron call and overlap the next minute's
// run; past the budget the rest of the batch stays pending for the next run.
const DRAIN_BUDGET_MS = 20_000
// Older than this and the alert is noise, not news.
const MAX_AGE_MS = 6 * 60 * 60 * 1000
// Signup alerts fire before email confirmation, so anyone can make them; the
// cap bounds what a flood of fake signups can cost in WhatsApp messages.
const MAX_NEW_SUBSCRIBER_ALERTS_PER_DAY = 20

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })

const fail = (status: number, code: string, message: string) =>
  json({ error: { code, message } }, status)

// The gateway (verify_jwt) has already validated the JWT signature.
function isServiceRole(req: Request): boolean {
  const bearer = req.headers
    .get("Authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim()
  if (!bearer) return false
  try {
    const claims = JSON.parse(atob(bearer.split(".")[1] ?? ""))
    return claims.role === "service_role"
  } catch {
    return false
  }
}

type Settings = { enabled?: boolean; kinds?: Record<string, boolean> }

Deno.serve(async (req) => {
  if (!isServiceRole(req)) {
    return fail(401, "unauthorized", "Service role required")
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  // A failed read must not look like "disabled": that would mark the whole
  // batch skipped for good. Leave the rows pending and try again next minute.
  const { data: setting, error: settingError } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "admin_whatsapp")
    .maybeSingle()
  if (settingError) {
    console.error("Settings read failed:", settingError.message)
    return fail(500, "settings_read_failed", "Could not read the settings")
  }
  const settings = (setting?.value ?? {}) as Settings
  const configured = isWhatsAppConfigured()

  const { count: sentSignupAlerts, error: capError } = await supabase
    .from("admin_notifications")
    .select("id", { count: "exact", head: true })
    .eq("kind", "new_subscriber")
    .eq("status", "sent")
    .gte("sent_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
  if (capError) {
    console.error("Signup alert count failed:", capError.message)
    return fail(500, "outbox_read_failed", "Could not read the outbox")
  }
  let signupAlertsLeft = Math.max(
    0,
    MAX_NEW_SUBSCRIBER_ALERTS_PER_DAY - (sentSignupAlerts ?? 0)
  )

  const { data: rows, error } = await supabase
    .from("admin_notifications")
    .select("id, kind, payload, attempts, created_at")
    .eq("status", "pending")
    .order("created_at")
    .limit(BATCH_SIZE)
  if (error) {
    console.error("Outbox read failed:", error.message)
    return fail(500, "outbox_read_failed", "Could not read the outbox")
  }

  const summary = { sent: 0, skipped: 0, failed: 0, retry: 0 }

  const startedAt = Date.now()

  for (const row of rows ?? []) {
    if (Date.now() - startedAt > DRAIN_BUDGET_MS) break

    const isStale = Date.now() - Date.parse(row.created_at) > MAX_AGE_MS
    const isKindOn =
      settings.enabled === true && settings.kinds?.[row.kind] !== false
    const message = formatAdminMessage(row.kind, row.payload ?? {})
    const isCapped = row.kind === "new_subscriber" && signupAlertsLeft <= 0

    // Once an alert is handled (sent, skipped or failed for good) its payload,
    // a member's name and email, is wiped: the outbox must not keep personal
    // data of accounts that may later be deleted. Pending rows keep it only
    // until they are handled or go stale.
    if (isStale || !isKindOn || !message || isCapped) {
      await supabase
        .from("admin_notifications")
        .update({ status: "skipped", payload: {} })
        .eq("id", row.id)
        .eq("status", "pending")
        // Same compare-and-swap as the claim below: a row another run has
        // already claimed must not have its payload wiped under its send.
        .eq("attempts", row.attempts)
      summary.skipped++
      continue
    }
    if (!configured) continue

    // Claim the row before sending: a compare-and-swap on `attempts` lets only
    // one of two overlapping drains win, so the loser skips instead of sending
    // the same alert twice.
    const attempts = row.attempts + 1
    const { data: claimed, error: claimError } = await supabase
      .from("admin_notifications")
      .update({ attempts })
      .eq("id", row.id)
      .eq("status", "pending")
      .eq("attempts", row.attempts)
      .select("id")
    if (claimError) {
      console.error(`Claiming ${row.id} failed: ${claimError.message}`)
      continue
    }
    if (!claimed?.length) continue

    const result = await sendWhatsAppAlert(message)
    if (result.ok) {
      const { error: sentError } = await supabase
        .from("admin_notifications")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          payload: {},
        })
        .eq("id", row.id)
      // The message is out, so this is only logged: retrying would resend it.
      // The claim already counted an attempt, which bounds any repeat.
      if (sentError) {
        console.error(`Marking ${row.id} sent failed: ${sentError.message}`)
      }
      summary.sent++
      if (row.kind === "new_subscriber") signupAlertsLeft--
      continue
    }

    const isFinal = !result.retryable || attempts >= MAX_ATTEMPTS
    console.error(`Admin notification ${row.id} (${row.kind}): ${result.error}`)
    const { error: retryError } = await supabase
      .from("admin_notifications")
      .update({
        last_error: result.error.slice(0, 500),
        status: isFinal ? "failed" : "pending",
        ...(isFinal ? { payload: {} } : {}),
      })
      .eq("id", row.id)
    if (retryError) {
      console.error(`Recording failure of ${row.id} failed: ${retryError.message}`)
    }
    isFinal ? summary.failed++ : summary.retry++

    // A throttled or failing provider will fail the rest of the batch too, and
    // each try would burn an attempt; stop and leave the others pending.
    if (result.retryable) break
  }

  return json(summary)
})
