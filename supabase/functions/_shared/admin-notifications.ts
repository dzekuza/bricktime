import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

export type AdminNotificationKind =
  | "new_subscriber"
  | "subscription_started"
  | "payment_failed"
  | "subscription_cancelled"
  | "merch_order"
  | "rental_order"
  | "mystery_request"
  | "return_requested"
  | "missing_part_request"
  | "gift_card_bought"
  | "product_review"
  | "test"

type Payload = Record<string, unknown>

const MAX_FIELD_LENGTH = 40
// The RFC limit, so a long but real address keeps the alert identifiable.
const MAX_EMAIL_LENGTH = 254

// Names and emails come from signup forms, so they are untrusted and WhatsApp
// turns anything link-shaped into a tappable link. An allowlist (rather than a
// link blocklist, which misses bare domains like "evil.com/pay") keeps a hostile
// signup from turning the admin alert into a phishing message: names keep only
// letters, spaces, apostrophes and hyphens, so no dot, colon or slash survives.
// Emails must look like an address, and every dot is defanged to "[.]" because
// the domain is attacker-chosen and would otherwise be a tappable link.
const fallback = "—"

const clip = (value: string, max: number) => value.slice(0, max).trim()

const name = (value: unknown) => {
  if (typeof value !== "string") return fallback
  const cleaned = value
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    // ’ and ʼ are the typographic apostrophes keyboards produce in names.
    .replace(/[^\p{L}\p{M} '’ʼ-]/gu, "")
    .replace(/\s+/g, " ")
  return clip(cleaned, MAX_FIELD_LENGTH) || fallback
}

const EMAIL_RE = /^[\w.+-]+@[\w-]+(?:\.[\w-]+)+$/

const email = (value: unknown) => {
  if (typeof value !== "string") return fallback
  const trimmed = value.normalize("NFKC").trim()
  return trimmed.length <= MAX_EMAIL_LENGTH && EMAIL_RE.test(trimmed)
    ? trimmed.replaceAll(".", "[.]")
    : fallback
}

// Product titles, set and part codes: letters and digits are needed here, but
// the same rule applies, no dot, colon or slash survives.
const label = (value: unknown) => {
  if (typeof value !== "string" && typeof value !== "number") return fallback
  const cleaned = String(value)
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{M}\p{N} '’ʼ-]/gu, "")
    .replace(/\s+/g, " ")
  return clip(cleaned, MAX_FIELD_LENGTH) || fallback
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
    case "merch_order":
      return `Merch užsakymas #${label(payload.order_number)}: ${name(payload.name)} · ${label(payload.item)} · ${euro(payload.amount)}`
    case "rental_order":
      return `Nauja nuoma: ${name(payload.name)} · ${label(payload.product)}`
    case "mystery_request":
      return `Mystery Box užklausa: ${name(payload.name)}`
    case "return_requested":
      return `Grąžinimo užklausa: ${name(payload.name)} · ${label(payload.product)}`
    case "missing_part_request":
      return `Trūkstama detalė: ${name(payload.name)} · rinkinys ${label(payload.set)} · detalė ${label(payload.part)} x${label(payload.quantity)}`
    case "gift_card_bought":
      return `Nupirkta dovanų kortelė: ${euro(payload.amount)} · ${email(payload.email)}`
    case "product_review":
      return `Naujas atsiliepimas: ${name(payload.name)} · ${label(payload.rating)}/5 · ${label(payload.product)}`
    case "test":
      // Channel-neutral: the same text goes to WhatsApp and to Telegram.
      return "Bandomasis pranešimas: pranešimai veikia"
    default:
      return null
  }
}

// --- Telegram: rich HTML message --------------------------------------------
// Telegram can render bold text, code and links, so its alert carries more
// than the one-line text above. Every value is still untrusted: text is
// HTML-escaped, and a link is built only from a fixed base or a validated id,
// never from a member-supplied URL.

export type TelegramAlert = {
  html: string
  buttons: { text: string; url: string }[]
}

const DEFAULT_ADMIN_URL = "https://www.bricktime.lt/admin/"

const esc = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")

const adminLink = (path: string) => {
  const base = Deno.env.get("ADMIN_SITE_URL") ?? DEFAULT_ADMIN_URL
  return `${base.replace(/\/+$/, "")}/${path}`
}

// Cleaned like the plain alert, but readable: the email stays whole and becomes
// a mailto link (the address already passed EMAIL_RE, so it holds no quote or
// angle bracket), which Telegram would otherwise guess at.
const emailHtml = (value: unknown) => {
  const plain = email(value)
  if (plain === fallback) return fallback
  const real = plain.replaceAll("[.]", ".")
  return `<a href="mailto:${real}">${esc(real)}</a>`
}

const STRIPE_CUSTOMER_RE = /^cus_[A-Za-z0-9]+$/
const STRIPE_INVOICE_URL_RE = /^https:\/\/invoice\.stripe\.com\/[\w\-/.?=&%]+$/

const stripeButtons = (payload: Payload) => {
  const buttons: TelegramAlert["buttons"] = []
  const customer = payload.stripe_customer
  if (typeof customer === "string" && STRIPE_CUSTOMER_RE.test(customer)) {
    buttons.push({
      text: "Stripe klientas",
      url: `https://dashboard.stripe.com/customers/${customer}`,
    })
  }
  const invoice = payload.invoice_url
  if (typeof invoice === "string" && STRIPE_INVOICE_URL_RE.test(invoice)) {
    buttons.push({ text: "Sąskaita", url: invoice })
  }
  return buttons
}

const line = (icon: string, title: string, value: string) =>
  `${icon} ${title}: ${value}`

const stars = (value: unknown) => {
  const rating = Number(value)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return fallback
  return `${"★".repeat(rating)}${"☆".repeat(5 - rating)} (${rating}/5)`
}

const card = (
  icon: string,
  title: string,
  rows: string[],
  buttons: TelegramAlert["buttons"] = []
): TelegramAlert => ({
  html: [`${icon} <b>${esc(title)}</b>`, ...rows].join("\n"),
  buttons,
})

export function formatTelegramMessage(
  kind: string,
  payload: Payload
): TelegramAlert | null {
  const open = (text: string, path: string) => [
    { text, url: adminLink(path) },
  ]
  switch (kind) {
    case "new_subscriber":
      return card(
        "🆕",
        "Naujas narys",
        [
          line("👤", "Vardas", `<b>${esc(name(payload.name))}</b>`),
          line("✉️", "El. paštas", emailHtml(payload.email)),
        ],
        open("Nariai", "subscribers")
      )
    case "subscription_started":
      return card(
        "🎉",
        "Nauja prenumerata",
        [
          line("✉️", "El. paštas", emailHtml(payload.email)),
          line("📦", "Planas", `<code>${esc(planKey(payload.plan))}</code>`),
          line("💶", "Suma", `<b>${esc(euro(payload.amount))}</b>`),
        ],
        [...open("Nariai", "subscribers"), ...stripeButtons(payload)]
      )
    case "payment_failed":
      return card(
        "⚠️",
        "Nepavyko apmokėjimas",
        [
          line("✉️", "El. paštas", emailHtml(payload.email)),
          line("💶", "Suma", `<b>${esc(euro(payload.amount))}</b>`),
        ],
        [...open("Nariai", "subscribers"), ...stripeButtons(payload)]
      )
    case "subscription_cancelled":
      return card(
        "👋",
        "Prenumerata atšaukta",
        [line("✉️", "El. paštas", emailHtml(payload.email))],
        [...open("Nariai", "subscribers"), ...stripeButtons(payload)]
      )
    case "merch_order":
      return card(
        "🛍",
        `Merch užsakymas #${label(payload.order_number)}`,
        [
          line("👤", "Pirkėjas", `<b>${esc(name(payload.name))}</b>`),
          line("🧱", "Prekė", esc(label(payload.item))),
          line("💶", "Suma", `<b>${esc(euro(payload.amount))}</b>`),
        ],
        open("Merch užsakymai", "merch")
      )
    case "rental_order":
      return card(
        "📦",
        "Nauja nuoma",
        [
          line("👤", "Narys", `<b>${esc(name(payload.name))}</b>`),
          line("🧱", "Rinkinys", esc(label(payload.product))),
        ],
        open("Užsakymai", "orders")
      )
    case "mystery_request":
      return card(
        "🎁",
        "Mystery Box užklausa",
        [line("👤", "Narys", `<b>${esc(name(payload.name))}</b>`)],
        open("Užsakymai", "orders")
      )
    case "return_requested":
      return card(
        "↩️",
        "Grąžinimo užklausa",
        [
          line("👤", "Narys", `<b>${esc(name(payload.name))}</b>`),
          line("🧱", "Rinkinys", esc(label(payload.product))),
        ],
        open("Užsakymai", "orders")
      )
    case "missing_part_request":
      return card(
        "🔧",
        "Trūkstama detalė",
        [
          line("👤", "Narys", `<b>${esc(name(payload.name))}</b>`),
          line("🧱", "Rinkinys", `<code>${esc(label(payload.set))}</code>`),
          line("🔩", "Detalė", `<code>${esc(label(payload.part))}</code> × ${esc(label(payload.quantity))}`),
        ],
        open("Trūkstamos detalės", "missing-parts")
      )
    case "gift_card_bought":
      return card(
        "💝",
        "Nupirkta dovanų kortelė",
        [
          line("💶", "Suma", `<b>${esc(euro(payload.amount))}</b>`),
          line("✉️", "Pirkėjas", emailHtml(payload.email)),
        ],
        open("Dovanų kortelės", "gift-cards")
      )
    case "product_review":
      return card(
        "⭐",
        "Naujas atsiliepimas",
        [
          line("👤", "Narys", `<b>${esc(name(payload.name))}</b>`),
          line("🧱", "Rinkinys", esc(label(payload.product))),
          line("⭐", "Įvertinimas", stars(payload.rating)),
        ],
        open("Atsiliepimai", "reviews")
      )
    case "test":
      return card("✅", "Bandomasis pranešimas", ["Pranešimai veikia."])
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
  dedupeKey: string,
  { retryDelayMs = 200 }: { retryDelayMs?: number } = {}
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
    if (attempt < ENQUEUE_ATTEMPTS) await wait(retryDelayMs * attempt)
  }
}
