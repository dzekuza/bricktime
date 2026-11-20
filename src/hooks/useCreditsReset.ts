import { useCallback, useEffect, useState } from "react"

import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"

// While the stored window end is in the past the renewal webhook has not rolled
// the period over yet, so ask again until it has.
const STALE_WINDOW_RETRY_MS = 15_000

export interface CreditsResetState {
  /** False until the window and the pending credits have loaded without error. */
  isReady: boolean
  /** When the current billing window ends and credits come back. */
  windowEnd: string | null
  /** Credits of sets already returned this window, back at the next reset. */
  pendingCredits: number
  /** Re-reads the window, e.g. right after the countdown ran out. */
  reload: () => void
}

/** The next credit reset and what it will give back. Not ready on any error: no notice beats a wrong one. */
export function useCreditsReset(): CreditsResetState {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [isReady, setIsReady] = useState(false)
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
      if (windowResult.error || pendingResult.error) {
        setIsReady(false)
        return
      }
      setWindowEnd(windowResult.data?.[0]?.window_end ?? null)
      setPendingCredits(Number(pendingResult.data ?? 0))
      setIsReady(true)
    })
    return () => {
      isCancelled = true
    }
  }, [userId, reloadKey])

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    if (!windowEnd || new Date(windowEnd).getTime() > Date.now()) return
    const timer = setTimeout(reload, STALE_WINDOW_RETRY_MS)
    return () => clearTimeout(timer)
  }, [windowEnd, reloadKey, reload])

  return { isReady, windowEnd, pendingCredits, reload }
}
