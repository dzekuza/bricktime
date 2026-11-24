import { omnisendFetch } from "../_shared/omnisend.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()
    if (!email || typeof email !== "string" || !EMAIL_RE.test(email)) {
      return new Response(
        JSON.stringify({
          error: {
            code: "invalid_email",
            message: "A valid email is required",
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const apiKey = Deno.env.get("OMNISEND_API_KEY")
    if (!apiKey) {
      throw new Error("OMNISEND_API_KEY is not configured")
    }

    const normalizedEmail = email.trim().toLowerCase()
    const res = await omnisendFetch(apiKey, "/contacts", {
      method: "POST",
      body: {
        identifiers: [
          {
            type: "email",
            id: normalizedEmail,
            channels: { email: { status: "subscribed" } },
          },
        ],
      },
    })

    // 409: the address is already a contact, which is fine for a waitlist signup.
    if (!res.ok && res.status !== 409) {
      const detail = await res.text()
      console.error(`Omnisend contact upsert failed: ${res.status} ${detail}`)
      return new Response(
        JSON.stringify({
          error: { code: "omnisend_error", message: "Failed to subscribe" },
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // A separate call: `tags` on the contact itself now replaces the whole list
    // (v5 appended), which would wipe the tags of an existing customer. Tried
    // twice; the confirmation email below must go out either way.
    let isTagged = false
    for (let attempt = 1; attempt <= 2 && !isTagged; attempt++) {
      const tagRes = await omnisendFetch(apiKey, "/contacts/tags", {
        method: "POST",
        body: { emails: [normalizedEmail], tags: ["coming-soon"] },
      })
      isTagged = tagRes.ok
      if (!isTagged) {
        console.error(
          `Omnisend tagging failed (try ${attempt}): ${tagRes.status} ${await tagRes.text()}`
        )
      }
    }

    const eventRes = await omnisendFetch(apiKey, "/events", {
      method: "POST",
      body: {
        eventName: "coming soon subscribed",
        origin: "api",
        contact: { email: normalizedEmail },
        properties: {},
      },
    })

    if (!eventRes.ok) {
      console.error(
        `Omnisend event push failed: ${eventRes.status} ${await eventRes.text()}`
      )
    }

    if (!isTagged) {
      return new Response(
        JSON.stringify({
          error: { code: "omnisend_tag_error", message: "Subscribed, but not tagged" },
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("omnisend-subscribe error:", err)
    return new Response(
      JSON.stringify({
        error: { code: "unexpected_error", message: "Something went wrong" },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})
