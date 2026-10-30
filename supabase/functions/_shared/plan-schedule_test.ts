import { fitsWithinCredits } from "./plan-schedule.ts"

function assertEquals(actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(`expected ${expected}, got ${actual}`)
  }
}

Deno.test("Legenda set of 400 does not fit Mėgėjas (100)", () => {
  assertEquals(fitsWithinCredits(400, 100), false)
})

Deno.test("sets exactly at the limit fit", () => {
  assertEquals(fitsWithinCredits(100, 100), true)
})

Deno.test("nothing held always fits", () => {
  assertEquals(fitsWithinCredits(0, 100), true)
})

Deno.test("numeric strings from the database compare as numbers", () => {
  assertEquals(fitsWithinCredits("300" as unknown as number, 300), true)
  assertEquals(fitsWithinCredits("300.01" as unknown as number, 300), false)
})
