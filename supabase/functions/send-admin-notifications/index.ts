// Drains the admin_notifications outbox to WhatsApp (Meta Cloud API).
//
// Service-role only: invoked every minute by pg_cron (see the
// 20261122120000_admin_notifications migration). Disabled kinds are marked
// 'skipped' rather than left pending, so turning one on later does not flush
// a backlog of stale alerts.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { formatAdminMessage } from "../_shared/admin-notifications.ts"
import { isWhatsAppConfigured, sendWhatsAppAlert } from "../_shared/whatsapp.ts"

const MAX_ATTEMPTS = 3
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

  const { data: setting } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "admin_whatsapp")
    .maybeSingle()
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
      summary.skipped++
      continue
    }
    if (!configured) continue

    const result = await sendWhatsAppAlert(message)
    if (result.ok) {
      await supabase
        .from("admin_notifications")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", row.id)
      summary.sent++
      continue
    }

    const attempts = row.attempts + 1
    const isFinal = !result.retryable || attempts >= MAX_ATTEMPTS
    console.error(`Admin notification ${row.id} (${row.kind}): ${result.error}`)
    await supabase
      .from("admin_notifications")
      .update({
        attempts,
        last_error: result.error.slice(0, 500),
        status: isFinal ? "failed" : "pending",
      })
      .eq("id", row.id)
    isFinal ? summary.failed++ : summary.retry++
  }

  return json(summary)
})
