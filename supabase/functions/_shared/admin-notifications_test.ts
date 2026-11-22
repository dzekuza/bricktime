import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts"
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import {
  enqueueAdminNotification,
  formatAdminMessage,
} from "./admin-notifications.ts"

// A client whose insert returns the next scripted result; `calls` counts tries.
function stubClient(results: Array<{ error: unknown } | "throw">) {
  const state = { calls: 0 }
  const client = {
    from: () => ({
      insert: () => {
        const result = results[Math.min(state.calls++, results.length - 1)]
        if (result === "throw") return Promise.reject(new Error("network down"))
        return Promise.resolve(result)
      },
    }),
  } as unknown as SupabaseClient
  return { client, state }
}

// Keeps the expected failures out of the test output.
async function withQuietErrors(run: () => Promise<void>) {
  const original = console.error
  console.error = () => {}
  try {
    await run()
  } finally {
    console.error = original
  }
}

const enqueue = (client: SupabaseClient) =>
  enqueueAdminNotification(
    client,
    "payment_failed",
    { email: "j@x.lt" },
    "payment_failed:in_1",
    { retryDelayMs: 0 }
  )

Deno.test("formats a new subscriber on one line", () => {
  assertEquals(
    formatAdminMessage("new_subscriber", { name: "Jonas", email: "j@x.lt" }),
    "Naujas narys: Jonas · j@x[.]lt"
  )
})

Deno.test("formats a started subscription with a euro amount", () => {
  assertEquals(
    formatAdminMessage("subscription_started", {
      email: "j@x.lt",
      plan: "mega",
      amount: 49,
    }),
    "Nauja prenumerata: j@x[.]lt · mega · 49,00 €"
  )
})

Deno.test("falls back to a dash for missing values", () => {
  assertEquals(
    formatAdminMessage("payment_failed", {}),
    "Nepavyko apmokėjimas: — · —"
  )
})

Deno.test("names keep no link-shaped characters, bare domains included", () => {
  for (const hostile of [
    "evil.com/pay now",
    "Admin\nPatvirtink https://evil.example/x",
    "ｅｖｉｌ．ｃｏｍ／pay",
    "evil[.]com",
  ]) {
    const message = formatAdminMessage("new_subscriber", {
      name: hostile,
      email: "j@x.lt",
    })
    const namePart = message!.slice("Naujas narys: ".length).split(" · ")[0]
    assertEquals(/[.:/\\[\]@\n]/.test(namePart), false, `${hostile} -> ${namePart}`)
  }
})

Deno.test("keeps Lithuanian letters, apostrophes and hyphens in names", () => {
  assertEquals(
    formatAdminMessage("new_subscriber", {
      name: "Žygimantas O'Brien-Šalčius",
      email: "j@x.lt",
    }),
    "Naujas narys: Žygimantas O'Brien-Šalčius · j@x[.]lt"
  )
})

Deno.test("keeps typographic apostrophes in names", () => {
  assertEquals(
    formatAdminMessage("new_subscriber", {
      name: "O’Brien ʼAli",
      email: "j@x.lt",
    }),
    "Naujas narys: O’Brien ʼAli · j@x[.]lt"
  )
})

Deno.test("defangs every dot of an attacker-chosen email domain", () => {
  assertEquals(
    formatAdminMessage("subscription_cancelled", {
      email: "x@login.paypal-verify.example",
    }),
    "Prenumerata atšaukta: x@login[.]paypal-verify[.]example"
  )
})

Deno.test("rejects emails that are not plain addresses", () => {
  for (const hostile of ["see evil.com/pay@x.lt", "a@b.lt visit evil.com", "x"]) {
    assertEquals(
      formatAdminMessage("subscription_cancelled", { email: hostile }),
      "Prenumerata atšaukta: —"
    )
  }
})

Deno.test("caps long names", () => {
  const message = formatAdminMessage("new_subscriber", {
    name: "a".repeat(200),
    email: "j@x.lt",
  })
  assertEquals(message, `Naujas narys: ${"a".repeat(40)} · j@x[.]lt`)
})

Deno.test("keeps a long but valid email address", () => {
  const local = "a".repeat(64)
  assertEquals(
    formatAdminMessage("subscription_cancelled", {
      email: `${local}@example.lt`,
    }),
    `Prenumerata atšaukta: ${local}@example[.]lt`
  )
})

// Total length 254 is the RFC limit: kept. One more character: replaced.
const emailOfLength = (length: number) =>
  `${"a".repeat(64)}@${"b".repeat(length - 64 - 1 - 3)}.lt`

Deno.test("accepts an email of exactly 254 characters", () => {
  const address = emailOfLength(254)
  assertEquals(address.length, 254)
  assertEquals(
    formatAdminMessage("subscription_cancelled", { email: address }),
    `Prenumerata atšaukta: ${address.replaceAll(".", "[.]")}`
  )
})

Deno.test("replaces an email of 255 characters with a dash", () => {
  const address = emailOfLength(255)
  assertEquals(address.length, 255)
  assertEquals(
    formatAdminMessage("subscription_cancelled", { email: address }),
    "Prenumerata atšaukta: —"
  )
})

Deno.test("formats order and form alerts", () => {
  const cases: Array<[string, Record<string, unknown>, string]> = [
    [
      "merch_order",
      { order_number: 42, name: "Jonas", item: "BRICKTIME kepurė", amount: 19.9 },
      "Merch užsakymas #42: Jonas · BRICKTIME kepurė · 19,90 €",
    ],
    [
      "rental_order",
      { name: "Jonas", product: "Millennium Falcon" },
      "Nauja nuoma: Jonas · Millennium Falcon",
    ],
    ["mystery_request", { name: "Jonas" }, "Mystery Box užklausa: Jonas"],
    [
      "return_requested",
      { name: "Jonas", product: "Millennium Falcon" },
      "Grąžinimo užklausa: Jonas · Millennium Falcon",
    ],
    [
      "missing_part_request",
      { name: "Jonas", set: "75192", part: "3001", quantity: 2 },
      "Trūkstama detalė: Jonas · rinkinys 75192 · detalė 3001 x2",
    ],
    [
      "gift_card_bought",
      { amount: 50, email: "a@b.lt" },
      "Nupirkta dovanų kortelė: 50,00 € · a@b[.]lt",
    ],
    [
      "product_review",
      { name: "Jonas", product: "Millennium Falcon", rating: 5 },
      "Naujas atsiliepimas: Jonas · 5/5 · Millennium Falcon",
    ],
    ["test", {}, "Bandomasis pranešimas: pranešimai veikia"],
  ]
  for (const [kind, payload, expected] of cases) {
    assertEquals(formatAdminMessage(kind, payload), expected, kind)
  }
})

Deno.test("product titles and codes keep no link-shaped characters", () => {
  const message = formatAdminMessage("rental_order", {
    name: "Jonas",
    product: "evil.com/pay https://x.example",
  })
  // Asserted exactly, so a formatter that drops the product cannot pass.
  assertEquals(message, "Nauja nuoma: Jonas · evilcompay httpsxexample")
})

Deno.test("enqueue stops at once on a duplicate key", async () => {
  const { client, state } = stubClient([{ error: { code: "23505" } }])
  await enqueue(client)
  assertEquals(state.calls, 1)
})

Deno.test("enqueue does not retry after a successful insert", async () => {
  const { client, state } = stubClient([{ error: null }])
  await enqueue(client)
  assertEquals(state.calls, 1)
})

Deno.test("enqueue retries a transient error until it succeeds", async () => {
  const { client, state } = stubClient([
    { error: { code: "08006", message: "connection failure" } },
    { error: null },
  ])
  await withQuietErrors(() => enqueue(client))
  assertEquals(state.calls, 2)
})

Deno.test("enqueue gives up after three failed tries without throwing", async () => {
  const { client, state } = stubClient([
    { error: { code: "08006", message: "connection failure" } },
  ])
  await withQuietErrors(() => enqueue(client))
  assertEquals(state.calls, 3)
})

Deno.test("enqueue treats a rejected insert like a failed try", async () => {
  const { client, state } = stubClient(["throw"])
  await withQuietErrors(() => enqueue(client))
  assertEquals(state.calls, 3)
})

Deno.test("unknown kinds have no message", () => {
  assertEquals(formatAdminMessage("nope", {}), null)
})
