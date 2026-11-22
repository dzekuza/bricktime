import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

export type AdminNotificationKind =
  | "new_subscriber"
  | "subscription_started"
  | "payment_failed"
  | "subscription_cancelled"

type Payload = Record<string, unknown>

const MAX_FIELD_LENGTH = 40
// The RFC limit, so a long but real address keeps the alert identifiable.
const MAX_EMAIL_LENGTH = 254

// Names and emails come from signup forms, so they are untrusted and WhatsApp
// turns anything link-shaped into a tappable link. An allowlist (rather than a
// link blocklist, which misses bare domains like "evil.com/pay") keeps a hostile
// signup from turning the admin alert into a phishing message: names keep only
// letters, spaces, apostrophes and hyphens, so no dot, colon or slash survives.
const fallback = "—"

const clip = (value: string, max: number) => value.slice(0, max).trim()

const name = (value: unknown) => {
  if (typeof value !== "string") return fallback
  const cleaned = value
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{M} '-]/gu, "")
    .replace(/\s+/g, " ")
  return clip(cleaned, MAX_FIELD_LENGTH) || fallback
}

const EMAIL_RE = /^[\w.+-]+@[\w-]+(?:\.[\w-]+)+$/

const email = (value: unknown) => {
  if (typeof value !== "string") return fallback
  const trimmed = value.normalize("NFKC").trim()
  return trimmed.length <= MAX_EMAIL_LENGTH && EMAIL_RE.test(trimmed)
    ? trimmed
    : fallback
}

const planKey = (value: unknown) =>
  typeof value === "string"
    ? clip(value.replace(/[^\w-]/g, ""), MAX_FIELD_LENGTH) || fallback
    : fallback

const euro = (value: unknown) =>
  typeof value === "number" ? `${value.toFixed(2).replace(".", ",")} €` : "—"

// Meta rejects template parameters with newlines, tabs or long runs of
// spaces, so every message is one line.
export function formatAdminMessage(
  kind: string,
  payload: Payload
): string | null {
  switch (kind) {
    case "new_subscriber":
      return `Naujas narys: ${name(payload.name)} · ${email(payload.email)}`
    case "subscription_started":
      return `Nauja prenumerata: ${email(payload.email)} · ${planKey(payload.plan)} · ${euro(payload.amount)}`
    case "payment_failed":
      return `Nepavyko apmokėjimas: ${email(payload.email)} · ${euro(payload.amount)}`
    case "subscription_cancelled":
      return `Prenumerata atšaukta: ${email(payload.email)}`
    default:
      return null
  }
}

const ENQUEUE_ATTEMPTS = 3

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Never throws: the caller is a webhook whose real work is already done, and a
// Stripe retry would repeat it (so a failure here is not redelivered). A short
// inline retry covers a transient database error; after that the alert is
// logged as lost. A repeat delivery hits the unique dedupe_key and is a no-op.
export async function enqueueAdminNotification(
  supabase: SupabaseClient,
  kind: AdminNotificationKind,
  payload: Payload,
  dedupeKey: string
): Promise<void> {
  for (let attempt = 1; attempt <= ENQUEUE_ATTEMPTS; attempt++) {
    try {
      const { error } = await supabase
        .from("admin_notifications")
        .insert({ kind, payload, dedupe_key: dedupeKey })
      if (!error || error.code === "23505") return
      console.error(
        `Admin notification "${kind}" not queued (try ${attempt}): ${error.message}`
      )
    } catch (error) {
      console.error(
        `Admin notification "${kind}" not queued (try ${attempt}):`,
        error
      )
    }
    if (attempt < ENQUEUE_ATTEMPTS) await wait(200 * attempt)
  }
}
