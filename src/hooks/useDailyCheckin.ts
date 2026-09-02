import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"

export type DailyCheckinStatus = "anonymous" | "pending" | "checkedIn" | "error"

export interface DailyCheckin {
  status: DailyCheckinStatus
  error: string | null
  /** Bumps once the day's check-in has landed, so points/progress can refetch. */
  version: number
}

// The DB trigger enforce_checkin_once_per_day() raises this when a second
// check-in races in for the same day (two tabs, a reload mid-insert). That's
// the desired end state, not a failure to report.
const ALREADY_CHECKED_IN = "already checked in today"

function startOfTodayUtc(): string {
  const start = new Date()
  start.setUTCHours(0, 0, 0, 0)
  return start.toISOString()
}

/**
 * Marks the member present for today. The `daily_checkin` achievement is
 * described as "visit the page any day", so visiting is what should award it —
 * it used to sit behind a button nobody pressed.
 */
export function useDailyCheckin(): DailyCheckin {
  const { user } = useAuth()
  const [status, setStatus] = useState<DailyCheckinStatus>("anonymous")
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!user) {
      setStatus("anonymous")
      setError(null)
      return
    }

    let cancelled = false
    setStatus("pending")
    setError(null)

    async function run(userId: string) {
      const { count, error: countError } = await supabase
        .from("feed_items")
        .select("id", { count: "exact", head: true })
        .eq("subscriber_id", userId)
        .eq("type", "checkin")
        .gte("created_at", startOfTodayUtc())
      if (cancelled) return
      if (countError) {
        setError(countError.message)
        setStatus("error")
        return
      }

      if ((count ?? 0) === 0) {
        const { error: insertError } = await supabase
          .from("feed_items")
          .insert({ subscriber_id: userId, type: "checkin" })
        if (cancelled) return
        if (insertError && !insertError.message.includes(ALREADY_CHECKED_IN)) {
          setError(insertError.message)
          setStatus("error")
          return
        }
      }

      // Time-based metrics (membership_days) have no insert to hang a trigger
      // off, so nothing would ever unlock them without this call. Best-effort:
      // the check-in above already stands on its own, so a failure here must
      // not report the visit as unmarked.
      const { error: rpcError } = await supabase.rpc("refresh_my_achievements")
      if (cancelled) return
      if (rpcError) {
        console.error("refresh_my_achievements failed", rpcError.message)
      }

      setStatus("checkedIn")
      setVersion((v) => v + 1)
    }

    run(user.id)

    return () => {
      cancelled = true
    }
  }, [user])

  return { status, error, version }
}
