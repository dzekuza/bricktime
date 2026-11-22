import { GoogleGenAI } from "https://esm.sh/@google/genai@3.6.1"
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

const CHAT_MODEL = Deno.env.get("GEMINI_CHAT_MODEL") ?? "gemini-3.6-flash"
const MAX_TURNS = 80
const MAX_DECLARATIONS = 20
const MAX_SYSTEM_CHARS = 4000
const MAX_BODY_CHARS = 400_000

// Admin-only: one text turn of the admin assistant. The browser keeps the
// conversation and runs the tools (under the admin's own session, after the
// admin confirms any change); this function only holds GEMINI_API_KEY, so the
// key never reaches the browser. The model is fixed here, not chosen by the caller.
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

    const raw = await req.text()
    if (raw.length > MAX_BODY_CHARS)
      return json({ error: "Conversation too long" }, 413)
    const { contents, systemInstruction, functionDeclarations } =
      JSON.parse(raw)
    if (
      !Array.isArray(contents) ||
      contents.length === 0 ||
      contents.length > MAX_TURNS
    ) {
      return json({ error: "Invalid conversation" }, 400)
    }
    if (
      !Array.isArray(functionDeclarations) ||
      functionDeclarations.length > MAX_DECLARATIONS
    ) {
      return json({ error: "Invalid tools" }, 400)
    }
    if (
      typeof systemInstruction !== "string" ||
      systemInstruction.length > MAX_SYSTEM_CHARS
    ) {
      return json({ error: "Invalid instructions" }, 400)
    }

    const ai = new GoogleGenAI({ apiKey })
    const response = await ai.models.generateContent({
      model: CHAT_MODEL,
      contents,
      config: { systemInstruction, tools: [{ functionDeclarations }] },
    })
    const content = response.candidates?.[0]?.content
    if (!content) return json({ error: "The model returned no answer" }, 502)

    return json({ content })
  } catch (err) {
    console.error("admin-assistant-chat failed", (err as Error).message)
    return json({ error: "The assistant could not answer" }, 500)
  }
})
