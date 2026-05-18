import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export interface DbPlan {
  id: string
  name: string
  tagline: string | null
  price: number
  annual_price: number | null
  perks: Array<{ label: string; included: boolean }>
  comparison_data: Record<string, string> | null
  featured: boolean
  active: boolean
  sort_order: number
  bg_color: string
  text_color: string
  accent_color: string
  cta_bg: string
  cta_text: string
  brick_image: string | null
  cta_label: string | null
}

export function usePlans() {
  const [plans, setPlans] = useState<DbPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    supabase
      .from("plans")
      .select("*")
      .eq("active", true)
      .order("sort_order")
      .then(({ data, error: err }) => {
        if (err) {
          setError(err.message)
        } else {
          setPlans((data ?? []) as unknown as DbPlan[])
        }
        setLoading(false)
      })
  }, [])

  return { plans, loading, error }
}
