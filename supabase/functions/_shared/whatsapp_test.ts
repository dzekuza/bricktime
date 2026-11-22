// Run with: deno test --allow-env supabase/functions/_shared/whatsapp_test.ts
// These tests replace the process-wide fetch and env vars, so they must run
// sequentially (Deno's default); do not pass --parallel.
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts"
import { sendWhatsAppAlert, type SendResult } from "./whatsapp.ts"

const ENV_KEYS = [
  "WHATSAPP_PROVIDER",
  "WHATSAPP_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "WHATSAPP_TEMPLATE_NAME",
  "WHATSAPP_TEMPLATE_LANG",
  "ADMIN_WHATSAPP_TO",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_WHATSAPP_FROM",
  "TWILIO_CONTENT_SID",
]

type FetchStub = (input: string | URL | Request, init?: RequestInit) => Promise<Response>

// Runs a test body with provider env vars and a stubbed fetch, then restores both.
// Every key in ENV_KEYS is cleared first, so ambient values cannot change a request.
async function withProvider(
  env: Record<string, string>,
  stub: FetchStub,
  run: () => Promise<void>
) {
  const saved = new Map(ENV_KEYS.map((key) => [key, Deno.env.get(key)]))
  const originalFetch = globalThis.fetch
  for (const key of ENV_KEYS) Deno.env.delete(key)
  for (const [key, value] of Object.entries(env)) Deno.env.set(key, value)
  globalThis.fetch = stub as typeof fetch
  try {
    await run()
  } finally {
    globalThis.fetch = originalFetch
    for (const [key, value] of saved) {
      if (value === undefined) Deno.env.delete(key)
      else Deno.env.set(key, value)
    }
  }
}

// Fails unless the send failed, so "not retryable" cannot pass on a wrong success.
function assertFailure(result: SendResult, retryable: boolean, context = "") {
  assertEquals(result.ok, false, `${context} should have failed`)
  if (!result.ok) assertEquals(result.retryable, retryable, context)
}

const META = {
  WHATSAPP_PROVIDER: "meta",
  WHATSAPP_TOKEN: "token",
  WHATSAPP_PHONE_NUMBER_ID: "123",
  ADMIN_WHATSAPP_TO: "+370 600 00000",
}

const TWILIO = {
  WHATSAPP_PROVIDER: "twilio",
  TWILIO_ACCOUNT_SID: "AC1",
  TWILIO_AUTH_TOKEN: "secret",
  TWILIO_WHATSAPP_FROM: "+14155238886",
  ADMIN_WHATSAPP_TO: "+37060000000",
}

const reply = (status: number, body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }))

type Seen = { url: string; init?: RequestInit }

Deno.test("reports an unconfigured sender as not retryable", async () => {
  await withProvider({}, () => reply(200, {}), async () => {
    assertFailure(await sendWhatsAppAlert("hi"), false)
  })
})

Deno.test("meta: sends the template payload with a timeout signal", async () => {
  let seen: Seen | undefined
  await withProvider(
    META,
    (input, init) => {
      seen = { url: String(input), init }
      return reply(200, { messages: [{ id: "wamid" }] })
    },
    async () => {
      assertEquals(await sendWhatsAppAlert("hi"), { ok: true })
    }
  )
  assertEquals(seen?.url.endsWith("/123/messages"), true)
  assertEquals(seen?.init?.signal instanceof AbortSignal, true)
  assertEquals(
    new Headers(seen?.init?.headers).get("Authorization"),
    "Bearer token"
  )
  assertEquals(JSON.parse(String(seen?.init?.body)), {
    messaging_product: "whatsapp",
    to: "37060000000",
    type: "template",
    template: {
      name: "admin_alert",
      language: { code: "lt" },
      components: [{ type: "body", parameters: [{ type: "text", text: "hi" }] }],
    },
  })
})

Deno.test("meta: template name and language come from the environment", async () => {
  let body: { template: { name: string; language: { code: string } } } | undefined
  await withProvider(
    { ...META, WHATSAPP_TEMPLATE_NAME: "custom", WHATSAPP_TEMPLATE_LANG: "en" },
    (_input, init) => {
      body = JSON.parse(String(init?.body))
      return reply(200, {})
    },
    async () => {
      assertEquals(await sendWhatsAppAlert("hi"), { ok: true })
    }
  )
  assertEquals(body?.template.name, "custom")
  assertEquals(body?.template.language.code, "en")
})

Deno.test("meta: a rejected fetch is retryable", async () => {
  await withProvider(
    META,
    () => Promise.reject(new TypeError("network down")),
    async () => {
      assertFailure(await sendWhatsAppAlert("hi"), true)
    }
  )
})

Deno.test("meta: an aborted request (timeout) is retryable", async () => {
  await withProvider(
    META,
    () => Promise.reject(new DOMException("timed out", "TimeoutError")),
    async () => {
      assertFailure(await sendWhatsAppAlert("hi"), true)
    }
  )
})

Deno.test("meta: throttling codes returned as HTTP 400 are retryable", async () => {
  for (const code of [4, 17, 80007, 130429, 131056]) {
    await withProvider(META, () => reply(400, { error: { code } }), async () => {
      assertFailure(await sendWhatsAppAlert("hi"), true, `code ${code}`)
    })
  }
})

Deno.test("meta: other 400 errors and bad bodies are not retryable", async () => {
  await withProvider(META, () => reply(400, { error: { code: 100 } }), async () => {
    assertFailure(await sendWhatsAppAlert("hi"), false, "code 100")
  })
  await withProvider(
    META,
    () => Promise.resolve(new Response("not json", { status: 400 })),
    async () => {
      assertFailure(await sendWhatsAppAlert("hi"), false, "non-JSON body")
    }
  )
})

Deno.test("meta: 429 and 5xx are retryable", async () => {
  for (const status of [429, 500, 503]) {
    await withProvider(META, () => reply(status, {}), async () => {
      assertFailure(await sendWhatsAppAlert("hi"), true, `status ${status}`)
    })
  }
})

Deno.test("twilio: sends form-encoded text with basic auth, sender and a timeout", async () => {
  let seen: Seen | undefined
  await withProvider(
    TWILIO,
    (input, init) => {
      seen = { url: String(input), init }
      return reply(201, { sid: "SM1" })
    },
    async () => {
      assertEquals(await sendWhatsAppAlert("hello"), { ok: true })
    }
  )
  assertEquals(seen?.url.includes("/Accounts/AC1/Messages.json"), true)
  assertEquals(seen?.init?.signal instanceof AbortSignal, true)
  assertEquals(
    new Headers(seen?.init?.headers).get("Authorization"),
    `Basic ${btoa("AC1:secret")}`
  )
  const body = new URLSearchParams(String(seen?.init?.body))
  assertEquals(body.get("From"), "whatsapp:+14155238886")
  assertEquals(body.get("To"), "whatsapp:+37060000000")
  assertEquals(body.get("Body"), "BRICKTIME: hello")
})

Deno.test("twilio: a content template sends its variable instead of a body", async () => {
  let body: URLSearchParams | undefined
  await withProvider(
    { ...TWILIO, TWILIO_CONTENT_SID: "HX1" },
    (_input, init) => {
      body = new URLSearchParams(String(init?.body))
      return reply(201, {})
    },
    async () => {
      assertEquals(await sendWhatsAppAlert("hello"), { ok: true })
    }
  )
  assertEquals(body?.get("ContentSid"), "HX1")
  assertEquals(body?.get("ContentVariables"), JSON.stringify({ "1": "hello" }))
  assertEquals(body?.has("Body"), false)
})

Deno.test("twilio: a rejected fetch and 429 are retryable, 400 is not", async () => {
  await withProvider(TWILIO, () => Promise.reject(new Error("down")), async () => {
    assertFailure(await sendWhatsAppAlert("hi"), true, "rejected fetch")
  })
  await withProvider(TWILIO, () => reply(429, {}), async () => {
    assertFailure(await sendWhatsAppAlert("hi"), true, "429")
  })
  await withProvider(TWILIO, () => reply(400, { code: 63016 }), async () => {
    assertFailure(await sendWhatsAppAlert("hi"), false, "400")
  })
})
