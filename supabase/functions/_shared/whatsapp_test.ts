// Run with: deno test --allow-env supabase/functions/_shared/whatsapp_test.ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts"
import { sendWhatsAppAlert } from "./whatsapp.ts"

const ENV_KEYS = [
  "WHATSAPP_PROVIDER",
  "WHATSAPP_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "ADMIN_WHATSAPP_TO",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_WHATSAPP_FROM",
  "TWILIO_CONTENT_SID",
]

type FetchStub = (input: string | URL | Request, init?: RequestInit) => Promise<Response>

// Runs a test body with provider env vars and a stubbed fetch, then restores both.
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

Deno.test("reports an unconfigured sender as not retryable", async () => {
  await withProvider({}, () => reply(200, {}), async () => {
    const result = await sendWhatsAppAlert("hi")
    assertEquals(result.ok, false)
    assertEquals(!result.ok && result.retryable, false)
  })
})

Deno.test("meta: a 200 is a successful send with a timeout signal", async () => {
  let signal: AbortSignal | null | undefined
  await withProvider(
    META,
    (_input, init) => {
      signal = init?.signal
      return reply(200, { messages: [{ id: "wamid" }] })
    },
    async () => {
      assertEquals(await sendWhatsAppAlert("hi"), { ok: true })
    }
  )
  assertEquals(signal instanceof AbortSignal, true)
})

Deno.test("meta: a rejected fetch is retryable", async () => {
  await withProvider(
    META,
    () => Promise.reject(new TypeError("network down")),
    async () => {
      const result = await sendWhatsAppAlert("hi")
      assertEquals(result.ok, false)
      assertEquals(!result.ok && result.retryable, true)
    }
  )
})

Deno.test("meta: an aborted request (timeout) is retryable", async () => {
  await withProvider(
    META,
    () => Promise.reject(new DOMException("timed out", "TimeoutError")),
    async () => {
      const result = await sendWhatsAppAlert("hi")
      assertEquals(!result.ok && result.retryable, true)
    }
  )
})

Deno.test("meta: throttling codes returned as HTTP 400 are retryable", async () => {
  for (const code of [4, 17, 80007, 130429, 131056]) {
    await withProvider(META, () => reply(400, { error: { code } }), async () => {
      const result = await sendWhatsAppAlert("hi")
      assertEquals(!result.ok && result.retryable, true, `code ${code}`)
    })
  }
})

Deno.test("meta: other 400 errors and bad bodies are not retryable", async () => {
  await withProvider(META, () => reply(400, { error: { code: 100 } }), async () => {
    const result = await sendWhatsAppAlert("hi")
    assertEquals(!result.ok && result.retryable, false)
  })
  await withProvider(
    META,
    () => Promise.resolve(new Response("not json", { status: 400 })),
    async () => {
      const result = await sendWhatsAppAlert("hi")
      assertEquals(!result.ok && result.retryable, false)
    }
  )
})

Deno.test("meta: 429 and 500 are retryable", async () => {
  for (const status of [429, 500, 503]) {
    await withProvider(META, () => reply(status, {}), async () => {
      const result = await sendWhatsAppAlert("hi")
      assertEquals(!result.ok && result.retryable, true, `status ${status}`)
    })
  }
})

Deno.test("twilio: sends form-encoded text with basic auth and a timeout", async () => {
  let seen: { url: string; init?: RequestInit } | undefined
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
  const body = new URLSearchParams(String(seen?.init?.body))
  assertEquals(body.get("To"), "whatsapp:+37060000000")
  assertEquals(body.get("Body"), "BRICKTIME: hello")
})

Deno.test("twilio: a rejected fetch and 429 are retryable, 400 is not", async () => {
  await withProvider(TWILIO, () => Promise.reject(new Error("down")), async () => {
    const result = await sendWhatsAppAlert("hi")
    assertEquals(!result.ok && result.retryable, true)
  })
  await withProvider(TWILIO, () => reply(429, {}), async () => {
    const result = await sendWhatsAppAlert("hi")
    assertEquals(!result.ok && result.retryable, true)
  })
  await withProvider(TWILIO, () => reply(400, { code: 63016 }), async () => {
    const result = await sendWhatsAppAlert("hi")
    assertEquals(!result.ok && result.retryable, false)
  })
})
