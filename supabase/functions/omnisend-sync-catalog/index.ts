import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { omnisendFetch } from "../_shared/omnisend.ts"
import {
  toCategories,
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
  "id, title, subtitle, description, category, image_url, gallery, price, value, stock, status, created_at, updated_at"

async function runInBatches<T>(items: T[], task: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    await Promise.all(items.slice(i, i + CONCURRENCY).map(task))
  }
}

async function syncCategories(apiKey: string, rows: CatalogProductRow[]) {
  const res = await omnisendFetch(apiKey, "/product-categories?limit=100")
  if (!res.ok) {
    throw new Error(`Listing categories failed: ${res.status} ${await res.text()}`)
  }
  const { categories: existing = [] } = (await res.json()) as {
    categories?: Array<{ categoryID: string; title: string }>
  }
  const existingById = new Map(existing.map((c) => [c.categoryID, c.title]))

  const summary = { created: 0, updated: 0, failed: 0 }
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
      console.error(`Category ${categoryID} failed: ${result.status} ${await result.text()}`)
      return
    }
    summary[isNew ? "created" : "updated"]++
  })
  return summary
}

// PUT replaces a product but answers 404 for one Omnisend has not seen yet,
// so a missing product is created instead.
async function syncProduct(apiKey: string, row: CatalogProductRow) {
  const product = toOmnisendProduct(row)
  const put = await omnisendFetch(apiKey, `/products/${product.id}`, {
    method: "PUT",
    body: { ...product, productID: product.id },
  })
  if (put.ok) return "updated" as const
  if (put.status !== 404) {
    throw new Error(`PUT ${put.status} ${await put.text()}`)
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

    const { data, error } = await service
      .from("products")
      .select(PRODUCT_COLUMNS)
      .order("id")
    if (error) throw new Error(`Loading products failed: ${error.message}`)
    const rows = (data ?? []) as CatalogProductRow[]

    const categories = await syncCategories(apiKey, rows)

    const products = { created: 0, updated: 0, failed: 0 }
    const errors: string[] = []
    await runInBatches(rows, async (row) => {
      try {
        products[await syncProduct(apiKey, row)]++
      } catch (e) {
        products.failed++
        if (errors.length < MAX_ERRORS_REPORTED) {
          errors.push(`#${row.id}: ${(e as Error).message}`)
        }
      }
    })

    return json({ categories, products, errors })
  } catch (e) {
    console.error("omnisend-sync-catalog error:", e)
    return json({ error: (e as Error).message }, 500)
  }
})
