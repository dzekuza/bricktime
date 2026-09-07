import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { SERIES } from "@/lib/series"

/**
 * Theme names for the catalogue filter, managed by admin in Content → Temos.
 *
 * Falls back to the SERIES constant until the request resolves, and if it
 * fails: an empty filter list would silently hide the theme picker entirely,
 * which is worse than briefly showing the previous hardcoded set.
 */
export function useCategories(): string[] {
  const [names, setNames] = useState<string[]>(() => [...SERIES])

  useEffect(() => {
    supabase
      .from("product_categories")
      .select("name")
      .eq("active", true)
      .order("sort_order")
      .then(({ data }) => {
        if (data && data.length > 0) setNames(data.map((c) => c.name))
      })
  }, [])

  return names
}
