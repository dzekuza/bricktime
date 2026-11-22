import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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

const service = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Where the invite email lands. Fixed here (not taken from the request) so an
// invite can't be pointed at another site.
const ADMIN_URL =
  Deno.env.get("ADMIN_SITE_URL") ?? "https://www.bricktime.lt/admin/"

// Admin-only: invites an email to the dashboard, or promotes an account that
// already exists. "Admin" is app_metadata.role = 'admin', the claim the
// database's row-level rules check; members can't write it themselves.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401)

    const callerClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const {
      data: { user: caller },
    } = await callerClient.auth.getUser()
    if (caller?.app_metadata?.role !== "admin") {
      return json({ error: "Forbidden" }, 403)
    }

    const { email: rawEmail } = await req.json()
    const email =
      typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : ""
    if (!EMAIL_PATTERN.test(email)) {
      return json({ error: "Enter a valid email address" }, 400)
    }

    // Existing account (e.g. a member): grant the role, keep the rest of its metadata.
    const existing = await findUserByEmail(email)
    if (existing) {
      // Anyone can sign up with an address they don't own. Promoting an account
      // whose email was never confirmed would hand the role to that stranger.
      if (!existing.email_confirmed_at) {
        return json(
          {
            error:
              "This email has an account that was never verified, so it can't be made an admin",
          },
          409
        )
      }
      const { error } = await service.auth.admin.updateUserById(existing.id, {
        app_metadata: { ...existing.app_metadata, role: "admin" },
      })
      if (error)
        return json({ error: "Could not make this account an admin" }, 500)
      return json({ status: "promoted" })
    }

    const { data, error } = await service.auth.admin.inviteUserByEmail(email, {
      redirectTo: ADMIN_URL,
    })
    if (error || !data.user) {
      console.error("admin-invite: invite failed", error?.message)
      return json({ error: "Could not send the invite" }, 500)
    }
    const { error: roleError } = await service.auth.admin.updateUserById(
      data.user.id,
      { app_metadata: { ...data.user.app_metadata, role: "admin" } }
    )
    if (roleError) {
      return json(
        { error: "Invite sent, but the admin role could not be set" },
        500
      )
    }
    return json({ status: "invited" })
  } catch (err) {
    console.error("admin-invite failed", (err as Error).message)
    return json({ error: "Invite failed" }, 500)
  }
})

/** The auth API can't look a user up by email, so page through the list. */
async function findUserByEmail(email: string) {
  const perPage = 1000
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await service.auth.admin.listUsers({
      page,
      perPage,
    })
    if (error) throw new Error(`listUsers failed: ${error.message}`)
    const match = data.users.find((u) => u.email?.toLowerCase() === email)
    if (match) return match
    if (data.users.length < perPage) return null
  }
  return null
}
