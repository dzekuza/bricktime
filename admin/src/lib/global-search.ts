import { supabase } from "@/lib/supabase"

export type SearchKind =
  | "order"
  | "merchOrder"
  | "subscriber"
  | "product"
  | "merchItem"

export type SearchHit = {
  id: string
  kind: SearchKind
  title: string
  subtitle: string
  /** Page to open, already carrying the `?q=` / `?mq=` filter. */
  to: string
}

export const MIN_QUERY_LENGTH = 2
const LIMIT = 5
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Strip characters that would break PostgREST's `or()` filter syntax. */
function sanitize(term: string) {
  return term.replace(/[,()%*\\]/g, " ").trim()
}

function join(parts: Array<string | number | null | undefined>) {
  return parts.filter((p) => p !== null && p !== undefined && p !== "").join(" · ")
}

function withParam(path: string, param: string, value: string) {
  return `${path}?${param}=${encodeURIComponent(value)}`
}

async function searchOrders(term: string): Promise<SearchHit[]> {
  const filters = [
    `delivery_name.ilike.%${term}%`,
    `lp_barcode.ilike.%${term}%`,
    `lp_return_barcode.ilike.%${term}%`,
  ]
  if (UUID_RE.test(term)) filters.push(`id.eq.${term}`)
  const { data } = await supabase
    .from("orders")
    .select("id, delivery_name, status, lp_barcode")
    .or(filters.join(","))
    .order("created_at", { ascending: false })
    .limit(LIMIT)
  return (data ?? []).map((o) => ({
    id: o.id,
    kind: "order",
    title: o.delivery_name ?? `Nuoma ${o.id.slice(0, 8)}`,
    subtitle: join([o.status, o.lp_barcode, o.id.slice(0, 8)]),
    to: withParam("/orders", "q", o.id),
  }))
}

async function searchMerchOrders(term: string): Promise<SearchHit[]> {
  const filters = [
    `buyer_name.ilike.%${term}%`,
    `buyer_email.ilike.%${term}%`,
    `tracking_number.ilike.%${term}%`,
    `item_name.ilike.%${term}%`,
  ]
  const digits = term.replace(/^#/, "")
  if (/^\d{1,9}$/.test(digits)) filters.push(`order_number.eq.${digits}`)
  const { data } = await supabase
    .from("merch_orders")
    .select("id, order_number, item_name, buyer_name, buyer_email, status")
    .or(filters.join(","))
    .order("created_at", { ascending: false })
    .limit(LIMIT)
  return (data ?? []).map((o) => ({
    id: o.id,
    kind: "merchOrder",
    title: `#${o.order_number} · ${o.item_name}`,
    subtitle: join([o.buyer_name, o.buyer_email, o.status]),
    to: withParam("/orders", "mq", String(o.order_number)),
  }))
}

async function searchSubscribers(term: string): Promise<SearchHit[]> {
  const { data } = await supabase
    .from("subscribers")
    .select("id, name, last_name, email, phone, plan")
    .or(
      [
        `name.ilike.%${term}%`,
        `last_name.ilike.%${term}%`,
        `email.ilike.%${term}%`,
        `phone.ilike.%${term}%`,
      ].join(",")
    )
    .order("joined_at", { ascending: false })
    .limit(LIMIT)
  return (data ?? []).map((s) => ({
    id: s.id,
    kind: "subscriber",
    title: s.name,
    subtitle: join([s.email, s.phone, s.plan]),
    to: withParam("/subscribers", "q", s.email),
  }))
}

async function searchProducts(term: string): Promise<SearchHit[]> {
  const { data } = await supabase
    .from("products")
    .select("id, title, category, tier, status")
    .or(`title.ilike.%${term}%,category.ilike.%${term}%`)
    .limit(LIMIT)
  return (data ?? []).map((p) => ({
    id: String(p.id),
    kind: "product",
    title: p.title,
    subtitle: join([p.category, p.tier, p.status]),
    to: withParam("/products", "q", p.title),
  }))
}

async function searchMerchItems(term: string): Promise<SearchHit[]> {
  const { data } = await supabase
    .from("merch_items")
    .select("id, name, slug, status")
    .or(`name.ilike.%${term}%,slug.ilike.%${term}%`)
    .limit(LIMIT)
  return (data ?? []).map((m) => ({
    id: m.id,
    kind: "merchItem",
    title: m.name,
    subtitle: join([m.slug, m.status]),
    to: withParam("/merch", "q", m.name),
  }))
}

/**
 * Runs every entity search in parallel with the signed-in admin's client, so
 * row-level security applies. A failing source yields no hits rather than
 * hiding the others.
 */
export async function searchEverything(raw: string): Promise<SearchHit[]> {
  const term = sanitize(raw)
  if (term.length < MIN_QUERY_LENGTH) return []
  const settled = await Promise.allSettled([
    searchOrders(term),
    searchMerchOrders(term),
    searchSubscribers(term),
    searchProducts(term),
    searchMerchItems(term),
  ])
  return settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []))
}
