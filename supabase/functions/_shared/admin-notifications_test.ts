import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts"
import { formatAdminMessage } from "./admin-notifications.ts"

Deno.test("formats a new subscriber on one line", () => {
  assertEquals(
    formatAdminMessage("new_subscriber", { name: "Jonas", email: "j@x.lt" }),
    "Naujas narys: Jonas · j@x.lt"
  )
})

Deno.test("formats a started subscription with a euro amount", () => {
  assertEquals(
    formatAdminMessage("subscription_started", {
      email: "j@x.lt",
      plan: "mega",
      amount: 49,
    }),
    "Nauja prenumerata: j@x.lt · mega · 49,00 €"
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
    "Naujas narys: Žygimantas O'Brien-Šalčius · j@x.lt"
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
  assertEquals(message, `Naujas narys: ${"a".repeat(40)} · j@x.lt`)
})

Deno.test("unknown kinds have no message", () => {
  assertEquals(formatAdminMessage("nope", {}), null)
})
