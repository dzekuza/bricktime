// LP EXPRESS (UNISEND) integration endpoint.
//
// Body: { action, ...params }
//   action: "terminals"           → list parcel lockers               (public read)
//           "tracking"            → tracking events for a barcode     (public read)
//           "create-label"        → outbound shipment for an order    (auth: order owner)
//                                   {size, weight}; admin may pass orderIds[] to ship several sets in one parcel
//                                   admin may pass deliveryMethod:"courier" to send a locker order to a door
//                                   (receiver supplies street/building/flat/locality/postalCode)
//           "set-tracking"        → record a barcode created on the LP site (admin only)
//                                   {orderIds[], barcode}
//           "create-return-label" → prepaid return label + set status (auth: order owner)
//           "label-pdf"           → label PDF, {parcel:'outbound'|'return'} (auth: order owner)
//           "cancel"              → cancel a shipment for an order     (auth: order owner)
//           "reset-label"         → cancel + clear the outbound label so a new one can be made (admin only)
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
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })

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
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

/** Resolve the calling user from their JWT (Authorization header). */
async function getUser(req: Request) {
  const authHeader = req.headers.get("Authorization")
  if (!authHeader) return null
  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: { headers: { Authorization: authHeader } },
    }
  )
  const { data } = await client.auth.getUser()
  return data.user ?? null
}

/** Admin caller = the service-role key (cron/backends) OR a signed-in admin user
 *  (app_metadata.role='admin'), as the dashboard now invokes with the user's JWT.
 *  Grants access to any order for fulfillment. The gateway (verify_jwt) has already
 *  validated the signature, so trusting the decoded claims is safe. */
function isAdmin(req: Request): boolean {
  const bearer = req.headers
    .get("Authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim()
  if (!bearer) return false
  if (bearer === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) return true
  try {
    const claims = JSON.parse(atob(bearer.split(".")[1] ?? ""))
    return (
      claims.role === "service_role" || claims.app_metadata?.role === "admin"
    )
  } catch {
    return false
  }
}

const ORDER_COLUMNS =
  "id, subscriber_id, home_delivery, lp_terminal_id, lp_terminal_name, lp_parcel_id, lp_barcode, lp_return_parcel_id, lp_return_barcode, product_id, delivery_name, delivery_phone, delivery_street, delivery_house_no, delivery_flat, delivery_city, delivery_postal_code"

const BARCODE_PATTERN = /^[A-Za-z0-9]{8,30}$/

// Tracking states in which nothing has physically shipped yet.
const RESETTABLE_TRACKING_STATES = ["LABEL_CREATED", "LABEL_CANCELLED"]

const PARCEL_SIZES = ["XS", "S", "M", "L", "XL"] as const

/**
 * Locker slot for a return parcel. Each set returns in the slot it left in
 * (the admin's outbound size), else its product's size. Sets that shipped
 * together share one parcel; separate parcels returned together go up a step.
 */
function returnSize(
  sets: { parcelId: string | null; size: string }[]
): (typeof PARCEL_SIZES)[number] {
  const largest = Math.max(
    ...sets.map((s) => PARCEL_SIZES.indexOf(s.size as (typeof PARCEL_SIZES)[number])),
    0
  )
  const parcels = new Set(sets.map((s, i) => s.parcelId ?? `order-${i}`)).size
  const bump = parcels > 1 ? 1 : 0
  return PARCEL_SIZES[Math.min(largest + bump, PARCEL_SIZES.length - 1)]
}

/** Load an order and confirm the caller may act on it (owner or admin). */
async function requireOwnedOrder(req: Request, orderId: string) {
  const admin = isAdmin(req)
  const user = admin ? null : await getUser(req)
  if (!admin && !user)
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: corsHeaders,
    })
  const { data: order, error } = await service()
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("id", orderId)
    .single()
  if (error || !order)
    throw new Response(JSON.stringify({ error: "Order not found" }), {
      status: 404,
      headers: corsHeaders,
    })
  if (!admin && order.subscriber_id !== user!.id)
    throw new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: corsHeaders,
    })
  return { user, order, admin }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders })

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
        // One parcel can carry several sets (admin "ship together"): the first
        // order supplies the receiver, the rest must match it.
        const orderIds: string[] =
          Array.isArray(payload.orderIds) && payload.orderIds.length > 0
            ? [...new Set<string>(payload.orderIds)]
            : [payload.orderId]
        const { order, admin } = await requireOwnedOrder(req, orderIds[0])
        if (orderIds.length > 1) {
          if (!admin) return json({ error: "Forbidden" }, 403)
          const { data: siblings, error: siblingsError } = await service()
            .from("orders")
            .select(ORDER_COLUMNS)
            .in("id", orderIds)
          if (siblingsError || siblings?.length !== orderIds.length)
            return json({ error: "Some orders were not found" }, 404)
          const mismatch = siblings.some(
            (o) =>
              o.subscriber_id !== order.subscriber_id ||
              o.home_delivery !== order.home_delivery ||
              o.lp_terminal_id !== order.lp_terminal_id ||
              o.delivery_street !== order.delivery_street ||
              o.delivery_house_no !== order.delivery_house_no ||
              o.delivery_flat !== order.delivery_flat ||
              o.delivery_postal_code !== order.delivery_postal_code
          )
          if (mismatch)
            return json(
              {
                error:
                  "Orders must share the same customer and delivery destination",
              },
              400
            )
          if (siblings.some((o) => o.lp_barcode))
            return json({ error: "Some orders already have a label" }, 400)
        }
        if (order.lp_barcode)
          return json({
            parcelId: order.lp_parcel_id,
            barcode: order.lp_barcode,
          })

        if (payload.size !== undefined && !PARCEL_SIZES.includes(payload.size))
          return json(
            { error: `size must be one of ${PARCEL_SIZES.join(", ")}` },
            400
          )
        if (
          payload.weight !== undefined &&
          !(
            Number.isInteger(payload.weight) &&
            payload.weight > 0 &&
            payload.weight <= 30000
          )
        )
          return json(
            { error: "weight must be whole grams between 1 and 30000" },
            400
          )

        if (
          payload.deliveryMethod !== undefined &&
          payload.deliveryMethod !== "courier"
        )
          return json({ error: 'deliveryMethod must be "courier"' }, 400)
        // Only admins may reroute a locker order to the customer's door.
        const forceCourier = payload.deliveryMethod === "courier"
        if (forceCourier && !admin) return json({ error: "Forbidden" }, 403)

        const method =
          order.home_delivery || forceCourier ? "courier" : "terminal"
        if (method === "terminal" && !order.lp_terminal_id)
          return json({ error: "Order has no terminal selected" }, 400)

        // Receiver details come from the snapshot taken when the order was
        // placed; the request only fills in for older orders without one.
        const receiver = {
          ...payload.receiver,
          name: order.delivery_name || payload.receiver?.name,
          phone: order.delivery_phone || payload.receiver?.phone,
          ...(method === "courier" &&
            (forceCourier && !order.home_delivery
              ? // Locker order sent to a door: the admin-entered address wins
                // over any stale snapshot.
                {
                  street: payload.receiver?.street,
                  building: payload.receiver?.building,
                  flat: payload.receiver?.flat || undefined,
                  locality: payload.receiver?.locality,
                  postalCode: payload.receiver?.postalCode,
                }
              : {
                  street: order.delivery_street || payload.receiver?.street,
                  building:
                    order.delivery_house_no || payload.receiver?.building,
                  flat: order.delivery_flat ?? payload.receiver?.flat ?? undefined,
                  locality: order.delivery_city || payload.receiver?.locality,
                  postalCode:
                    order.delivery_postal_code || payload.receiver?.postalCode,
                })),
        }
        if (!receiver.name || !receiver.phone)
          return json({ error: "Receiver name and phone required" }, 400)
        if (
          method === "courier" &&
          (!receiver.street ||
            !receiver.building ||
            !receiver.locality ||
            !receiver.postalCode)
        )
          return json({ error: "Order has no delivery address" }, 400)

        const result = await createLabel({
          method,
          terminalId: order.lp_terminal_id ?? undefined,
          receiver,
          size: payload.size,
          weight: payload.weight,
          courierPickup: payload.courierPickup === true,
        })

        // Keep the order consistent with how it was actually shipped.
        const rerouted =
          forceCourier && !order.home_delivery
            ? {
                home_delivery: true,
                delivery_name: receiver.name,
                delivery_phone: receiver.phone,
                delivery_street: receiver.street,
                delivery_house_no: receiver.building,
                delivery_flat: receiver.flat ?? null,
                delivery_city: receiver.locality,
                delivery_postal_code: receiver.postalCode,
              }
            : {}

        await service()
          .from("orders")
          .update({
            ...rerouted,
            lp_parcel_id: result.parcelId,
            // Locker parcels only; the return label reuses this slot size.
            lp_parcel_size: method === "terminal" ? (payload.size ?? "M") : null,
            lp_barcode: result.barcode,
            lp_tracking_state: "LABEL_CREATED",
            lp_label_created_at: new Date().toISOString(),
          })
          .in("id", orderIds)

        return json(result)
      }

      case "set-tracking": {
        // The admin created the shipment on the LP Express site, so there is no
        // parcel id here — only the barcode, which tracking sync needs.
        if (!isAdmin(req)) return json({ error: "Forbidden" }, 403)
        const orderIds: string[] = Array.isArray(payload.orderIds)
          ? [...new Set<string>(payload.orderIds)]
          : []
        const barcode =
          typeof payload.barcode === "string" ? payload.barcode.trim() : ""
        if (orderIds.length === 0) return json({ error: "orderIds required" }, 400)
        if (!BARCODE_PATTERN.test(barcode))
          return json(
            { error: "Enter a valid LP Express barcode (letters and digits)" },
            400
          )
        const { data: rows, error: rowsError } = await service()
          .from("orders")
          .select("id, lp_barcode")
          .in("id", orderIds)
        if (rowsError || rows?.length !== orderIds.length)
          return json({ error: "Some orders were not found" }, 404)
        if (rows.some((o) => o.lp_barcode))
          return json({ error: "Some orders already have a label" }, 400)

        const { error: updateError } = await service()
          .from("orders")
          .update({
            lp_barcode: barcode,
            lp_tracking_state: "LABEL_CREATED",
            lp_label_created_at: new Date().toISOString(),
          })
          .in("id", orderIds)
        if (updateError) return json({ error: "Could not save the code" }, 500)
        return json({ barcode })
      }

      case "create-return-label": {
        // Several sets can go back in one parcel; every order must belong to
        // the same customer (ownership of the first is checked above).
        const orderIds: string[] =
          Array.isArray(payload.orderIds) && payload.orderIds.length > 0
            ? [...new Set<string>(payload.orderIds)]
            : [payload.orderId]
        const { order } = await requireOwnedOrder(req, orderIds[0])
        if (orderIds.length > 1) {
          const { data: siblings, error: siblingsError } = await service()
            .from("orders")
            .select("id, subscriber_id, status, lp_return_barcode")
            .in("id", orderIds)
          if (siblingsError || siblings?.length !== orderIds.length)
            return json({ error: "Some orders were not found" }, 404)
          if (siblings.some((o) => o.subscriber_id !== order.subscriber_id))
            return json({ error: "Orders belong to different customers" }, 400)
          if (
            siblings.some(
              (o) =>
                o.lp_return_barcode ||
                !["active", "overdue", "return_declined"].includes(o.status)
            )
          )
            return json({ error: "Some orders cannot be returned" }, 400)
        }
        if (order.lp_return_barcode)
          return json({
            parcelId: order.lp_return_parcel_id,
            barcode: order.lp_return_barcode,
          })
        if (!payload.terminalId)
          return json({ error: "terminalId required" }, 400)
        if (!payload.customer?.phone)
          return json({ error: "customer phone required" }, 400)
        if (payload.size !== undefined && !PARCEL_SIZES.includes(payload.size))
          return json(
            { error: `size must be one of ${PARCEL_SIZES.join(", ")}` },
            400
          )

        let size: (typeof PARCEL_SIZES)[number] | undefined = payload.size
        if (!size) {
          const { data: orderRows } = await service()
            .from("orders")
            .select("product_id, lp_parcel_id, lp_parcel_size")
            .in("id", orderIds)
          const productIds = (orderRows ?? []).map((o) => o.product_id)
          const { data: productRows } = await service()
            .from("products")
            .select("id, shipping_size")
            .in("id", productIds)
          size = returnSize(
            (orderRows ?? []).map((o) => ({
              parcelId: o.lp_parcel_id,
              size:
                o.lp_parcel_size ??
                productRows?.find((p) => p.id === o.product_id)?.shipping_size ??
                "S",
            }))
          )
        }

        const result = await createReturnLabel({
          terminalId: payload.terminalId,
          customer: payload.customer, // { name, phone, email }
          size,
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
          .in("id", orderIds)

        return json(result)
      }

      case "label-pdf": {
        const { order } = await requireOwnedOrder(req, payload.orderId)
        const isReturn = payload.parcel === "return"
        const parcelId = isReturn
          ? order.lp_return_parcel_id
          : order.lp_parcel_id
        if (!parcelId)
          return json({ error: "No label for this order yet" }, 400)
        const bytes = await getLabelPdf([parcelId], {
          layout: payload.layout,
          orientation: payload.orientation,
        })
        return json({ pdfBase64: toBase64(bytes) })
      }

      case "cancel": {
        const { order } = await requireOwnedOrder(req, payload.orderId)
        if (!order.lp_parcel_id)
          return json({ error: "No shipment to cancel" }, 400)
        await cancelShipment([order.lp_parcel_id])
        await service()
          .from("orders")
          .update({ lp_tracking_state: "LABEL_CANCELLED" })
          .eq("lp_parcel_id", order.lp_parcel_id)
        return json({ ok: true })
      }

      case "reset-label": {
        // Lets the admin start over after a mistake (wrong size, address, code):
        // the LP parcel is cancelled, then the order is back to "no label yet".
        if (!isAdmin(req)) return json({ error: "Forbidden" }, 403)
        const { order } = await requireOwnedOrder(req, payload.orderId)
        if (!order.lp_barcode)
          return json({ error: "This order has no label to reset" }, 400)

        const { data: state } = await service()
          .from("orders")
          .select("lp_tracking_state")
          .eq("id", order.id)
          .single()
        const trackingState = state?.lp_tracking_state ?? null
        // Once LP has the parcel moving, a new label would double-ship it.
        if (
          trackingState !== null &&
          !RESETTABLE_TRACKING_STATES.includes(trackingState)
        )
          return json(
            { error: "The parcel is already in transit and can't be reset" },
            409
          )

        // A code entered by hand has no LP parcel to cancel.
        if (order.lp_parcel_id && trackingState !== "LABEL_CANCELLED")
          await cancelShipment([order.lp_parcel_id])

        // Sets shipped together share one barcode; reset them as one.
        const { data: cleared, error: clearError } = await service()
          .from("orders")
          .update({
            lp_parcel_id: null,
            lp_parcel_size: null,
            lp_barcode: null,
            lp_tracking_state: null,
            lp_label_created_at: null,
          })
          .eq("lp_barcode", order.lp_barcode)
          .eq("subscriber_id", order.subscriber_id)
          .select("id")
        if (clearError) return json({ error: "Could not reset the label" }, 500)
        return json({ orderIds: (cleared ?? []).map((o) => o.id) })
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400)
    }
  } catch (err) {
    // Re-throw pre-built auth Responses; wrap everything else.
    if (err instanceof Response)
      return new Response(err.body, {
        status: err.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    return json({ error: (err as Error).message }, 400)
  }
})
