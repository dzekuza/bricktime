import { Type, type FunctionDeclaration } from "@google/genai"

import { supabase, type TablesUpdate } from "@/lib/supabase"
import { setTrackingCode } from "@/lib/lpexpress"

// The model only ever picks one of these tools and fills in its arguments.
// Every argument is validated here, reads run under the admin's own Supabase
// session (row-level security), and every write is held back until the admin
// confirms it on a card. There is no free-form SQL.

const ORDER_STATUSES = [
  "requested",
  "processing",
  "active",
  "overdue",
  "returned",
  "return_requested",
  "return_declined",
] as const
type OrderStatus = (typeof ORDER_STATUSES)[number]

// Only statuses the Orders page itself sets. "requested" belongs to the Mystery
// Box queue and "return_requested" needs its timestamp, so neither is a target.
const WRITABLE_ORDER_STATUSES = [
  "processing",
  "active",
  "overdue",
  "returned",
  "return_declined",
] as const satisfies readonly OrderStatus[]

const SUBSCRIBER_STATUSES = ["active", "paused", "cancelled"] as const

// Contact fields only; plan, billing and Stripe columns are never editable here.
const EDITABLE_SUBSCRIBER_FIELDS = [
  "name",
  "last_name",
  "phone",
  "street",
  "house_no",
  "flat",
  "postal_code",
  "city",
] as const
type EditableSubscriberField = (typeof EDITABLE_SUBSCRIBER_FIELDS)[number]
const REQUIRED_SUBSCRIBER_FIELDS: readonly EditableSubscriberField[] = ["name"]

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const BARCODE_PATTERN = /^[A-Za-z0-9]{8,30}$/
const MAX_ROWS = 25
const DEFAULT_ROWS = 10

export type WriteToolName =
  | "update_order_status"
  | "set_order_tracking"
  | "update_subscriber_field"
  | "cancel_subscription"

export const WRITE_TOOLS: readonly string[] = [
  "update_order_status",
  "set_order_tracking",
  "update_subscriber_field",
  "cancel_subscription",
] satisfies WriteToolName[]

export function isWriteTool(name: string): name is WriteToolName {
  return WRITE_TOOLS.includes(name)
}

const idParam = (what: string) => ({
  type: Type.STRING,
  description: `${what} (UUID taken from a search result)`,
})

export const TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "search_orders",
    description:
      "Find rental orders. Filter by status and/or a customer name or email. Newest first.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: { type: Type.STRING, enum: [...ORDER_STATUSES] },
        customer: {
          type: Type.STRING,
          description: "Part of the customer's name or email",
        },
        limit: {
          type: Type.INTEGER,
          description: `Max rows, up to ${MAX_ROWS}`,
        },
      },
    },
  },
  {
    name: "get_order",
    description: "Full details of one rental order, including shipping.",
    parameters: {
      type: Type.OBJECT,
      properties: { order_id: idParam("Order id") },
      required: ["order_id"],
    },
  },
  {
    name: "search_subscribers",
    description:
      "Find clients (subscribers) by name or email, optionally by status.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: "Part of name or email" },
        status: { type: Type.STRING, enum: [...SUBSCRIBER_STATUSES] },
        limit: {
          type: Type.INTEGER,
          description: `Max rows, up to ${MAX_ROWS}`,
        },
      },
    },
  },
  {
    name: "get_subscriber",
    description:
      "One client's profile, subscription state and their latest rental orders.",
    parameters: {
      type: Type.OBJECT,
      properties: { subscriber_id: idParam("Subscriber id") },
      required: ["subscriber_id"],
    },
  },
  {
    name: "update_order_status",
    description:
      "Change a rental order's status. The admin must confirm before it runs.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        order_id: idParam("Order id"),
        status: { type: Type.STRING, enum: [...WRITABLE_ORDER_STATUSES] },
        note: { type: Type.STRING, description: "Optional return note" },
      },
      required: ["order_id", "status"],
    },
  },
  {
    name: "set_order_tracking",
    description:
      "Store the LP Express shipping code of a parcel the admin already sent. The admin must confirm.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        order_id: idParam("Order id"),
        barcode: { type: Type.STRING, description: "LP Express shipping code" },
      },
      required: ["order_id", "barcode"],
    },
  },
  {
    name: "update_subscriber_field",
    description:
      "Edit one contact field of a client. The admin must confirm before it runs.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        subscriber_id: idParam("Subscriber id"),
        field: { type: Type.STRING, enum: [...EDITABLE_SUBSCRIBER_FIELDS] },
        value: { type: Type.STRING, description: "New value; empty clears it" },
      },
      required: ["subscriber_id", "field", "value"],
    },
  },
  {
    name: "cancel_subscription",
    description:
      "Cancel a client's subscription immediately in Stripe and in the database (no refund). Irreversible; the admin must confirm.",
    parameters: {
      type: Type.OBJECT,
      properties: { subscriber_id: idParam("Subscriber id") },
      required: ["subscriber_id"],
    },
  },
]

export const SYSTEM_INSTRUCTION = `You are the BRICKTIME admin assistant. BRICKTIME rents LEGO sets by subscription.
Help the admin with rental orders and clients (subscribers), and propose changes through the provided tools.
Reply in the language the admin uses (Lithuanian or English), briefly and concretely.
Rules:
- Never guess ids. Look records up with a search tool first, then use the id it returned.
- Tools that change data only create a request; the admin confirms it on screen. Never claim a change is done until the tool result says it was executed. If the admin declines, say so and move on.
- You cannot run SQL, touch billing amounts or plans, or do anything outside the listed tools. Say so if asked.
- Do not read personal details such as phone numbers or addresses aloud unless asked.`

// ---------------------------------------------------------------- arguments

type Args = Record<string, unknown>

function requireString(args: Args, key: string, maxLength = 200): string {
  const value = args[key]
  if (typeof value !== "string") throw new Error(`${key} is required`)
  const trimmed = value.trim()
  if (trimmed.length > maxLength) throw new Error(`${key} is too long`)
  return trimmed
}

function requireId(args: Args, key: string): string {
  const value = requireString(args, key, 40)
  if (!UUID_PATTERN.test(value))
    throw new Error(`${key} must be an id from a search result`)
  return value
}

function requireOneOf<T extends string>(
  args: Args,
  key: string,
  allowed: readonly T[]
): T {
  const value = requireString(args, key, 40)
  const match = allowed.find((option) => option === value)
  if (!match) throw new Error(`${key} must be one of: ${allowed.join(", ")}`)
  return match
}

function optionalOneOf<T extends string>(
  args: Args,
  key: string,
  allowed: readonly T[]
): T | undefined {
  return args[key] === undefined || args[key] === ""
    ? undefined
    : requireOneOf(args, key, allowed)
}

function readLimit(args: Args): number {
  const raw = args.limit
  const limit = typeof raw === "number" ? Math.floor(raw) : DEFAULT_ROWS
  return Math.min(Math.max(limit, 1), MAX_ROWS)
}

// Keeps a typed name out of the PostgREST filter syntax.
function toSearchTerm(raw: string): string {
  return raw.replace(/[,()%*\\_"']/g, " ").trim()
}

// ---------------------------------------------------------------- read tools

export async function runReadTool(name: string, args: Args): Promise<unknown> {
  switch (name) {
    case "search_orders":
      return searchOrders(args)
    case "get_order":
      return getOrder(requireId(args, "order_id"))
    case "search_subscribers":
      return searchSubscribers(args)
    case "get_subscriber":
      return getSubscriber(requireId(args, "subscriber_id"))
    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

async function searchOrders(args: Args) {
  const status = optionalOneOf(args, "status", ORDER_STATUSES)
  const customer = toSearchTerm(
    typeof args.customer === "string" ? args.customer : ""
  )

  let subscriberIds: string[] | null = null
  if (customer) {
    const { data, error } = await supabase
      .from("subscribers")
      .select("id")
      .or(`name.ilike.%${customer}%,email.ilike.%${customer}%`)
      .limit(500)
    if (error) throw new Error(error.message)
    subscriberIds = (data ?? []).map((row) => row.id)
    if (subscriberIds.length === 0) return { orders: [] }
  }

  let query = supabase
    .from("orders")
    .select(
      "id, subscriber_id, product_id, status, start_date, due_date, amount, home_delivery, lp_barcode, lp_tracking_state, return_note, is_mystery, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(readLimit(args))
  if (status) query = query.eq("status", status)
  if (subscriberIds) query = query.in("subscriber_id", subscriberIds)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return { orders: await withNames(data ?? []) }
}

async function getOrder(orderId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, subscriber_id, product_id, status, start_date, due_date, amount, home_delivery, lp_terminal_name, delivery_name, delivery_phone, delivery_street, delivery_house_no, delivery_flat, delivery_postal_code, delivery_city, lp_barcode, lp_tracking_state, lp_return_barcode, lp_return_tracking_state, return_note, return_requested_at, returned_at, is_mystery, created_at"
    )
    .eq("id", orderId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error("Order not found")
  const [order] = await withNames([data])
  return { order }
}

interface NamedOrderRow {
  subscriber_id: string
  product_id: number | null
}

// Orders only carry ids; the model and the admin both think in names.
async function withNames<T extends NamedOrderRow>(rows: T[]) {
  const subscriberIds = [...new Set(rows.map((row) => row.subscriber_id))]
  const productIds = [
    ...new Set(
      rows.flatMap((row) => (row.product_id === null ? [] : [row.product_id]))
    ),
  ]
  const [subscribers, products] = await Promise.all([
    subscriberIds.length
      ? supabase
          .from("subscribers")
          .select("id, name, last_name, email")
          .in("id", subscriberIds)
      : { data: [], error: null },
    productIds.length
      ? supabase.from("products").select("id, title").in("id", productIds)
      : { data: [], error: null },
  ])
  if (subscribers.error) throw new Error(subscribers.error.message)
  if (products.error) throw new Error(products.error.message)
  const subscriberById = new Map((subscribers.data ?? []).map((s) => [s.id, s]))
  const productById = new Map((products.data ?? []).map((p) => [p.id, p.title]))
  return rows.map((row) => {
    const subscriber = subscriberById.get(row.subscriber_id)
    return {
      ...row,
      customer: subscriber
        ? `${subscriber.name} ${subscriber.last_name ?? ""}`.trim()
        : null,
      customer_email: subscriber?.email ?? null,
      set_title:
        row.product_id === null
          ? "Mystery Box (no set yet)"
          : (productById.get(row.product_id) ?? `Product #${row.product_id}`),
    }
  })
}

const SUBSCRIBER_COLUMNS =
  "id, name, last_name, email, phone, plan, status, city, country, current_period_end, paused_until, cancel_requested, cancel_at, pending_plan, penalty_amount, penalty_reason, home_delivery, joined_at"

async function searchSubscribers(args: Args) {
  const status = optionalOneOf(args, "status", SUBSCRIBER_STATUSES)
  const term = toSearchTerm(typeof args.query === "string" ? args.query : "")

  let query = supabase
    .from("subscribers")
    .select(SUBSCRIBER_COLUMNS)
    .order("joined_at", { ascending: false })
    .limit(readLimit(args))
  if (status) query = query.eq("status", status)
  if (term) query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%`)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return { subscribers: data ?? [] }
}

async function getSubscriber(subscriberId: string) {
  const [profile, orders] = await Promise.all([
    supabase
      .from("subscribers")
      .select(SUBSCRIBER_COLUMNS)
      .eq("id", subscriberId)
      .maybeSingle(),
    supabase
      .from("orders")
      .select(
        "id, subscriber_id, product_id, status, start_date, due_date, amount, lp_barcode, lp_tracking_state, created_at"
      )
      .eq("subscriber_id", subscriberId)
      .order("created_at", { ascending: false })
      .limit(10),
  ])
  if (profile.error) throw new Error(profile.error.message)
  if (!profile.data) throw new Error("Subscriber not found")
  if (orders.error) throw new Error(orders.error.message)
  return {
    subscriber: profile.data,
    orders: await withNames(orders.data ?? []),
  }
}

// --------------------------------------------------------------- write tools

export interface ActionDetail {
  label: string
  before?: string
  after: string
}

/** What the admin sees on the confirmation card; nothing has run yet. */
export interface PendingAction {
  id: string
  tool: WriteToolName
  args: Args
  title: string
  target: string
  details: ActionDetail[]
  isDestructive: boolean
  summary: string
}

type ExecutablePlan =
  | {
      kind: "order_status"
      orderId: string
      status: OrderStatus
      // What the admin saw on the card; the write is refused if the row moved on.
      expectedStatus: OrderStatus
      note?: string
    }
  | { kind: "tracking"; orderId: string; barcode: string }
  | {
      kind: "subscriber_field"
      subscriberId: string
      field: EditableSubscriberField
      value: string | null
      expected: string | null
    }
  | { kind: "cancel"; subscriberId: string }

const STALE_MESSAGE =
  "The record changed or is no longer available since the request was made. Nothing was changed; ask again."

// The plan stays out of the card's props so a render can't alter what runs.
const plans = new Map<string, ExecutablePlan>()

export async function prepareWriteTool(
  name: WriteToolName,
  args: Args
): Promise<PendingAction> {
  switch (name) {
    case "update_order_status":
      return prepareOrderStatus(name, args)
    case "set_order_tracking":
      return prepareTracking(name, args)
    case "update_subscriber_field":
      return prepareSubscriberField(name, args)
    case "cancel_subscription":
      return prepareCancel(name, args)
  }
}

async function loadOrder(orderId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("id, subscriber_id, product_id, status, lp_barcode, return_note")
    .eq("id", orderId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error("Order not found")
  const [named] = await withNames([data])
  return { order: data, named }
}

function describeOrder(named: { customer: string | null; set_title: string }) {
  return `${named.set_title} — ${named.customer ?? "unknown customer"}`
}

async function prepareOrderStatus(
  tool: WriteToolName,
  args: Args
): Promise<PendingAction> {
  const orderId = requireId(args, "order_id")
  const status = requireOneOf(args, "status", WRITABLE_ORDER_STATUSES)
  const note =
    typeof args.note === "string" && args.note.trim()
      ? args.note.trim().slice(0, 500)
      : undefined
  const { order, named } = await loadOrder(orderId)
  // Same rule as the Orders page: a Mystery Box request only moves on once a set is assigned.
  if (order.status === "requested") {
    throw new Error(
      "A Mystery Box request has no set yet; assign a set on the Orders page first"
    )
  }
  if (order.status === status) throw new Error(`The order is already ${status}`)

  const details: ActionDetail[] = [
    { label: "Status", before: order.status, after: status },
  ]
  if (note)
    details.push({
      label: "Return note",
      before: order.return_note ?? "—",
      after: note,
    })
  const target = describeOrder(named)
  return register(
    tool,
    args,
    { kind: "order_status", orderId, status, expectedStatus: order.status, note },
    {
      title: "Change order status",
      target,
      details,
      isDestructive: false,
      summary: `Order ${orderId} (${target}): status ${order.status} → ${status}`,
    }
  )
}

async function prepareTracking(
  tool: WriteToolName,
  args: Args
): Promise<PendingAction> {
  const orderId = requireId(args, "order_id")
  const barcode = requireString(args, "barcode", 30)
  if (!BARCODE_PATTERN.test(barcode)) {
    throw new Error("The shipping code must be 8–30 letters or digits")
  }
  const { order, named } = await loadOrder(orderId)
  // set-tracking refuses an order that already has a code, so don't offer it.
  if (order.lp_barcode) {
    throw new Error(`This order already has a shipping code (${order.lp_barcode})`)
  }
  const target = describeOrder(named)
  return register(
    tool,
    args,
    { kind: "tracking", orderId, barcode },
    {
      title: "Save shipping code",
      target,
      details: [
        {
          label: "LP Express code",
          before: order.lp_barcode ?? "—",
          after: barcode,
        },
      ],
      isDestructive: false,
      summary: `Order ${orderId} (${target}): shipping code ${order.lp_barcode ?? "none"} → ${barcode}`,
    }
  )
}

async function prepareSubscriberField(
  tool: WriteToolName,
  args: Args
): Promise<PendingAction> {
  const subscriberId = requireId(args, "subscriber_id")
  const field = requireOneOf(args, "field", EDITABLE_SUBSCRIBER_FIELDS)
  const value = requireString(args, "value", 200)
  if (!value && REQUIRED_SUBSCRIBER_FIELDS.includes(field)) {
    throw new Error(`${field} can't be empty`)
  }
  const { data, error } = await supabase
    .from("subscribers")
    .select(
      "id, name, last_name, email, " + EDITABLE_SUBSCRIBER_FIELDS.join(", ")
    )
    .eq("id", subscriberId)
    .maybeSingle<Record<string, string | null>>()
  if (error) throw new Error(error.message)
  if (!data) throw new Error("Subscriber not found")

  const target =
    `${data.name ?? ""} ${data.last_name ?? ""}`.trim() + ` (${data.email})`
  return register(
    tool,
    args,
    {
      kind: "subscriber_field",
      subscriberId,
      field,
      value: value || null,
      expected: data[field] ?? null,
    },
    {
      title: "Edit client",
      target,
      details: [
        { label: field, before: data[field] ?? "—", after: value || "—" },
      ],
      isDestructive: false,
      summary: `Subscriber ${subscriberId} (${target}): ${field} "${data[field] ?? ""}" → "${value}"`,
    }
  )
}

async function prepareCancel(
  tool: WriteToolName,
  args: Args
): Promise<PendingAction> {
  const subscriberId = requireId(args, "subscriber_id")
  const { data, error } = await supabase
    .from("subscribers")
    .select("id, name, last_name, email, plan, status")
    .eq("id", subscriberId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error("Subscriber not found")
  if (data.status === "cancelled")
    throw new Error("This subscription is already cancelled")

  const target =
    `${data.name} ${data.last_name ?? ""}`.trim() + ` (${data.email})`
  return register(
    tool,
    args,
    { kind: "cancel", subscriberId },
    {
      title: "Cancel subscription",
      target,
      details: [
        { label: "Status", before: data.status, after: "cancelled" },
        {
          label: "Plan",
          before: data.plan,
          after: "ends now in Stripe, no refund",
        },
      ],
      isDestructive: true,
      summary: `Subscriber ${subscriberId} (${target}): subscription cancelled (plan ${data.plan})`,
    }
  )
}

function register(
  tool: WriteToolName,
  args: Args,
  plan: ExecutablePlan,
  card: Omit<PendingAction, "id" | "tool" | "args">
): PendingAction {
  const id = crypto.randomUUID()
  plans.set(id, plan)
  return { id, tool, args, ...card }
}

/** Forget a request the admin declined or that already ran. */
export function discardAction(actionId: string) {
  plans.delete(actionId)
}

/** Runs a confirmed request exactly once. */
export async function executeWriteTool(
  action: PendingAction
): Promise<unknown> {
  const plan = plans.get(action.id)
  if (!plan) throw new Error("This request already ran or was discarded")
  plans.delete(action.id)

  switch (plan.kind) {
    case "order_status": {
      // The card can sit open for a while; only write if the row is still as shown.
      const { data, error } = await supabase
        .from("orders")
        .update({
          status: plan.status,
          updated_at: new Date().toISOString(),
          ...(plan.note !== undefined ? { return_note: plan.note } : {}),
        })
        .eq("id", plan.orderId)
        .eq("status", plan.expectedStatus)
        .select("id")
      if (error) throw new Error(error.message)
      if (!data?.length) throw new Error(STALE_MESSAGE)
      return { executed: true, order_id: plan.orderId, status: plan.status }
    }
    case "tracking": {
      const { data: current, error: readError } = await supabase
        .from("orders")
        .select("lp_barcode")
        .eq("id", plan.orderId)
        .maybeSingle()
      if (readError) throw new Error(readError.message)
      if (!current) throw new Error(STALE_MESSAGE)
      if (current.lp_barcode) throw new Error(STALE_MESSAGE)
      const barcode = await setTrackingCode([plan.orderId], plan.barcode)
      return { executed: true, order_id: plan.orderId, barcode }
    }
    case "subscriber_field": {
      // The field name is checked against the whitelist in prepareSubscriberField;
      // TS can't narrow a computed key to a typed column patch.
      const patch = { [plan.field]: plan.value } as Pick<
        TablesUpdate<"subscribers">,
        EditableSubscriberField
      >
      const base = supabase
        .from("subscribers")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", plan.subscriberId)
      const { data, error } = await (plan.expected === null
        ? base.is(plan.field, null)
        : base.eq(plan.field, plan.expected)
      ).select("id")
      if (error) throw new Error(error.message)
      if (!data?.length) throw new Error(STALE_MESSAGE)
      return {
        executed: true,
        subscriber_id: plan.subscriberId,
        field: plan.field,
      }
    }
    case "cancel": {
      const { data, error } = await supabase.functions.invoke<{
        error?: string
        errors?: { message: string }[]
      }>("admin-cancel-subscription", { body: { ids: [plan.subscriberId] } })
      if (error) {
        // The generic "non-2xx" message hides the function's own error body.
        const res = (error as { context?: Response }).context
        const detail: unknown = await res?.json?.().catch(() => null)
        throw new Error(
          detail && typeof detail === "object" && "error" in detail
            ? String(detail.error)
            : error.message
        )
      }
      if (data?.error) throw new Error(data.error)
      if (data?.errors?.length)
        throw new Error(data.errors.map((e) => e.message).join(", "))
      return {
        executed: true,
        subscriber_id: plan.subscriberId,
        status: "cancelled",
      }
    }
  }
}

/** Audit row for a confirmed change, written under the admin's own session. */
export async function logAction(
  action: PendingAction,
  adminEmail: string | undefined,
  outcome: { status: "executed" } | { status: "failed"; error: string }
): Promise<string | null> {
  const { error } = await supabase.from("admin_assistant_actions").insert({
    admin_email: adminEmail ?? null,
    tool: action.tool,
    args: JSON.parse(JSON.stringify(action.args)),
    summary: action.summary,
    status: outcome.status,
    error: outcome.status === "failed" ? outcome.error : null,
  })
  if (error) {
    console.error("Could not write the assistant audit log:", error.message)
    return error.message
  }
  return null
}
