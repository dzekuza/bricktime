import { useEffect, useState } from "react"

const TICK_MS = 1000

/** Live "18d 34min 10s" countdown to `endsAt`; null when there is no end or it has passed. */
export function useBillingCountdown(endsAt: string | null): string | null {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!endsAt) return
    const timer = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => clearInterval(timer)
  }, [endsAt])

  if (!endsAt) return null
  const remaining = new Date(endsAt).getTime() - now
  if (remaining <= 0) return null

  const totalSeconds = Math.floor(remaining / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const minutes = Math.floor((totalSeconds % 86400) / 60)
  const seconds = totalSeconds % 60
  return `${days}d ${minutes}min ${seconds}s`
}
