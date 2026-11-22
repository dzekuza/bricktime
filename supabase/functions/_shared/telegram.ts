// Telegram Bot API sender for admin alerts. Needs no phone number, template or
// approval: create a bot with @BotFather, message it once, and put the bot
// token and your chat id in TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.

import type { SendResult } from "./whatsapp.ts"

const API_URL = "https://api.telegram.org"
const REQUEST_TIMEOUT_MS = 10_000

export function isTelegramConfigured(): boolean {
  return Boolean(
    Deno.env.get("TELEGRAM_BOT_TOKEN") && Deno.env.get("TELEGRAM_CHAT_ID")
  )
}

// The token is part of the request URL, and a failed fetch puts that URL in its
// error message. These errors are logged and stored where an admin can read
// them, so the token must never survive into them.
const redact = (text: string, token: string) =>
  text.split(token).join("[token]")

export async function sendTelegramAlert(message: string): Promise<SendResult> {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN")
  const chatId = Deno.env.get("TELEGRAM_CHAT_ID")
  if (!token || !chatId) {
    return { ok: false, retryable: false, error: "Telegram is not configured" }
  }

  try {
    const res = await fetch(`${API_URL}/bot${token}/sendMessage`, {
      method: "POST",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { "Content-Type": "application/json" },
      // No parse_mode: the text is plain, so nothing in it can be read as
      // markup, and link previews are off.
      body: JSON.stringify({
        chat_id: chatId,
        text: `BRICKTIME: ${message}`,
        disable_web_page_preview: true,
      }),
    })
    if (res.ok) return { ok: true }
    // Rate limits and server errors are worth another try; a bad token or
    // chat id (401, 403, 400) would fail the same way forever.
    return {
      ok: false,
      retryable: res.status === 429 || res.status >= 500,
      error: redact(`${res.status} ${await res.text()}`, token),
    }
  } catch (error) {
    return {
      ok: false,
      retryable: true,
      error: redact(
        `Request failed: ${error instanceof Error ? error.message : String(error)}`,
        token
      ),
    }
  }
}
