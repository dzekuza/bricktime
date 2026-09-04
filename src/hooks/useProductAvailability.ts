import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

/**
 * Free copies per product id, from the `product_availability` view (stock minus
 * rentals not yet returned). A product missing from the map has no row yet —
 * treat that as unknown rather than unavailable.
 */
export function useProductAvailability() {
  const [available, setAvailable] = useState<Map<number, number>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from("product_availability")
      .select("product_id, available")
      .then(({ data, error }) => {
        if (error) console.error("Availability fetch failed:", error.message)
        if (data) {
          setAvailable(
            new Map(
              data
                .filter(
                  (row) => row.product_id != null && row.available != null
                )
                .map((row) => [
                  row.product_id as number,
                  row.available as number,
                ])
            )
          )
        }
        setLoading(false)
      })
  }, [])

  return { available, loading }
}
