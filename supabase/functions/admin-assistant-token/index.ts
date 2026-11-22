import { GoogleGenAI, Modality } from "https://esm.sh/@google/genai@3.6.1"
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

const LIVE_MODEL =
  Deno.env.get("GEMINI_LIVE_MODEL") ?? "gemini-3.1-flash-live-preview"

// Admin-only: mints a short-lived, single-use Gemini Live token so the browser
// can open the voice/text session without ever holding GEMINI_API_KEY. The
// token is locked to one model and must be used within a minute.
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

    const apiKey = Deno.env.get("GEMINI_API_KEY")
    if (!apiKey) return json({ error: "Assistant is not configured" }, 503)

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { apiVersion: "v1alpha" },
    })
    const now = Date.now()
    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        newSessionExpireTime: new Date(now + 60_000).toISOString(),
        expireTime: new Date(now + 30 * 60_000).toISOString(),
        // The native-audio model only speaks audio. Without this the token's locked
        // setup defaults to TEXT and the session is closed with code 1007.
        liveConnectConstraints: {
          model: LIVE_MODEL,
          config: { responseModalities: [Modality.AUDIO] },
        },
      },
    })
    if (!token.name) return json({ error: "Could not create a token" }, 502)

    return json({ token: token.name, model: LIVE_MODEL })
  } catch (err) {
    console.error("admin-assistant-token failed", (err as Error).message)
    return json({ error: "Could not start the assistant" }, 500)
  }
})
