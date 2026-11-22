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

Deno.test("unknown kinds have no message", () => {
  assertEquals(formatAdminMessage("nope", {}), null)
})
