// Meta WhatsApp Cloud API sender. Business-initiated messages must use an
// approved template, so every alert goes through one generic template whose
// body is "BRICKTIME: {{1}}". Swapping providers means replacing this file.

const GRAPH_URL = "https://graph.facebook.com/v21.0"

export type SendResult =
  | { ok: true }
  | { ok: false; retryable: boolean; error: string }

export function isWhatsAppConfigured(): boolean {
  return Boolean(
    Deno.env.get("WHATSAPP_TOKEN") &&
    Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") &&
    Deno.env.get("ADMIN_WHATSAPP_TO")
  )
}

export async function sendWhatsAppAlert(message: string): Promise<SendResult> {
  const token = Deno.env.get("WHATSAPP_TOKEN")
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")
  const to = Deno.env.get("ADMIN_WHATSAPP_TO")
  if (!token || !phoneNumberId || !to) {
    return { ok: false, retryable: false, error: "WhatsApp is not configured" }
  }

  const res = await fetch(`${GRAPH_URL}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to.replace(/\D/g, ""),
      type: "template",
      template: {
        name: Deno.env.get("WHATSAPP_TEMPLATE_NAME") ?? "admin_alert",
        language: { code: Deno.env.get("WHATSAPP_TEMPLATE_LANG") ?? "lt" },
        components: [
          { type: "body", parameters: [{ type: "text", text: message }] },
        ],
      },
    }),
  })

  if (res.ok) return { ok: true }

  const error = `${res.status} ${await res.text()}`
  // Rate limits and server errors are worth another try; a rejected token,
  // template or number would fail the same way forever.
  return {
    ok: false,
    retryable: res.status === 429 || res.status >= 500,
    error,
  }
}
