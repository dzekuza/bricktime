import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export type PublicStats = {
  active_subscribers: number
  sets_sent: number
  active_sets: number
  average_rating: number | null
  review_count: number
}

// public_stats is a single-row aggregate view. It has to come from the server
// rather than counting client-side, because anon cannot read subscribers.
export function usePublicStats(): PublicStats | null {
  const [stats, setStats] = useState<PublicStats | null>(null)

  useEffect(() => {
    supabase
      .from("public_stats")
      .select("*")
      .single()
      .then(({ data }) => {
        if (data) setStats(data as PublicStats)
      })
  }, [])

  return stats
}
