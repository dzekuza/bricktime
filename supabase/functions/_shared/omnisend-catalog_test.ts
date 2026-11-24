import { assertEquals, assertThrows } from "jsr:@std/assert@1"
import {
  toCategories,
  toCategoryId,
  toOmnisendProduct,
  type CatalogProductRow,
} from "./omnisend-catalog.ts"

const row = (overrides: Partial<CatalogProductRow> = {}): CatalogProductRow => ({
  id: 111,
  slug: "lego-technic-mclaren-p1-42172",
  title: "LEGO® Technic™ McLaren P1™ 42172",
  subtitle: null,
  description: "Greitas automobilis",
  category: "TECHNIC™",
  image_url: "https://example.com/a.webp",
  gallery: ["https://example.com/b.webp", 5, ""],
  price: "470.00",
  stock: 1,
  available: 1,
  status: "available",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-02-01T00:00:00Z",
  ...overrides,
})

Deno.test("category ids drop accents and trademark signs", () => {
  assertEquals(toCategoryId("POKÉMON™"), "pokemon")
  assertEquals(toCategoryId("MINECRAFT®"), "minecraft")
  assertEquals(toCategoryId("STAR WARS™"), "star-wars")
  assertEquals(toCategoryId("DREAMZzz™"), "dreamzzz")
})

Deno.test("categories are unique and skip blanks", () => {
  const rows = [row(), row({ id: 2 }), row({ id: 3, category: null }), row({ id: 4, category: "KITA" })]
  assertEquals(toCategories(rows), [
    { categoryID: "technic", title: "TECHNIC™" },
    { categoryID: "kita", title: "KITA" },
  ])
})

Deno.test("an in-stock set maps to a product with one variant", () => {
  const product = toOmnisendProduct(row())
  assertEquals(product.id, "111")
  assertEquals(product.status, "inStock")
  assertEquals(product.url, "https://www.bricktime.lt/rinkinys/lego-technic-mclaren-p1-42172")
  assertEquals(product.categoryIDs, ["technic"])
  assertEquals(product.images, ["https://example.com/b.webp"])
  assertEquals(product.variants, [
    {
      id: "111",
      title: "LEGO® Technic™ McLaren P1™ 42172",
      price: 470,
      status: "inStock",
      url: "https://www.bricktime.lt/rinkinys/lego-technic-mclaren-p1-42172",
    },
  ])
})

Deno.test("no stock or sold_out means outOfStock", () => {
  assertEquals(toOmnisendProduct(row({ stock: 0, available: 0 })).status, "outOfStock")
  const soldOut = toOmnisendProduct(row({ status: "sold_out" }))
  assertEquals(soldOut.status, "outOfStock")
  assertEquals(soldOut.variants[0].status, "outOfStock")
})

Deno.test("optional fields are left out when empty", () => {
  const product = toOmnisendProduct(
    row({ description: null, category: null, image_url: null, gallery: null })
  )
  assertEquals("description" in product, false)
  assertEquals("categoryIDs" in product, false)
  assertEquals("defaultImageUrl" in product, false)
  assertEquals("images" in product, false)
})


Deno.test("a fully rented set is out of stock even though it has copies", () => {
  assertEquals(toOmnisendProduct(row({ stock: 2, available: 0 })).status, "outOfStock")
  assertEquals(toOmnisendProduct(row({ stock: 2, available: 1 })).status, "inStock")
  assertEquals(toOmnisendProduct(row({ stock: 2, available: null })).status, "inStock")
})

Deno.test("a set without a retail price is refused, not priced by its budget cost", () => {
  assertThrows(() => toOmnisendProduct(row({ price: null })), Error, "no retail price")
})

Deno.test("timestamps leave as UTC", () => {
  const product = toOmnisendProduct(
    row({ created_at: "2026-09-04 22:35:57+03", updated_at: "garbage" })
  )
  assertEquals(product.createdAt, "2026-09-04T19:35:57.000Z")
  assertEquals("updatedAt" in product, false)
})

Deno.test("a blank description falls back to the subtitle", () => {
  assertEquals(
    toOmnisendProduct(row({ description: "   ", subtitle: "Greitas" })).description,
    "Greitas"
  )
})
