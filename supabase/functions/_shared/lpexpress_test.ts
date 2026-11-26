import { assertEquals } from "jsr:@std/assert@1"
import { createReturnLabel } from "./lpexpress.ts"

const SENDER_ENV: Record<string, string> = {
  LP_USERNAME: "user",
  LP_PASSWORD: "pass",
  LP_SENDER_NAME: "BRICKTIME",
  LP_SENDER_PHONE: "860000000",
  LP_SENDER_EMAIL: "hi@bricktime.lt",
  LP_SENDER_LOCALITY: "Vilnius",
  LP_SENDER_POSTCODE: "03163",
  LP_SENDER_STREET: "J. Jasinskio g.",
  LP_SENDER_BUILDING: "16",
}

// Runs createReturnLabel against a stubbed LP API and returns the body it
// POSTed to /api/v2/parcel.
async function returnParcelBody(returnTerminalId?: string) {
  for (const [k, v] of Object.entries(SENDER_ENV)) Deno.env.set(k, v)
  if (returnTerminalId) Deno.env.set("LP_RETURN_TERMINAL_ID", returnTerminalId)
  else Deno.env.delete("LP_RETURN_TERMINAL_ID")

  let parcelBody: Record<string, unknown> | null = null
  const realFetch = globalThis.fetch
  const realWarn = console.warn
  console.warn = () => {}
  globalThis.fetch = (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input)
    let payload: unknown = {}
    if (url.includes("/oauth/token")) payload = { access_token: "t", expires_in: 3600 }
    else if (url.endsWith("/api/v2/parcel")) {
      parcelBody = JSON.parse(String(init?.body))
      payload = { parcelId: "42" }
    } else if (url.includes("/barcode/list")) payload = [{ parcelId: "42", barcode: "LP123" }]
    return Promise.resolve(
      new Response(JSON.stringify(payload), { headers: { "Content-Type": "application/json" } }),
    )
  }
  try {
    const result = await createReturnLabel({
      terminalId: "1111",
      customer: { name: "Jonas", phone: "861111111" },
    })
    assertEquals(result, { parcelId: "42", barcode: "LP123" })
  } finally {
    globalThis.fetch = realFetch
    console.warn = realWarn
  }
  return parcelBody as unknown as {
    parcel: { type: string }
    sender: { address: { terminalId: string } }
    receiver: { name: string; address: Record<string, unknown>; contacts: { phone: string } }
  }
}

Deno.test("return label goes locker to BRICKTIME's locker (T2T) when LP_RETURN_TERMINAL_ID is set", async () => {
  const body = await returnParcelBody("0137")
  assertEquals(body.parcel.type, "T2T")
  assertEquals(body.sender.address.terminalId, "1111")
  assertEquals(body.receiver.name, "BRICKTIME")
  assertEquals(body.receiver.address, { countryCode: "LT", terminalId: "0137" })
  assertEquals(body.receiver.contacts.phone, "+37060000000")
})

Deno.test("return label falls back to BRICKTIME's door (T2H) when LP_RETURN_TERMINAL_ID is unset", async () => {
  const body = await returnParcelBody()
  assertEquals(body.parcel.type, "T2H")
  assertEquals(body.receiver.address.terminalId, undefined)
  assertEquals(body.receiver.address.street, "J. Jasinskio g.")
})
