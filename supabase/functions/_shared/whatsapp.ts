// WhatsApp sender for admin alerts. Two providers, picked by configuration:
//   - Twilio (WHATSAPP_PROVIDER=twilio, or TWILIO_ACCOUNT_SID set): fastest
//     to start, the sandbox needs no Meta business verification.
//   - Meta WhatsApp Cloud API (default): official, needs an approved template
//     whose body is "BRICKTIME: {{1}}".
// Callers only use isWhatsAppConfigured() and sendWhatsAppAlert().

const GRAPH_URL = "https://graph.facebook.com/v21.0"

export type SendResult =
  | { ok: true }
  | { ok: false; retryable: boolean; error: string }

type Provider = "twilio" | "meta"

function getProvider(): Provider {
  const explicit = Deno.env.get("WHATSAPP_PROVIDER")
  if (explicit === "twilio" || explicit === "meta") return explicit
  return Deno.env.get("TWILIO_ACCOUNT_SID") ? "twilio" : "meta"
}

export function isWhatsAppConfigured(): boolean {
  if (!Deno.env.get("ADMIN_WHATSAPP_TO")) return false
  if (getProvider() === "twilio") {
    return Boolean(
      Deno.env.get("TWILIO_ACCOUNT_SID") &&
        Deno.env.get("TWILIO_AUTH_TOKEN") &&
        Deno.env.get("TWILIO_WHATSAPP_FROM")
    )
  }
  return Boolean(
    Deno.env.get("WHATSAPP_TOKEN") && Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")
  )
}

export function sendWhatsAppAlert(message: string): Promise<SendResult> {
  if (!isWhatsAppConfigured()) {
    return Promise.resolve({
      ok: false,
      retryable: false,
      error: "WhatsApp is not configured",
    })
  }
  return getProvider() === "twilio" ? sendViaTwilio(message) : sendViaMeta(message)
}

// Rate limits and server errors are worth another try; a rejected token,
// template or number would fail the same way forever.
async function toResult(res: Response): Promise<SendResult> {
  if (res.ok) return { ok: true }
  return {
    ok: false,
    retryable: res.status === 429 || res.status >= 500,
    error: `${res.status} ${await res.text()}`,
  }
}

const digits = (value: string) => value.replace(/\D/g, "")

function sendViaMeta(message: string): Promise<SendResult> {
  return fetch(
    `${GRAPH_URL}/${Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("WHATSAPP_TOKEN")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: digits(Deno.env.get("ADMIN_WHATSAPP_TO")!),
        type: "template",
        template: {
          name: Deno.env.get("WHATSAPP_TEMPLATE_NAME") ?? "admin_alert",
          language: { code: Deno.env.get("WHATSAPP_TEMPLATE_LANG") ?? "lt" },
          components: [
            { type: "body", parameters: [{ type: "text", text: message }] },
          ],
        },
      }),
    }
  ).then(toResult)
}

// The sandbox accepts free-form text for 24 hours after the admin messages the
// join code. For production, set TWILIO_CONTENT_SID to an approved template
// whose single variable {{1}} carries the message.
function sendViaTwilio(message: string): Promise<SendResult> {
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID")!
  const token = Deno.env.get("TWILIO_AUTH_TOKEN")!
  const contentSid = Deno.env.get("TWILIO_CONTENT_SID")

  const form = new URLSearchParams({
    From: `whatsapp:+${digits(Deno.env.get("TWILIO_WHATSAPP_FROM")!)}`,
    To: `whatsapp:+${digits(Deno.env.get("ADMIN_WHATSAPP_TO")!)}`,
  })
  if (contentSid) {
    form.set("ContentSid", contentSid)
    form.set("ContentVariables", JSON.stringify({ "1": message }))
  } else {
    form.set("Body", `BRICKTIME: ${message}`)
  }

  return fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    }
  ).then(toResult)
}
