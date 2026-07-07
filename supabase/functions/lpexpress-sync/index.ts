// LP EXPRESS (UNISEND) delivery sync.
//
// Polls tracking for every order awaiting delivery (status = 'processing' with an
// outbound barcode), persists the latest public tracking state, and flips the order
// to 'active' once LP EXPRESS reports the parcel as delivered — replacing the manual
// "Mark as active" step in the admin dashboard.
//
// Service-role only: invoked by pg_cron (see the migration) and by the admin Orders
// page. Body is ignored; returns a per-order summary.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { getTracking, type LpTrackingEvent } from "../_shared/lpexpress.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } })

const service = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)

/** Public tracking state that means the parcel reached the customer. */
const DELIVERED_STATE = "PARCEL_DELIVERED"

/** Authorized caller = the service-role key (pg_cron) OR a signed-in admin user
 *  (app_metadata.role='admin', the dashboard "Sync tracking" button). The gateway
 *  (verify_jwt) has already validated the JWT signature. */
function isAuthorized(req: Request): boolean {
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

function eventDate(e: LpTrackingEvent): number {
  return e.date ? Date.parse(e.date) || 0 : 0
}

/** Latest state by event date; falls back to the current stored state when the
 *  barcode has no events yet. */
function latestState(events: LpTrackingEvent[], fallback: string | null): string | null {
  if (events.length === 0) return fallback
  return [...events].sort((a, b) => eventDate(b) - eventDate(a))[0].publicStateType ?? fallback
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (!isAuthorized(req)) return json({ error: "Unauthorized" }, 401)

  const db = service()
  const { data: orders, error } = await db
    .from("orders")
    .select("id, lp_barcode, lp_tracking_state")
    .eq("status", "processing")
    .not("lp_barcode", "is", null)

  if (error) return json({ error: error.message }, 500)

  const results: Array<{ id: string; state: string | null; activated: boolean; error?: string }> = []

  for (const order of orders ?? []) {
    try {
      const events = await getTracking(order.lp_barcode!)
      const delivered = events.some((e) => e.publicStateType === DELIVERED_STATE)
      const nextState = delivered ? DELIVERED_STATE : latestState(events, order.lp_tracking_state)

      const patch: Record<string, unknown> = {}
      if (nextState !== order.lp_tracking_state) patch.lp_tracking_state = nextState
      if (delivered) {
        patch.status = "active"
        patch.updated_at = new Date().toISOString()
      }

      if (Object.keys(patch).length > 0) {
        const { error: updateError } = await db.from("orders").update(patch).eq("id", order.id)
        if (updateError) throw new Error(updateError.message)
      }

      results.push({ id: order.id, state: nextState, activated: delivered })
    } catch (err) {
      // One bad barcode must not abort the whole sweep.
      results.push({ id: order.id, state: order.lp_tracking_state, activated: false, error: (err as Error).message })
    }
  }

  return json({
    scanned: results.length,
    activated: results.filter((r) => r.activated).length,
    results,
  })
})
