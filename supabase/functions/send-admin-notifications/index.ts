// Drains the admin_notifications outbox to WhatsApp (Meta Cloud API).
//
// Service-role only: invoked every minute by pg_cron (see the
// 20261122120000_admin_notifications migration). Disabled kinds are marked
// 'skipped' rather than left pending, so turning one on later does not flush
// a backlog of stale alerts.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { formatAdminMessage } from "../_shared/admin-notifications.ts"
import { isWhatsAppConfigured, sendWhatsAppAlert } from "../_shared/whatsapp.ts"

// Total sends per alert: the first try plus three retries.
const MAX_ATTEMPTS = 4
const BATCH_SIZE = 20
// Older than this and the alert is noise, not news.
const MAX_AGE_MS = 6 * 60 * 60 * 1000

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

  // Nothing to do until an admin enables it and the secrets exist; rows stay
  // pending (and age out below) instead of being lost.
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

  for (const row of rows ?? []) {
    const isStale = Date.now() - Date.parse(row.created_at) > MAX_AGE_MS
    const isKindOn =
      settings.enabled === true && settings.kinds?.[row.kind] !== false
    const message = formatAdminMessage(row.kind, row.payload ?? {})

    if (isStale || !isKindOn || !message) {
      await supabase
        .from("admin_notifications")
        .update({ status: "skipped" })
        .eq("id", row.id)
        .eq("status", "pending")
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
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", row.id)
      // The message is out, so this is only logged: retrying would resend it.
      // The claim already counted an attempt, which bounds any repeat.
      if (sentError) {
        console.error(`Marking ${row.id} sent failed: ${sentError.message}`)
      }
      summary.sent++
      continue
    }

    const isFinal = !result.retryable || attempts >= MAX_ATTEMPTS
    console.error(`Admin notification ${row.id} (${row.kind}): ${result.error}`)
    const { error: retryError } = await supabase
      .from("admin_notifications")
      .update({
        last_error: result.error.slice(0, 500),
        status: isFinal ? "failed" : "pending",
      })
      .eq("id", row.id)
    if (retryError) {
      console.error(`Recording failure of ${row.id} failed: ${retryError.message}`)
    }
    isFinal ? summary.failed++ : summary.retry++
  }

  return json(summary)
})
