import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const TOKEN_URL = "https://oauth2.googleapis.com/token"
const SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/webmasters.readonly",
]

function base64url(bytes: ArrayBuffer | Uint8Array) {
  const buf = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let str = ""
  for (const b of buf) str += String.fromCharCode(b)
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

// Google-issued PEM keys arrive as a single env-var line with literal "\n"
// sequences instead of real newlines, wrapped in PEM header/footer markers.
function pemToDer(pem: string) {
  const normalized = pem.replace(/\\n/g, "\n")
  const body = normalized
    .split("\n")
    .filter((line) => line && !line.startsWith("-----"))
    .join("")
  return Uint8Array.from(atob(body), (c) => c.charCodeAt(0))
}

async function getAccessToken(email: string, privateKeyPem: string) {
  const header = base64url(new TextEncoder().encode(JSON.stringify({ alg: "RS256", typ: "JWT" })))
  const now = Math.floor(Date.now() / 1000)
  const claim = base64url(
    new TextEncoder().encode(
      JSON.stringify({
        iss: email,
        scope: SCOPES.join(" "),
        aud: TOKEN_URL,
        iat: now,
        exp: now + 3600,
      })
    )
  )
  const unsigned = `${header}.${claim}`

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    pemToDer(privateKeyPem),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsigned)
  )
  const jwt = `${unsigned}.${base64url(signature)}`

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`Google token exchange failed: ${JSON.stringify(json)}`)
  return json.access_token as string
}

function toDateString(d: Date) {
  return d.toISOString().slice(0, 10)
}

async function fetchGa4(accessToken: string, propertyId: string, startDate: string, endDate: string) {
  const totalsRes = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        metrics: [{ name: "sessions" }, { name: "activeUsers" }, { name: "conversions" }],
      }),
    }
  )
  const totalsJson = await totalsRes.json()
  if (!totalsRes.ok) throw new Error(`GA4 totals failed: ${JSON.stringify(totalsJson)}`)
  const totalsRow = totalsJson.rows?.[0]?.metricValues ?? []

  const seriesRes = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "sessions" }, { name: "activeUsers" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }),
    }
  )
  const seriesJson = await seriesRes.json()
  if (!seriesRes.ok) throw new Error(`GA4 series failed: ${JSON.stringify(seriesJson)}`)

  return {
    totals: {
      sessions: Number(totalsRow[0]?.value ?? 0),
      users: Number(totalsRow[1]?.value ?? 0),
      conversions: Number(totalsRow[2]?.value ?? 0),
    },
    series: (seriesJson.rows ?? []).map((row: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => ({
      date: row.dimensionValues[0].value,
      sessions: Number(row.metricValues[0]?.value ?? 0),
      users: Number(row.metricValues[1]?.value ?? 0),
    })),
  }
}

async function fetchGsc(accessToken: string, siteUrl: string, startDate: string, endDate: string) {
  async function query(body: Record<string, unknown>) {
    const res = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate, ...body }),
      }
    )
    const json = await res.json()
    if (!res.ok) throw new Error(`GSC query failed: ${JSON.stringify(json)}`)
    return json.rows ?? []
  }

  const [totalsRows, seriesRows, queryRows, pageRows] = await Promise.all([
    query({}),
    query({ dimensions: ["date"] }),
    query({ dimensions: ["query"], rowLimit: 10 }),
    query({ dimensions: ["page"], rowLimit: 10 }),
  ])

  const totals = totalsRows[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 }

  return {
    totals: {
      clicks: totals.clicks ?? 0,
      impressions: totals.impressions ?? 0,
      ctr: totals.ctr ?? 0,
      position: totals.position ?? 0,
    },
    series: seriesRows.map((row: { keys: string[]; clicks: number; impressions: number }) => ({
      date: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
    })),
    topQueries: queryRows.map((row: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }) => ({
      query: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    })),
    topPages: pageRows.map((row: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }) => ({
      page: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    })),
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get("Authorization")
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader ?? "" } } }
    )
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { days = 28 } = await req.json().catch(() => ({}))
    const end = new Date()
    const start = new Date(end)
    start.setDate(start.getDate() - Number(days))
    const startDate = toDateString(start)
    const endDate = toDateString(end)

    const email = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL")
    const privateKey = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY")
    const propertyId = Deno.env.get("GA4_PROPERTY_ID")
    const siteUrl = Deno.env.get("GSC_SITE_URL")

    if (!email || !privateKey) {
      return new Response(
        JSON.stringify({ error: "Google service account credentials are not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const accessToken = await getAccessToken(email, privateKey)

    const [ga, gaError] = propertyId
      ? await fetchGa4(accessToken, propertyId, startDate, endDate)
          .then((r) => [r, null] as const)
          .catch((e) => [null, String(e)] as const)
      : [null, "GA4_PROPERTY_ID is not configured"]

    const [gsc, gscError] = siteUrl
      ? await fetchGsc(accessToken, siteUrl, startDate, endDate)
          .then((r) => [r, null] as const)
          .catch((e) => [null, String(e)] as const)
      : [null, "GSC_SITE_URL is not configured"]

    return new Response(
      JSON.stringify({ range: { startDate, endDate, days: Number(days) }, ga, gaError, gsc, gscError }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
