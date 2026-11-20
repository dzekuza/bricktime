import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

/** Admin switch for the coming-soon gate; null while loading. Fails closed (gate stays on) on any error. */
export function useSiteGateEnabled() {
  const [enabled, setEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "coming_soon_gate")
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) console.error("Gate setting failed to load:", error.message)
        setEnabled(error ? true : data?.value !== false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return enabled
}
