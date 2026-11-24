import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

const LOAD_TIMEOUT_MS = 5000

/** Launch time the admin set for the coming-soon countdown; null when unset, still loading or failed. */
export function useStoreOpenAt() {
  const [openAt, setOpenAt] = useState<Date | null>(null)

  useEffect(() => {
    let cancelled = false
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "store_open_at")
      .abortSignal(AbortSignal.timeout(LOAD_TIMEOUT_MS))
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error("Store open time failed to load:", error.message)
          return
        }
        const date =
          typeof data?.value === "string" ? new Date(data.value) : null
        setOpenAt(date && !Number.isNaN(date.getTime()) ? date : null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return openAt
}
