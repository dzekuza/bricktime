import { useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"

export interface ProductRating {
  average: number
  count: number
}

const CACHE_MS = 5 * 60 * 1000

// One request serves every card on the page: each card asks the hook, and they
// all share this promise instead of querying per product.
let cache: {
  loadedAt: number
  ratings: Promise<Map<number, ProductRating>>
} | null = null

async function fetchRatings(): Promise<Map<number, ProductRating>> {
  const { data, error } = await supabase
    .from("product_reviews")
    .select("product_id, rating")
    .eq("approved", true)
    .limit(10000)
  if (error) {
    console.error("Product ratings failed:", error.message)
    cache = null
    return new Map()
  }
  const totals = new Map<number, { sum: number; count: number }>()
  for (const row of data ?? []) {
    const entry = totals.get(row.product_id) ?? { sum: 0, count: 0 }
    totals.set(row.product_id, {
      sum: entry.sum + row.rating,
      count: entry.count + 1,
    })
  }
  return new Map(
    [...totals].map(([id, t]) => [
      id,
      { average: t.sum / t.count, count: t.count },
    ])
  )
}

function loadRatings(): Promise<Map<number, ProductRating>> {
  if (!cache || Date.now() - cache.loadedAt > CACHE_MS) {
    cache = { loadedAt: Date.now(), ratings: fetchRatings() }
  }
  return cache.ratings
}

/** Average approved review rating and review count per product id. */
export function useProductRatings(): ReadonlyMap<number, ProductRating> {
  const [ratings, setRatings] = useState<ReadonlyMap<number, ProductRating>>(
    new Map()
  )

  useEffect(() => {
    let isCancelled = false
    void loadRatings().then((loaded) => {
      if (!isCancelled) setRatings(loaded)
    })
    return () => {
      isCancelled = true
    }
  }, [])

  return ratings
}
