import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { code } = await req.json()
    if (!code || typeof code !== "string") throw new Error("code is required")

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )

    const { data: card, error } = await supabase
      .from("gift_cards")
      .select("id, code, amount_cents, status, expires_at")
      .eq("code", code.toUpperCase())
      .maybeSingle()

    if (error || !card) {
      return new Response(JSON.stringify({ valid: false, error: "Code not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (card.status === "used") {
      return new Response(JSON.stringify({ valid: false, error: "Code already used" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (card.status === "expired" || new Date(card.expires_at) < new Date()) {
      return new Response(JSON.stringify({ valid: false, error: "Code expired" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    return new Response(
      JSON.stringify({ valid: true, amountCents: card.amount_cents, code: card.code }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (err) {
    return new Response(JSON.stringify({ valid: false, error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
