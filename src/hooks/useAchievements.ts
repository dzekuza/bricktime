import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { AchievementDef } from "@/data/community"

export function useAchievements() {
  const [achievements, setAchievements] = useState<AchievementDef[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from("achievements")
      .select("*")
      .order("points", { ascending: true })
      .then(({ data }) => {
        setAchievements(data ?? [])
        setLoading(false)
      })
  }, [])

  return { achievements, loading }
}
