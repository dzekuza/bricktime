// Delivers one admin alert to every configured channel (WhatsApp, Telegram).
// An alert counts as sent as soon as one channel delivered it, so a channel that
// is down never causes the other one to repeat the message; the failure is
// returned as a warning for the outbox log instead.

import { sendTelegramAlert, isTelegramConfigured } from "./telegram.ts"
import {
  isWhatsAppConfigured,
  sendWhatsAppAlert,
  type SendResult,
} from "./whatsapp.ts"

type Channel = {
  name: string
  isConfigured: () => boolean
  send: (message: string) => Promise<SendResult>
}

const CHANNELS: Channel[] = [
  { name: "whatsapp", isConfigured: isWhatsAppConfigured, send: sendWhatsAppAlert },
  { name: "telegram", isConfigured: isTelegramConfigured, send: sendTelegramAlert },
]

export function isAnyChannelConfigured(): boolean {
  return CHANNELS.some((channel) => channel.isConfigured())
}

export async function sendAdminAlert(message: string): Promise<SendResult> {
  const active = CHANNELS.filter((channel) => channel.isConfigured())
  if (active.length === 0) {
    return { ok: false, retryable: false, error: "No alert channel is configured" }
  }

  const outcomes = await Promise.all(
    active.map(async (channel) => ({
      name: channel.name,
      result: await channel.send(message),
    }))
  )
  const failures = outcomes.flatMap(({ name, result }) =>
    result.ok ? [] : [{ name, ...result }]
  )
  const describe = () =>
    failures.map((failure) => `${failure.name}: ${failure.error}`).join(" | ")

  if (failures.length < outcomes.length) {
    return failures.length === 0 ? { ok: true } : { ok: true, warning: describe() }
  }
  return {
    ok: false,
    retryable: failures.some((failure) => failure.retryable),
    error: describe(),
  }
}
