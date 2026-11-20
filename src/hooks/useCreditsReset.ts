import { useCallback, useEffect, useState } from "react"

import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"

export interface CreditsResetState {
  /** When the current billing window ends and credits come back. */
  windowEnd: string | null
  /** Credits of sets already returned this window, back at the next reset. */
  pendingCredits: number
  /** Re-reads the window, e.g. right after the countdown ran out. */
  reload: () => void
}

/** The next credit reset and what it will give back. Fails quiet: no notice is better than a wrong one. */
export function useCreditsReset(): CreditsResetState {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [windowEnd, setWindowEnd] = useState<string | null>(null)
  const [pendingCredits, setPendingCredits] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!userId) return
    let isCancelled = false
    void Promise.all([
      supabase.rpc("billing_window", { p_subscriber_id: userId }),
      supabase.rpc("credits_pending_reset", { p_subscriber_id: userId }),
    ]).then(([windowResult, pendingResult]) => {
      if (isCancelled) return
      setWindowEnd(
        windowResult.error ? null : (windowResult.data?.[0]?.window_end ?? null)
      )
      setPendingCredits(
        pendingResult.error ? 0 : Number(pendingResult.data ?? 0)
      )
    })
    return () => {
      isCancelled = true
    }
  }, [userId, reloadKey])

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  return { windowEnd, pendingCredits, reload }
}
