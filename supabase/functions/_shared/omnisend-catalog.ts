export const SITE_URL = "https://www.bricktime.lt"

const MAX_DESCRIPTION = 1000
const MAX_IMAGES = 10

export interface CatalogProductRow {
  id: number
  title: string
  subtitle: string | null
  description: string | null
  category: string | null
  image_url: string | null
  gallery: unknown
  price: number | string | null
  value: number | string | null
  stock: number | null
  status: string
  created_at: string | null
  updated_at: string | null
}

export interface OmnisendCategory {
  categoryID: string
  title: string
}

// "POKÉMON™" -> "pokemon": a stable id that survives title tweaks like ™/®.
// The signs go first: NFKD would turn ™ into the letters "TM".
export function toCategoryId(category: string): string {
  return category
    .replace(/[™®]/g, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100)
}

export function toCategories(rows: CatalogProductRow[]): OmnisendCategory[] {
  const byId = new Map<string, OmnisendCategory>()
  for (const { category } of rows) {
    const title = category?.trim()
    if (!title) continue
    const categoryID = toCategoryId(title)
    if (categoryID && !byId.has(categoryID)) {
      byId.set(categoryID, { categoryID, title: title.slice(0, 255) })
    }
  }
  return [...byId.values()]
}

const toStatus = (row: CatalogProductRow) =>
  row.status === "sold_out" || (row.stock ?? 0) <= 0
    ? "outOfStock"
    : "inStock"

export function toOmnisendProduct(row: CatalogProductRow) {
  const id = String(row.id)
  const url = `${SITE_URL}/drop/${id}`
  const status = toStatus(row)
  const categoryId = row.category ? toCategoryId(row.category) : ""
  const description = (row.description ?? row.subtitle ?? "").trim()
  const images = Array.isArray(row.gallery)
    ? row.gallery
        .filter((g): g is string => typeof g === "string" && g.length > 0)
        .slice(0, MAX_IMAGES)
    : []

  return {
    id,
    title: row.title.slice(0, 255),
    currency: "EUR",
    status,
    url,
    vendor: "LEGO",
    ...(description && { description: description.slice(0, MAX_DESCRIPTION) }),
    ...(categoryId && { categoryIDs: [categoryId] }),
    ...(row.image_url && { defaultImageUrl: row.image_url }),
    ...(images.length > 0 && { images }),
    ...(row.created_at && { createdAt: row.created_at }),
    ...(row.updated_at && { updatedAt: row.updated_at }),
    variants: [
      {
        id,
        title: row.title.slice(0, 255),
        price: Number(row.price ?? row.value ?? 0),
        status,
        url,
      },
    ],
  }
}
