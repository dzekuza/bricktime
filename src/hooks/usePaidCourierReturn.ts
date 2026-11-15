import { useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"

const POLL_INTERVAL_MS = 1500
const POLL_ATTEMPTS = 20

export type PaidCourierReturnState = "idle" | "waiting" | "placed" | "missing"

// After the courier fee is paid, stripe-webhook creates the rental. This waits
// for that order to appear so the page can show it as placed. "missing" means
// the webhook hasn't created it in time, or refused it and refunded the fee.
export function usePaidCourierReturn(
  userId: string | undefined,
  sessionId: string | null
): PaidCourierReturnState {
  const [state, setState] = useState<PaidCourierReturnState>("idle")

  useEffect(() => {
    if (!userId || !sessionId) return
    const subscriberId = userId
    const stripeSessionId = sessionId
    let isCancelled = false
    setState("waiting")

    async function poll() {
      for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt++) {
        const { data } = await supabase
          .from("orders")
          .select("id")
          .eq("subscriber_id", subscriberId)
          .eq("stripe_session_id", stripeSessionId)
          .maybeSingle()
        if (isCancelled) return
        if (data) {
          setState("placed")
          return
        }
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
        if (isCancelled) return
      }
      setState("missing")
    }
    void poll()

    return () => {
      isCancelled = true
    }
  }, [userId, sessionId])

  return state
}
