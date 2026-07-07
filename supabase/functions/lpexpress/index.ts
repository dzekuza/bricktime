// LP EXPRESS (UNISEND) integration endpoint.
//
// Body: { action, ...params }
//   action: "terminals"           → list parcel lockers               (public read)
//           "tracking"            → tracking events for a barcode     (public read)
//           "create-label"        → outbound shipment for an order    (auth: order owner)
//           "create-return-label" → prepaid return label + set status (auth: order owner)
//           "label-pdf"           → label PDF, {parcel:'outbound'|'return'} (auth: order owner)
//           "cancel"              → cancel a shipment for an order     (auth: order owner)
//
// Secrets required — see supabase/functions/_shared/lpexpress.ts header.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import {
  listTerminals,
  createLabel,
  createReturnLabel,
  getLabelPdf,
  getTracking,
  cancelShipment,
} from "../_shared/lpexpress.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } })

/** Base64-encode bytes in chunks (spreading a large Uint8Array into fromCharCode overflows the stack). */
function toBase64(bytes: Uint8Array): string {
  let binary = ""
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

const service = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)

/** Resolve the calling user from their JWT (Authorization header). */
async function getUser(req: Request) {
  const authHeader = req.headers.get("Authorization")
  if (!authHeader) return null
  const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data } = await client.auth.getUser()
  return data.user ?? null
}

/** Admin caller = the service-role key (cron/backends) OR a signed-in admin user
 *  (app_metadata.role='admin'), as the dashboard now invokes with the user's JWT.
 *  Grants access to any order for fulfillment. The gateway (verify_jwt) has already
 *  validated the signature, so trusting the decoded claims is safe. */
function isAdmin(req: Request): boolean {
  const bearer = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "").trim()
  if (!bearer) return false
  if (bearer === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) return true
  try {
    const claims = JSON.parse(atob(bearer.split(".")[1] ?? ""))
    return claims.role === "service_role" || claims.app_metadata?.role === "admin"
  } catch {
    return false
  }
}

/** Load an order and confirm the caller may act on it (owner or admin). */
async function requireOwnedOrder(req: Request, orderId: string) {
  const admin = isAdmin(req)
  const user = admin ? null : await getUser(req)
  if (!admin && !user) throw new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders })
  const { data: order, error } = await service()
    .from("orders")
    .select("id, subscriber_id, home_delivery, lp_terminal_id, lp_terminal_name, lp_parcel_id, lp_barcode, lp_return_parcel_id, lp_return_barcode, product_id")
    .eq("id", orderId)
    .single()
  if (error || !order) throw new Response(JSON.stringify({ error: "Order not found" }), { status: 404, headers: corsHeaders })
  if (!admin && order.subscriber_id !== user!.id)
    throw new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders })
  return { user, order, admin }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const payload = await req.json()
    const action = payload.action as string

    switch (action) {
      // ── public reads ──────────────────────────────────────────────────────
      case "terminals": {
        const terminals = await listTerminals({
          countryCode: payload.countryCode,
          find: payload.find,
          size: payload.size ?? 1000,
        })
        return json({ terminals })
      }

      case "tracking": {
        if (!payload.barcode) return json({ error: "barcode required" }, 400)
        const events = await getTracking(payload.barcode, payload.lang ?? "lt")
        return json({ events })
      }

      // ── owner-gated writes ────────────────────────────────────────────────
      case "create-label": {
        const { order } = await requireOwnedOrder(req, payload.orderId)
        if (order.lp_barcode) return json({ parcelId: order.lp_parcel_id, barcode: order.lp_barcode })

        const method = order.home_delivery ? "courier" : "terminal"
        if (method === "terminal" && !order.lp_terminal_id)
          return json({ error: "Order has no terminal selected" }, 400)

        const result = await createLabel({
          method,
          terminalId: order.lp_terminal_id ?? undefined,
          receiver: payload.receiver, // { name, phone, email, + address for courier }
          size: payload.size,
          weight: payload.weight,
        })

        await service()
          .from("orders")
          .update({
            lp_parcel_id: result.parcelId,
            lp_barcode: result.barcode,
            lp_tracking_state: "LABEL_CREATED",
            lp_label_created_at: new Date().toISOString(),
          })
          .eq("id", order.id)

        return json(result)
      }

      case "create-return-label": {
        const { order } = await requireOwnedOrder(req, payload.orderId)
        if (order.lp_return_barcode)
          return json({ parcelId: order.lp_return_parcel_id, barcode: order.lp_return_barcode })
        if (!payload.terminalId) return json({ error: "terminalId required" }, 400)
        if (!payload.customer?.phone) return json({ error: "customer phone required" }, 400)

        const result = await createReturnLabel({
          terminalId: payload.terminalId,
          customer: payload.customer, // { name, phone, email }
          size: payload.size,
        })

        await service()
          .from("orders")
          .update({
            status: "return_requested",
            return_requested_at: new Date().toISOString(),
            lp_return_terminal_id: payload.terminalId,
            lp_return_parcel_id: result.parcelId,
            lp_return_barcode: result.barcode,
            lp_return_tracking_state: "LABEL_CREATED",
            lp_return_label_created_at: new Date().toISOString(),
          })
          .eq("id", order.id)

        return json(result)
      }

      case "label-pdf": {
        const { order } = await requireOwnedOrder(req, payload.orderId)
        const isReturn = payload.parcel === "return"
        const parcelId = isReturn ? order.lp_return_parcel_id : order.lp_parcel_id
        if (!parcelId) return json({ error: "No label for this order yet" }, 400)
        const bytes = await getLabelPdf([parcelId], { layout: payload.layout, orientation: payload.orientation })
        return json({ pdfBase64: toBase64(bytes) })
      }

      case "cancel": {
        const { order } = await requireOwnedOrder(req, payload.orderId)
        if (!order.lp_parcel_id) return json({ error: "No shipment to cancel" }, 400)
        await cancelShipment([order.lp_parcel_id])
        await service()
          .from("orders")
          .update({ lp_tracking_state: "LABEL_CANCELLED" })
          .eq("id", order.id)
        return json({ ok: true })
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400)
    }
  } catch (err) {
    // Re-throw pre-built auth Responses; wrap everything else.
    if (err instanceof Response) return new Response(err.body, { status: err.status, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    return json({ error: (err as Error).message }, 400)
  }
})
