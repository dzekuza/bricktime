import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

// A hung request must resolve to "gate on" rather than leave visitors on a blank page.
const LOAD_TIMEOUT_MS = 5000
const CHECK_INTERVAL_MS = 1000

const GATE_KEY = "coming_soon_gate"
const OPEN_AT_KEY = "store_open_at"

/**
 * Whether the coming-soon gate is on; null while loading. Fails closed (gate stays on) on any error.
 * The gate also lifts by itself once the admin's store open time (the countdown) has passed.
 */
export function useSiteGateEnabled() {
  const [isSwitchOn, setIsSwitchOn] = useState<boolean | null>(null)
  const [openAt, setOpenAt] = useState<number | null>(null)
  const [isOpenTimeReached, setIsOpenTimeReached] = useState(false)

  useEffect(() => {
    let cancelled = false
    supabase
      .from("site_settings")
      .select("key, value")
      .in("key", [GATE_KEY, OPEN_AT_KEY])
      .abortSignal(AbortSignal.timeout(LOAD_TIMEOUT_MS))
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) console.error("Gate setting failed to load:", error.message)
        const rows = data ?? []
        const gate = rows.find((row) => row.key === GATE_KEY)
        const open = rows.find((row) => row.key === OPEN_AT_KEY)
        const openTime =
          typeof open?.value === "string" ? Date.parse(open.value) : NaN
        setOpenAt(Number.isNaN(openTime) ? null : openTime)
        setIsSwitchOn(error ? true : gate?.value !== false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Polled rather than one long timeout: setTimeout overflows past ~25 days.
  useEffect(() => {
    if (openAt === null) return
    const check = () => setIsOpenTimeReached(Date.now() >= openAt)
    check()
    const id = window.setInterval(check, CHECK_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [openAt])

  if (isSwitchOn === null) return null
  return isSwitchOn && !isOpenTimeReached
}
