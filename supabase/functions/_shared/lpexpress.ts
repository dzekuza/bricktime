// LP EXPRESS (UNISEND) API v2 client — shared by Supabase Edge Functions.
//
// Environment (set via `supabase secrets set`):
//   LP_API_BASE       https://api-manosiuntostst.post.lt   (test)  |  https://api-manosiuntos.post.lt (prod)
//   LP_USERNAME        UNISEND business account username
//   LP_PASSWORD        UNISEND business account password
//   LP_SENDER_NAME     Sender name printed on the label            (courier / to-door only)
//   LP_SENDER_PHONE    Sender phone  e.g. +37060000000
//   LP_SENDER_EMAIL    Sender email
//   LP_SENDER_LOCALITY e.g. Vilnius
//   LP_SENDER_POSTCODE e.g. 03163
//   LP_SENDER_STREET   e.g. J. Jasinskio g.
//   LP_SENDER_BUILDING e.g. 16
//   LP_SENDER_FLAT     e.g. 1 (optional)
//   LP_SENDER_COUNTRY  default LT
//
// The OAuth token is cached in module scope for the lifetime of the warm
// isolate (LP tokens live ~1h); a fresh one is fetched when it expires.

const BASE = (Deno.env.get("LP_API_BASE") ?? "https://api-manosiuntostst.post.lt").replace(/\/$/, "")

function env(key: string): string {
  const v = Deno.env.get(key)
  if (!v) throw new Error(`Missing env var ${key}`)
  return v
}

/** Normalize a Lithuanian phone number to the +370XXXXXXXX format LP requires.
 *  Accepts +37060000000, 37060000000, 860000000, 60000000, 00370…, and spaced
 *  variants. Returns the input unchanged if it isn't recognizably LT (so
 *  non-LT numbers pass through to LP's own validation). */
export function ltPhone(raw: string): string {
  let d = (raw || "").replace(/\D/g, "") // digits only
  d = d.replace(/^00/, "") // 00370… → 370…
  if (d.startsWith("370")) d = d.slice(3)
  else if (d.length === 9 && d.startsWith("8")) d = d.slice(1) // local 8XXXXXXXX
  // A valid LT mobile is 8 digits (6XXXXXXX). If we can't get there, hand the
  // original back and let LP reject it with a clear message.
  return d.length === 8 ? `+370${d}` : raw
}

// ── auth ────────────────────────────────────────────────────────────────────
let cachedToken: { value: string; expiresAt: number } | null = null

async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value

  // LP expects the scope's separators as literal "+" characters — i.e. percent
  // encoded to %2B (matching the Postman collection: read%2Bwrite%2BAPI_CLIENT).
  // URLSearchParams encodes the "+" in the value below to exactly %2B.
  const params = new URLSearchParams({
    scope: "read+write+API_CLIENT",
    grant_type: "password",
    clientSystem: "PUBLIC",
    username: env("LP_USERNAME"),
    password: env("LP_PASSWORD"),
  })

  const res = await fetch(`${BASE}/oauth/token?${params}`, { method: "POST" })
  if (!res.ok) throw new Error(`LP auth failed (${res.status}): ${await res.text()}`)
  const json = await res.json()
  const ttl = (Number(json.expires_in) || 3600) * 1000
  cachedToken = { value: json.access_token, expiresAt: Date.now() + ttl }
  return cachedToken.value
}

async function lp(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  })
  if (res.status === 401) {
    // token rejected — force refresh once
    cachedToken = null
    const retryToken = await getToken()
    return fetch(`${BASE}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${retryToken}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
    })
  }
  return res
}

async function lpJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await lp(path, init)
  const text = await res.text()
  if (!res.ok) throw new Error(`LP ${init.method ?? "GET"} ${path} → ${res.status}: ${text}`)
  return text ? (JSON.parse(text) as T) : ({} as T)
}

// ── types ───────────────────────────────────────────────────────────────────
export interface LpTerminal {
  id: string
  name: string
  address?: string
  city?: string
  postalCode?: string
  countryCode?: string
  comment?: string
  boxSize?: string
  latitude?: number
  longitude?: number
}

export interface LpTrackingEvent {
  publicEventType?: string
  publicStateType?: string
  publicStateText?: string
  date?: string
  location?: string
}

export type DeliveryMethod = "terminal" | "courier"

export interface CreateLabelInput {
  method: DeliveryMethod
  terminalId?: string // required when method === "terminal"
  receiver: {
    name: string
    phone: string
    email?: string
    // courier / to-door address (required when method === "courier")
    locality?: string
    postalCode?: string
    street?: string
    building?: string
    flat?: string
    countryCode?: string
  }
  size?: "XS" | "S" | "M" | "L" | "XL"
  weight?: number // grams
}

export interface CreateLabelResult {
  parcelId: string
  barcode: string | null
}

// ── operations ──────────────────────────────────────────────────────────────

/** GET /api/v2/terminal — list of LP EXPRESS parcel lockers. `find` narrows by text, `size` caps results. */
export async function listTerminals(
  opts: { countryCode?: string; find?: string; size?: number } = {},
): Promise<LpTerminal[]> {
  const q = new URLSearchParams({ receiverCountryCode: opts.countryCode ?? "LT" })
  if (opts.find) q.set("find", opts.find)
  if (opts.size) q.set("size", String(opts.size))
  const data = await lpJson<LpTerminal[] | { items?: LpTerminal[] }>(`/api/v2/terminal?${q}`)
  return Array.isArray(data) ? data : (data.items ?? [])
}

/** BRICKTIME's own party block (from LP_SENDER_* env) — used as the sender on
 *  outbound labels and as the receiver on return labels. */
function bricktimeParty() {
  return {
    name: env("LP_SENDER_NAME"),
    address: {
      countryCode: Deno.env.get("LP_SENDER_COUNTRY") ?? "LT",
      locality: env("LP_SENDER_LOCALITY"),
      postalCode: env("LP_SENDER_POSTCODE"),
      street: env("LP_SENDER_STREET"),
      building: env("LP_SENDER_BUILDING"),
      flat: Deno.env.get("LP_SENDER_FLAT") ?? undefined,
    },
    contacts: {
      email: Deno.env.get("LP_SENDER_EMAIL") ?? undefined,
      phone: Deno.env.get("LP_SENDER_PHONE") ? ltPhone(Deno.env.get("LP_SENDER_PHONE")!) : undefined,
    },
  }
}

/**
 * Create a parcel then register it for shipping (synchronously) so a barcode
 * is assigned. Returns the parcel id + barcode. Fetch the label PDF separately.
 */
export async function createLabel(input: CreateLabelInput): Promise<CreateLabelResult> {
  const isTerminal = input.method === "terminal"

  const body = isTerminal
    ? {
        plan: { code: "TERMINAL" },
        parcel: { type: "T2T", size: input.size ?? "M" },
        services: [],
        receiver: {
          name: input.receiver.name,
          address: { countryCode: input.receiver.countryCode ?? "LT", terminalId: input.terminalId },
          contacts: { phone: ltPhone(input.receiver.phone), email: input.receiver.email },
        },
      }
    : {
        plan: { code: "HANDS" },
        parcel: { type: "H2H", weight: String(input.weight ?? 2000) },
        services: [],
        receiver: {
          name: input.receiver.name,
          address: {
            countryCode: input.receiver.countryCode ?? "LT",
            locality: input.receiver.locality,
            postalCode: input.receiver.postalCode,
            street: input.receiver.street,
            building: input.receiver.building,
            flat: input.receiver.flat,
          },
          contacts: { phone: ltPhone(input.receiver.phone), email: input.receiver.email },
        },
        sender: bricktimeParty(),
      }

  if (isTerminal && !input.terminalId) throw new Error("terminalId required for terminal delivery")

  const parcel = await lpJson<{ parcelId?: string; id?: string }>(`/api/v2/parcel`, {
    method: "POST",
    body: JSON.stringify(body),
  })
  const parcelId = String(parcel.parcelId ?? parcel.id ?? "")
  if (!parcelId) throw new Error("LP parcel creation returned no id")

  // Register the parcel (sync) so a barcode is assigned.
  await lpJson(`/api/v2/shipping/initiate?processAsync=false`, {
    method: "POST",
    body: JSON.stringify({ parcelIds: [Number(parcelId)] }),
  })

  const barcodes = await lpJson<Array<{ parcelId?: string | number; barcode?: string }>>(
    `/api/v2/shipping/barcode/list?parcelIds=${parcelId}`,
  ).catch(() => [])
  const barcode = barcodes?.[0]?.barcode ?? null

  return { parcelId, barcode }
}

export interface CreateReturnLabelInput {
  terminalId: string // the terminal the customer will drop the parcel at
  customer: { name: string; phone: string; email?: string }
  size?: "XS" | "S" | "M" | "L" | "XL"
}

/**
 * Create a prepaid RETURN label — customer's chosen paštomatas (sender) →
 * BRICKTIME's door (receiver, T2H). Registers it so a trackable barcode is
 * assigned. Mirror of createLabel with the parties reversed.
 */
export async function createReturnLabel(input: CreateReturnLabelInput): Promise<CreateLabelResult> {
  if (!input.terminalId) throw new Error("terminalId required for return label")

  const body = {
    plan: { code: "TERMINAL" },
    parcel: { type: "T2H", size: input.size ?? "S" },
    services: [],
    sender: {
      name: input.customer.name,
      address: { countryCode: "LT", terminalId: input.terminalId },
      contacts: { phone: ltPhone(input.customer.phone), email: input.customer.email },
    },
    receiver: bricktimeParty(),
  }

  const parcel = await lpJson<{ parcelId?: string; id?: string }>(`/api/v2/parcel`, {
    method: "POST",
    body: JSON.stringify(body),
  })
  const parcelId = String(parcel.parcelId ?? parcel.id ?? "")
  if (!parcelId) throw new Error("LP return parcel creation returned no id")

  await lpJson(`/api/v2/shipping/initiate?processAsync=false`, {
    method: "POST",
    body: JSON.stringify({ parcelIds: [Number(parcelId)] }),
  })

  const barcodes = await lpJson<Array<{ parcelId?: string | number; barcode?: string }>>(
    `/api/v2/shipping/barcode/list?parcelIds=${parcelId}`,
  ).catch(() => [])

  return { parcelId, barcode: barcodes?.[0]?.barcode ?? null }
}

/** GET /api/v2/sticker/pdf — the shipping label as a PDF (returns raw bytes). */
export async function getLabelPdf(
  parcelIds: string[],
  opts: { layout?: "LAYOUT_10x15" | "LAYOUT_A4" | "LAYOUT_MAX"; orientation?: "PORTRAIT" | "LANDSCAPE" } = {},
): Promise<Uint8Array> {
  const q = new URLSearchParams({
    parcelIds: parcelIds.join(","),
    layout: opts.layout ?? "LAYOUT_10x15",
    labelOrientation: opts.orientation ?? "PORTRAIT",
    includeCn23: "false",
    includeManifest: "false",
  })
  const res = await lp(`/api/v2/sticker/pdf?${q}`)
  if (!res.ok) throw new Error(`LP sticker/pdf → ${res.status}: ${await res.text()}`)
  return new Uint8Array(await res.arrayBuffer())
}

/** GET /api/v2/tracking/:barcode/events — public tracking events for a barcode. */
export async function getTracking(barcode: string, lang = "lt"): Promise<LpTrackingEvent[]> {
  const data = await lpJson<LpTrackingEvent[] | { events?: LpTrackingEvent[] }>(
    `/api/v2/tracking/${encodeURIComponent(barcode)}/events`,
    { headers: { "Accept-Language": lang } },
  )
  return Array.isArray(data) ? data : (data.events ?? [])
}

/** POST /api/v2/shipping/cancel — cancel a registered parcel. */
export async function cancelShipment(parcelIds: string[]): Promise<void> {
  await lpJson(`/api/v2/shipping/cancel`, {
    method: "POST",
    body: JSON.stringify({ parcelIds: parcelIds.map((id) => Number(id)) }),
  })
}
