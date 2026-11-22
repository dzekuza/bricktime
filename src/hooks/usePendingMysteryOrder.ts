import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"

import { useAuth } from "@/hooks/useAuth"
import { isMysteryPlan, ORDERS_CHANGED_EVENT } from "@/lib/mystery-box"
import { supabase } from "@/lib/supabase"

/**
 * True while an active Mystery Box subscriber has not placed their order yet:
 * the same rule the Užsakymai card uses to enable "Užsakyti Mystery Box"
 * (no box held, none requested in the current billing window).
 */
export function usePendingMysteryOrder(): boolean {
  const { user, profile } = useAuth()
  const { pathname } = useLocation()
  const [isPending, setIsPending] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const userId = user?.id
  const isMysterySubscriber =
    !!userId && isMysteryPlan(profile?.plan) && profile?.status === "active"

  useEffect(() => {
    const reload = () => setReloadKey((k) => k + 1)
    window.addEventListener(ORDERS_CHANGED_EVENT, reload)
    return () => window.removeEventListener(ORDERS_CHANGED_EVENT, reload)
  }, [])

  useEffect(() => {
    if (!userId || !isMysterySubscriber) {
      setIsPending(false)
      return
    }
    let isCancelled = false
    void Promise.all([
      supabase.rpc("billing_window", { p_subscriber_id: userId }),
      supabase
        .from("orders")
        .select("created_at, status")
        .eq("subscriber_id", userId)
        .eq("is_mystery", true),
    ]).then(([windowRes, ordersRes]) => {
      if (isCancelled) return
      // A failed lookup must not nag the member with a bar that may be wrong.
      if (windowRes.error || ordersRes.error) {
        setIsPending(false)
        return
      }
      const row = windowRes.data?.[0]
      const windowStart = row?.window_start ?? null
      const windowEnd = row?.window_end ?? null
      const orders = ordersRes.data ?? []
      const holdsBox = orders.some((o) => o.status !== "returned")
      const usedThisPeriod =
        windowStart !== null &&
        orders.some((o) => new Date(o.created_at) >= new Date(windowStart))
      const isWindowElapsed =
        usedThisPeriod &&
        windowEnd !== null &&
        new Date(windowEnd).getTime() <= Date.now()
      setIsPending(
        windowStart !== null &&
          !holdsBox &&
          (!usedThisPeriod || isWindowElapsed)
      )
    })
    return () => {
      isCancelled = true
    }
  }, [userId, isMysterySubscriber, pathname, reloadKey])

  return isPending
}
