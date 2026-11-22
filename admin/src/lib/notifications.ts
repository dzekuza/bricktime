import { planLabels, type Plan } from "@/data/subscribers"
import { supabase } from "@/lib/supabase"

export type NotificationKind =
  | "new_member"
  | "subscription_cancelled"
  | "rental"
  | "mystery_request"
  | "return_requested"
  | "merch_order"
  | "gift_card"
  | "review"
  | "missing_part"

export interface AdminNotification {
  /** `${kind}:${rowId}`, stable across refreshes. */
  id: string
  kind: NotificationKind
  title: string
  detail: string
  createdAt: string
  href: string
}

const PER_SOURCE_LIMIT = 15
const FEED_LIMIT = 30

interface Person {
  id: string
  name: string
}

function planLabel(plan: string) {
  return planLabels[plan as Plan] ?? plan
}

function formatEuro(cents: number) {
  return `€${(cents / 100).toFixed(2)}`
}

async function fetchRecentRows() {
  const [
    newMembers,
    cancelled,
    orders,
    returns,
    merch,
    giftCards,
    reviews,
    missingParts,
  ] = await Promise.all([
    supabase
      .from("subscribers")
      .select("id, name, plan, joined_at")
      .order("joined_at", { ascending: false })
      .limit(PER_SOURCE_LIMIT),
    supabase
      .from("subscribers")
      .select("id, name, plan, updated_at")
      .eq("status", "cancelled")
      .order("updated_at", { ascending: false })
      .limit(PER_SOURCE_LIMIT),
    supabase
      .from("orders")
      .select("id, subscriber_id, product_id, cart_id, created_at")
      .order("created_at", { ascending: false })
      .limit(PER_SOURCE_LIMIT * 2),
    supabase
      .from("orders")
      .select("id, subscriber_id, product_id, return_requested_at")
      .eq("status", "return_requested")
      .not("return_requested_at", "is", null)
      .order("return_requested_at", { ascending: false })
      .limit(PER_SOURCE_LIMIT),
    supabase
      .from("merch_orders")
      .select("id, order_number, buyer_name, item_name, created_at")
      .order("created_at", { ascending: false })
      .limit(PER_SOURCE_LIMIT),
    supabase
      .from("gift_cards")
      .select("id, amount_cents, buyer_email, created_at")
      .neq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(PER_SOURCE_LIMIT),
    supabase
      .from("product_reviews")
      .select("id, subscriber_id, product_id, rating, approved, created_at")
      .order("created_at", { ascending: false })
      .limit(PER_SOURCE_LIMIT),
    supabase
      .from("missing_part_requests")
      .select("id, subscriber_id, lego_set_code, part_code, created_at")
      .order("created_at", { ascending: false })
      .limit(PER_SOURCE_LIMIT),
  ])

  const results = [
    newMembers,
    cancelled,
    orders,
    returns,
    merch,
    giftCards,
    reviews,
    missingParts,
  ]
  const failed = results.filter((r) => r.error)
  // One broken source shouldn't blank the whole feed; only fail when all do.
  if (failed.length === results.length) throw failed[0].error

  return {
    newMembers: newMembers.data ?? [],
    cancelled: cancelled.data ?? [],
    orders: orders.data ?? [],
    returns: returns.data ?? [],
    merch: merch.data ?? [],
    giftCards: giftCards.data ?? [],
    reviews: reviews.data ?? [],
    missingParts: missingParts.data ?? [],
  }
}

async function fetchLookups(subscriberIds: string[], productIds: number[]) {
  const [subs, products] = await Promise.all([
    subscriberIds.length
      ? supabase.from("subscribers").select("id, name").in("id", subscriberIds)
      : Promise.resolve({ data: [] as Person[] }),
    productIds.length
      ? supabase.from("products").select("id, title").in("id", productIds)
      : Promise.resolve({ data: [] as { id: number; title: string }[] }),
  ])
  return {
    subscriberName: Object.fromEntries(
      (subs.data ?? []).map((s) => [s.id, s.name])
    ) as Record<string, string>,
    productTitle: Object.fromEntries(
      (products.data ?? []).map((p) => [p.id, p.title])
    ) as Record<number, string>,
  }
}

/** Latest events across the admin, newest first. */
export async function fetchNotifications(): Promise<AdminNotification[]> {
  const rows = await fetchRecentRows()

  const subscriberIds = [
    ...new Set(
      [...rows.orders, ...rows.returns, ...rows.reviews, ...rows.missingParts]
        .map((r) => r.subscriber_id)
        .filter(Boolean)
    ),
  ]
  const productIds = [
    ...new Set(
      [...rows.orders, ...rows.returns, ...rows.reviews]
        .map((r) => r.product_id)
        .filter((id): id is number => id !== null)
    ),
  ]
  const { subscriberName, productTitle } = await fetchLookups(
    subscriberIds,
    productIds
  )
  const who = (id: string) => subscriberName[id] ?? "A member"
  const what = (id: number | null) =>
    id === null ? "Mystery Box" : (productTitle[id] ?? `Product #${id}`)

  const items: AdminNotification[] = []

  for (const s of rows.newMembers) {
    items.push({
      id: `new_member:${s.id}`,
      kind: "new_member",
      title: "New member",
      detail: `${s.name} · ${planLabel(s.plan)}`,
      createdAt: s.joined_at,
      href: "/subscribers",
    })
  }
  for (const s of rows.cancelled) {
    items.push({
      id: `subscription_cancelled:${s.id}`,
      kind: "subscription_cancelled",
      title: "Subscription cancelled",
      detail: `${s.name} · ${planLabel(s.plan)}`,
      createdAt: s.updated_at,
      href: "/subscribers",
    })
  }

  // One cart can create several order rows; show it once.
  const carts = new Map<string, typeof rows.orders>()
  for (const o of rows.orders) {
    const key = o.cart_id ?? o.id
    carts.set(key, [...(carts.get(key) ?? []), o])
  }
  for (const [key, group] of [...carts].slice(0, PER_SOURCE_LIMIT)) {
    const first = group[group.length - 1]
    const latest = group[0]
    const isMystery = group.every((o) => o.product_id === null)
    const extra = group.length > 1 ? ` +${group.length - 1} more` : ""
    items.push({
      id: `rental:${key}`,
      kind: isMystery ? "mystery_request" : "rental",
      title: isMystery ? "Mystery Box request" : "Set rental",
      detail: `${who(first.subscriber_id)} · ${what(first.product_id)}${extra}`,
      createdAt: latest.created_at,
      href: "/orders",
    })
  }

  for (const o of rows.returns) {
    items.push({
      id: `return_requested:${o.id}`,
      kind: "return_requested",
      title: "Return requested",
      detail: `${who(o.subscriber_id)} · ${what(o.product_id)}`,
      createdAt: o.return_requested_at as string,
      href: "/orders",
    })
  }
  for (const m of rows.merch) {
    items.push({
      id: `merch_order:${m.id}`,
      kind: "merch_order",
      title: `Merch order #${m.order_number}`,
      detail: `${m.buyer_name ?? "A customer"} · ${m.item_name}`,
      createdAt: m.created_at,
      href: "/orders",
    })
  }
  for (const g of rows.giftCards) {
    items.push({
      id: `gift_card:${g.id}`,
      kind: "gift_card",
      title: "Gift card bought",
      detail: `${g.buyer_email} · ${formatEuro(g.amount_cents)}`,
      createdAt: g.created_at,
      href: "/gift-cards",
    })
  }
  for (const r of rows.reviews) {
    items.push({
      id: `review:${r.id}`,
      kind: "review",
      title: r.approved ? "New review" : "New review, awaiting approval",
      detail: `${who(r.subscriber_id)} · ${what(r.product_id)} · ${r.rating}/5`,
      createdAt: r.created_at,
      href: "/reviews",
    })
  }
  for (const p of rows.missingParts) {
    items.push({
      id: `missing_part:${p.id}`,
      kind: "missing_part",
      title: "Missing part form",
      detail: `${who(p.subscriber_id)} · set ${p.lego_set_code}, part ${p.part_code}`,
      createdAt: p.created_at,
      href: "/missing-parts",
    })
  }

  return items
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, FEED_LIMIT)
}
