import { useEffect, useState } from "react"

import { useAuth } from "@/hooks/useAuth"
import type { LpTerminal } from "@/lib/lpexpress"
import { supabase } from "@/lib/supabase"

/**
 * Terminal state for merch delivery, prefilled with the terminal the member
 * already uses for their rentals. A terminal the shopper picks wins over it.
 */
export function useSavedTerminal() {
  const { user } = useAuth()
  const [terminal, setTerminal] = useState<LpTerminal | null>(null)

  useEffect(() => {
    if (!user) return
    supabase
      .from("subscribers")
      .select("lp_terminal_id, lp_terminal_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data?.lp_terminal_id || !data.lp_terminal_name) return
        const saved: LpTerminal = {
          id: data.lp_terminal_id,
          name: data.lp_terminal_name,
          city: "",
          address: "",
          postalCode: "",
        }
        setTerminal((prev) => prev ?? saved)
      })
  }, [user])

  return [terminal, setTerminal] as const
}
