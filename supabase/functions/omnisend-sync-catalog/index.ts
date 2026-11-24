import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { omnisendFetch } from "../_shared/omnisend.ts"
import {
  toCategories,
  toCategoryId,
  toOmnisendProduct,
  type CatalogProductRow,
} from "../_shared/omnisend-catalog.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })

const service = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

// Omnisend rate-limits per account; a few requests at a time stays well under it.
const CONCURRENCY = 5
const MAX_ERRORS_REPORTED = 10

const PRODUCT_COLUMNS =
  "id, slug, title, subtitle, description, category, image_url, gallery, price, stock, status, created_at, updated_at"

// Supabase caps a response (1000 rows by default), Omnisend lists in pages.
const DB_PAGE_SIZE = 1000
const OMNISEND_PAGE_SIZE = 100

async function runInBatches<T>(items: T[], task: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    await Promise.all(items.slice(i, i + CONCURRENCY).map(task))
  }
}

// Every page of an Omnisend list endpoint (offset paging), as one array.
async function listAll<T>(
  apiKey: string,
  path: string,
  key: string
): Promise<T[]> {
  const items: T[] = []
  for (let offset = 0; ; offset += OMNISEND_PAGE_SIZE) {
    const res = await omnisendFetch(
      apiKey,
      `${path}?limit=${OMNISEND_PAGE_SIZE}&offset=${offset}`
    )
    if (!res.ok) {
      throw new Error(`Listing ${key} failed: ${res.status} ${await res.text()}`)
    }
    const page = ((await res.json()) as Record<string, T[]>)[key] ?? []
    items.push(...page)
    if (page.length < OMNISEND_PAGE_SIZE) return items
  }
}

async function loadProducts(): Promise<CatalogProductRow[]> {
  const rows: Omit<CatalogProductRow, "available">[] = []
  for (let from = 0; ; from += DB_PAGE_SIZE) {
    const { data, error } = await service
      .from("products")
      .select(PRODUCT_COLUMNS)
      .order("id")
      .range(from, from + DB_PAGE_SIZE - 1)
    if (error) throw new Error(`Loading products failed: ${error.message}`)
    rows.push(...((data ?? []) as Omit<CatalogProductRow, "available">[]))
    if ((data?.length ?? 0) < DB_PAGE_SIZE) break
  }

  // What a member can claim right now; `stock` alone counts rented copies too.
  const { data: availability, error: availabilityError } = await service
    .from("product_availability")
    .select("product_id, available")
  if (availabilityError) {
    throw new Error(`Loading availability failed: ${availabilityError.message}`)
  }
  const availableById = new Map(
    (availability ?? []).map((a) => [a.product_id as number, a.available as number])
  )
  return rows.map((row) => ({ ...row, available: availableById.get(row.id) ?? null }))
}

async function syncCategories(apiKey: string, rows: CatalogProductRow[]) {
  const existing = await listAll<{ categoryID: string; title: string }>(
    apiKey,
    "/product-categories",
    "categories"
  )
  const existingById = new Map(existing.map((c) => [c.categoryID, c.title]))

  const summary = { created: 0, updated: 0, failed: 0 }
  const failedIds = new Set<string>()
  const errors: string[] = []
  await runInBatches(toCategories(rows), async ({ categoryID, title }) => {
    const known = existingById.get(categoryID)
    if (known === title) return
    const isNew = known === undefined
    const call = isNew
      ? omnisendFetch(apiKey, "/product-categories", {
          method: "POST",
          body: { categoryID, title },
        })
      : omnisendFetch(apiKey, `/product-categories/${categoryID}`, {
          method: "PATCH",
          body: { title },
        })
    const result = await call
    if (!result.ok) {
      summary.failed++
      failedIds.add(categoryID)
      const detail = await result.text()
      console.error(`Category ${categoryID} failed: ${result.status} ${detail}`)
      errors.push(`category ${categoryID}: ${result.status} ${detail}`)
      return
    }
    summary[isNew ? "created" : "updated"]++
  })
  return { summary, failedIds, errors }
}

// Knowing which products Omnisend already has avoids sending a PUT that is
// bound to fail with 404 for a new one (Omnisend counts that as a sync error).
async function syncProduct(
  apiKey: string,
  row: CatalogProductRow,
  existingIds: Set<string>
) {
  const product = toOmnisendProduct(row)
  if (existingIds.has(product.id)) {
    const put = await omnisendFetch(apiKey, `/products/${product.id}`, {
      method: "PUT",
      body: { ...product, productID: product.id },
    })
    if (put.ok) return "updated" as const
    if (put.status !== 404) throw new Error(`PUT ${put.status} ${await put.text()}`)
  }
  const post = await omnisendFetch(apiKey, "/products", {
    method: "POST",
    body: product,
  })
  if (!post.ok) throw new Error(`POST ${post.status} ${await post.text()}`)
  return "created" as const
}

// Admin-only: pushes the rental catalogue (categories first, then sets) to
// Omnisend so emails can use real products. Safe to run again at any time.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401)

    const callerClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const {
      data: { user: caller },
    } = await callerClient.auth.getUser()
    if (caller?.app_metadata?.role !== "admin") {
      return json({ error: "Forbidden" }, 403)
    }

    const apiKey = Deno.env.get("OMNISEND_API_KEY")
    if (!apiKey) return json({ error: "OMNISEND_API_KEY is not configured" }, 500)

    const rows = await loadProducts()

    const {
      summary: categories,
      failedIds,
      errors: categoryErrors,
    } = await syncCategories(apiKey, rows)
    const existingIds = new Set(
      (await listAll<{ id: string }>(apiKey, "/products", "products")).map((p) => p.id)
    )

    const products = { created: 0, updated: 0, failed: 0 }
    const errors: string[] = categoryErrors.slice(0, MAX_ERRORS_REPORTED)
    const fail = (row: CatalogProductRow, message: string) => {
      products.failed++
      if (errors.length < MAX_ERRORS_REPORTED) errors.push(`#${row.id}: ${message}`)
    }
    await runInBatches(rows, async (row) => {
      // A product pointing at a category Omnisend never got would be listed under
      // a missing or stale category, so it waits for the next run instead.
      if (row.category && failedIds.has(toCategoryId(row.category))) {
        fail(row, `category "${row.category}" did not sync`)
        return
      }
      try {
        products[await syncProduct(apiKey, row, existingIds)]++
      } catch (e) {
        fail(row, (e as Error).message)
      }
    })

    return json({ categories, products, errors })
  } catch (e) {
    console.error("omnisend-sync-catalog error:", e)
    return json({ error: (e as Error).message }, 500)
  }
})
