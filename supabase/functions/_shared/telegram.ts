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

export type TelegramRich = {
  html: string
  buttons?: { text: string; url: string }[]
}

async function post(
  token: string,
  body: Record<string, unknown>
): Promise<Response> {
  return await fetch(`${API_URL}/bot${token}/sendMessage`, {
    method: "POST",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

// With `rich`, the alert goes out as HTML (bold, links, link buttons); the
// plain message is the fallback if Telegram rejects the markup, so an alert is
// never lost to a formatting problem.
export async function sendTelegramAlert(
  message: string,
  rich?: TelegramRich
): Promise<SendResult> {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN")
  const chatId = Deno.env.get("TELEGRAM_CHAT_ID")
  if (!token || !chatId) {
    return { ok: false, retryable: false, error: "Telegram is not configured" }
  }

  try {
    const plain = {
      chat_id: chatId,
      text: `BRICKTIME: ${message}`,
      disable_web_page_preview: true,
    }
    let res = rich
      ? await post(token, {
          chat_id: chatId,
          text: rich.html,
          parse_mode: "HTML",
          disable_web_page_preview: true,
          ...(rich.buttons?.length
            ? {
                reply_markup: {
                  inline_keyboard: [
                    rich.buttons.map(({ text, url }) => ({ text, url })),
                  ],
                },
              }
            : {}),
        })
      : await post(token, plain)
    // 400 is a markup or button problem here (the chat id is valid, or the
    // plain send below would fail too): resend as plain text.
    if (rich && res.status === 400) res = await post(token, plain)
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
