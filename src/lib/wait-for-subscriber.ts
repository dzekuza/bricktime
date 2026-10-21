import { supabase } from "@/lib/supabase"

import type { Database } from "@/lib/database.types"

export type SubscriberBilling = Pick<
  Database["public"]["Tables"]["subscribers"]["Row"],
  "plan" | "status" | "penalty_amount" | "penalty_reason" | "home_delivery"
>

const MAX_ATTEMPTS = 15
const INTERVAL_MS = 2000

/**
 * Polls the member's own subscribers row until `isConfirmed` passes.
 * Members can't write billing columns, so after a Stripe redirect the UI waits
 * for the webhook's update instead of trusting URL params. Resolves to null on
 * timeout or abort.
 */
export async function waitForSubscriberBilling(
  userId: string,
  isConfirmed: (row: SubscriberBilling) => boolean,
  signal?: AbortSignal
): Promise<SubscriberBilling | null> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const { data, error } = await supabase
      .from("subscribers")
      .select("plan, status, penalty_amount, penalty_reason, home_delivery")
      .eq("id", userId)
      .maybeSingle()
    if (signal?.aborted) return null
    if (error) {
      console.error("waitForSubscriberBilling: lookup failed", error.message)
    } else if (data && isConfirmed(data)) {
      return data
    }
    await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS))
    if (signal?.aborted) return null
  }
  return null
}
