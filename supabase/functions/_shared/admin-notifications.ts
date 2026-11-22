import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

export type AdminNotificationKind =
  | "new_subscriber"
  | "subscription_started"
  | "payment_failed"
  | "subscription_cancelled"

type Payload = Record<string, unknown>

const MAX_FIELD_LENGTH = 40

// Names and emails come from signup forms, so they are untrusted. Stripping
// links, control characters and everything past a short cap keeps a hostile
// signup from turning the admin alert into a phishing message.
const text = (value: unknown, fallback = "—") => {
  if (typeof value !== "string") return fallback
  const cleaned = value
    .replace(/[\p{Cc}\p{Cf}]/gu, " ")
    .replace(/(?:https?:\/\/|www\.)\S*/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_FIELD_LENGTH)
    .trim()
  return cleaned || fallback
}

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
      return `Naujas narys: ${text(payload.name)} · ${text(payload.email)}`
    case "subscription_started":
      return `Nauja prenumerata: ${text(payload.email)} · ${text(payload.plan)} · ${euro(payload.amount)}`
    case "payment_failed":
      return `Nepavyko apmokėjimas: ${text(payload.email)} · ${euro(payload.amount)}`
    case "subscription_cancelled":
      return `Prenumerata atšaukta: ${text(payload.email)}`
    default:
      return null
  }
}

// Never throws: the caller is a webhook whose real work is already done, and a
// Stripe retry would repeat it. A repeat delivery hits the unique dedupe_key.
export async function enqueueAdminNotification(
  supabase: SupabaseClient,
  kind: AdminNotificationKind,
  payload: Payload,
  dedupeKey: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from("admin_notifications")
      .insert({ kind, payload, dedupe_key: dedupeKey })
    if (error && error.code !== "23505") {
      console.error(`Admin notification "${kind}" not queued: ${error.message}`)
    }
  } catch (error) {
    console.error(`Admin notification "${kind}" not queued:`, error)
  }
}
