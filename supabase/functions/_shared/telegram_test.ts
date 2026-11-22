// Run with: deno test --allow-env supabase/functions/_shared/telegram_test.ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts"
import { sendTelegramAlert } from "./telegram.ts"
import type { SendResult } from "./whatsapp.ts"

const ENV_KEYS = ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"]
const FAKE_BOT_KEY = "111:fake-test-value"

type FetchStub = (input: string | URL | Request, init?: RequestInit) => Promise<Response>

async function withTelegram(
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

function assertFailure(result: SendResult, retryable: boolean, context = "") {
  assertEquals(result.ok, false, `${context} should have failed`)
  if (!result.ok) assertEquals(result.retryable, retryable, context)
}

const CONFIGURED = { TELEGRAM_BOT_TOKEN: FAKE_BOT_KEY, TELEGRAM_CHAT_ID: "-100123" }

const reply = (status: number, body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }))

Deno.test("an unconfigured bot is not retryable", async () => {
  await withTelegram({}, () => reply(200, {}), async () => {
    assertFailure(await sendTelegramAlert("hi"), false)
  })
})

Deno.test("sends plain text to the configured chat with a timeout", async () => {
  let seen: { url: string; init?: RequestInit } | undefined
  await withTelegram(
    CONFIGURED,
    (input, init) => {
      seen = { url: String(input), init }
      return reply(200, { ok: true })
    },
    async () => {
      assertEquals(await sendTelegramAlert("hello"), { ok: true })
    }
  )
  assertEquals(seen?.url, `https://api.telegram.org/bot${FAKE_BOT_KEY}/sendMessage`)
  assertEquals(seen?.init?.signal instanceof AbortSignal, true)
  // No parse_mode, so the text can never be read as markup.
  assertEquals(JSON.parse(String(seen?.init?.body)), {
    chat_id: "-100123",
    text: "BRICKTIME: hello",
    disable_web_page_preview: true,
  })
})

Deno.test("429 and 5xx are retryable", async () => {
  for (const status of [429, 500, 502]) {
    await withTelegram(CONFIGURED, () => reply(status, {}), async () => {
      assertFailure(await sendTelegramAlert("hi"), true, `status ${status}`)
    })
  }
})

Deno.test("a bad credential or chat id is not retryable", async () => {
  for (const status of [400, 401, 403, 404]) {
    await withTelegram(CONFIGURED, () => reply(status, {}), async () => {
      assertFailure(await sendTelegramAlert("hi"), false, `status ${status}`)
    })
  }
})

Deno.test("a rejected fetch is retryable and its error never contains the bot key", async () => {
  await withTelegram(
    CONFIGURED,
    () =>
      Promise.reject(
        new TypeError(
          `error sending request for url (https://api.telegram.org/bot${FAKE_BOT_KEY}/sendMessage)`
        )
      ),
    async () => {
      const result = await sendTelegramAlert("hi")
      assertFailure(result, true)
      assertEquals(!result.ok && result.error.includes(FAKE_BOT_KEY), false)
      assertEquals(!result.ok && result.error.includes("[token]"), true)
    }
  )
})

Deno.test("an error body that echoes the bot key is redacted", async () => {
  await withTelegram(
    CONFIGURED,
    () => reply(401, { description: `Unauthorized bot${FAKE_BOT_KEY}` }),
    async () => {
      const result = await sendTelegramAlert("hi")
      assertFailure(result, false)
      assertEquals(!result.ok && result.error.includes(FAKE_BOT_KEY), false)
    }
  )
})
