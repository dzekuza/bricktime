import { useCallback, useEffect, useState } from "react"

import { useAuth } from "@/hooks/useAuth"
import type { LpTerminal } from "@/lib/lpexpress"
import { supabase } from "@/lib/supabase"

type Owned = { ownerId: string | null; terminal: LpTerminal | null }

/**
 * Terminal state for merch and rental delivery, prefilled with the terminal
 * the member already uses: the one saved on their subscription, else the one
 * from their latest rental. A terminal the shopper picks wins over it. The
 * value is tied to the member who set it, so a logout or account switch never
 * carries one member's terminal over to the next.
 */
export function useSavedTerminal() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [state, setState] = useState<Owned>({ ownerId: null, terminal: null })

  useEffect(() => {
    if (!userId) return
    let isCancelled = false

    async function load() {
      const { data: subscriber } = await supabase
        .from("subscribers")
        .select("lp_terminal_id, lp_terminal_name")
        .eq("id", userId as string)
        .maybeSingle()
      let id = subscriber?.lp_terminal_id
      let name = subscriber?.lp_terminal_name

      if (!id || !name) {
        const { data: order } = await supabase
          .from("orders")
          .select("lp_terminal_id, lp_terminal_name")
          .eq("subscriber_id", userId as string)
          .not("lp_terminal_id", "is", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
        id = order?.lp_terminal_id
        name = order?.lp_terminal_name
      }
      if (isCancelled || !id || !name) return

      const saved: LpTerminal = {
        id,
        name,
        city: "",
        address: "",
        postalCode: "",
      }
      setState((prev) =>
        prev.ownerId === userId && prev.terminal
          ? prev
          : { ownerId: userId, terminal: saved }
      )
    }
    void load()

    return () => {
      isCancelled = true
    }
  }, [userId])

  const terminal = state.ownerId === userId ? state.terminal : null
  const setTerminal = useCallback(
    (next: LpTerminal | null) => setState({ ownerId: userId, terminal: next }),
    [userId]
  )

  return [terminal, setTerminal] as const
}
