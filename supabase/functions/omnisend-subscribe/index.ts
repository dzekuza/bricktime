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

    const res = await fetch("https://api.omnisend.com/v5/contacts", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identifiers: [
          {
            type: "email",
            id: email.trim().toLowerCase(),
            channels: { email: { status: "subscribed" } },
          },
        ],
        tags: ["coming-soon"],
      }),
    })

    if (!res.ok) {
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
