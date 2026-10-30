import { flatUpgradeDiffCents } from "./plan-change.ts"

const monthly = (cents: number, quantity = 1) => ({
  price: { unit_amount: cents, recurring: { interval: "month" } },
  quantity,
})

function assertEquals(actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(`expected ${expected}, got ${actual}`)
  }
}

Deno.test("Meistras to Legenda bills the 20.00 gap", () => {
  assertEquals(flatUpgradeDiffCents([monthly(5999)], "month", 7999), 2000)
})

Deno.test("delivery add-on counts in both totals", () => {
  // 59.99 + 3.00 now, 79.99 + 3.00 after: the gap is still 20.00.
  assertEquals(
    flatUpgradeDiffCents([monthly(5999), monthly(300)], "month", 8299),
    2000
  )
})

Deno.test("same or lower price falls back to Stripe proration", () => {
  assertEquals(flatUpgradeDiffCents([monthly(7999)], "month", 7999), null)
  assertEquals(flatUpgradeDiffCents([monthly(7999)], "month", 2499), null)
})

Deno.test("yearly target or yearly current falls back", () => {
  assertEquals(flatUpgradeDiffCents([monthly(5999)], "year", 71988), null)
  assertEquals(
    flatUpgradeDiffCents(
      [{ price: { unit_amount: 71988, recurring: { interval: "year" } } }],
      "month",
      7999
    ),
    null
  )
})

Deno.test("unknown amounts fall back", () => {
  assertEquals(
    flatUpgradeDiffCents(
      [{ price: { unit_amount: null, recurring: { interval: "month" } } }],
      "month",
      7999
    ),
    null
  )
  assertEquals(flatUpgradeDiffCents([], "month", 7999), null)
})
