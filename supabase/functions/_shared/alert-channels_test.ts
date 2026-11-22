// Run with: deno test --allow-env supabase/functions/_shared/alert-channels_test.ts
// These tests replace the process-wide fetch and env vars, so they must run
// sequentially (Deno's default); do not pass --parallel.
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts"
import { isAnyChannelConfigured, sendAdminAlert } from "./alert-channels.ts"

const ENV_KEYS = [
  "WHATSAPP_PROVIDER",
  "WHATSAPP_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "ADMIN_WHATSAPP_TO",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_WHATSAPP_FROM",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_CHAT_ID",
]

const FAKE_VALUE = "fake-test-value"

const WHATSAPP = {
  WHATSAPP_PROVIDER: "meta",
  WHATSAPP_TOKEN: FAKE_VALUE,
  WHATSAPP_PHONE_NUMBER_ID: "123",
  ADMIN_WHATSAPP_TO: "37060000000",
}
const TELEGRAM = { TELEGRAM_BOT_TOKEN: `1:${FAKE_VALUE}`, TELEGRAM_CHAT_ID: "42" }

// Answers by host, so each test can script WhatsApp and Telegram separately.
type Script = { whatsapp?: number | "reject"; telegram?: number | "reject" }

async function withChannels(
  env: Record<string, string>,
  script: Script,
  run: (calls: string[]) => Promise<void>
) {
  const saved = new Map(ENV_KEYS.map((key) => [key, Deno.env.get(key)]))
  const originalFetch = globalThis.fetch
  const calls: string[] = []
  for (const key of ENV_KEYS) Deno.env.delete(key)
  for (const [key, value] of Object.entries(env)) Deno.env.set(key, value)
  globalThis.fetch = ((input: string | URL | Request) => {
    const url = String(input)
    const channel = url.includes("api.telegram.org") ? "telegram" : "whatsapp"
    calls.push(channel)
    const outcome = script[channel] ?? 200
    if (outcome === "reject") return Promise.reject(new Error(`${channel} down`))
    return Promise.resolve(new Response("{}", { status: outcome }))
  }) as typeof fetch
  try {
    await run(calls)
  } finally {
    globalThis.fetch = originalFetch
    for (const [key, value] of saved) {
      if (value === undefined) Deno.env.delete(key)
      else Deno.env.set(key, value)
    }
  }
}

Deno.test("no channel configured: not retryable, nothing is called", async () => {
  await withChannels({}, {}, async (calls) => {
    assertEquals(isAnyChannelConfigured(), false)
    const result = await sendAdminAlert("hi")
    assertEquals(result.ok, false)
    assertEquals(!result.ok && result.retryable, false)
    assertEquals(calls, [])
  })
})

Deno.test("telegram alone is enough", async () => {
  await withChannels(TELEGRAM, {}, async (calls) => {
    assertEquals(isAnyChannelConfigured(), true)
    assertEquals(await sendAdminAlert("hi"), { ok: true })
    assertEquals(calls, ["telegram"])
  })
})

Deno.test("both channels receive the alert", async () => {
  await withChannels({ ...WHATSAPP, ...TELEGRAM }, {}, async (calls) => {
    assertEquals(await sendAdminAlert("hi"), { ok: true })
    assertEquals([...calls].sort(), ["telegram", "whatsapp"])
  })
})

Deno.test("one channel failing still counts as sent, with a warning", async () => {
  await withChannels({ ...WHATSAPP, ...TELEGRAM }, { whatsapp: 400 }, async () => {
    const result = await sendAdminAlert("hi")
    assertEquals(result.ok, true)
    assertEquals(result.ok && result.warning?.startsWith("whatsapp: 400"), true)
  })
  await withChannels({ ...WHATSAPP, ...TELEGRAM }, { telegram: "reject" }, async () => {
    const result = await sendAdminAlert("hi")
    assertEquals(result.ok && result.warning?.startsWith("telegram:"), true)
  })
})

Deno.test("both failing: retryable if either failure is", async () => {
  await withChannels(
    { ...WHATSAPP, ...TELEGRAM },
    { whatsapp: 400, telegram: 500 },
    async () => {
      const result = await sendAdminAlert("hi")
      assertEquals(result.ok, false)
      assertEquals(!result.ok && result.retryable, true)
      assertEquals(
        !result.ok && result.error.includes("whatsapp:") && result.error.includes("telegram:"),
        true
      )
    }
  )
  await withChannels(
    { ...WHATSAPP, ...TELEGRAM },
    { whatsapp: 400, telegram: 401 },
    async () => {
      const result = await sendAdminAlert("hi")
      assertEquals(result.ok, false)
      assertEquals(!result.ok && result.retryable, false)
    }
  )
})
