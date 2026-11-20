import { useEffect } from "react"

import { useBillingCountdown } from "@/hooks/useBillingCountdown"
import { useCreditsReset } from "@/hooks/useCreditsReset"

interface CreditsResetNoticeProps {
  /** The page's own used-credits value, so the notice doesn't fetch it again. */
  usedCredits: number
  className?: string
}

/**
 * When the member's credits come back. Credits return at the next charge:
 * while sets are waiting for that, a countdown; once it has run out, what
 * still holds credits (sets not returned yet). Renders nothing otherwise.
 */
export function CreditsResetNotice({
  usedCredits,
  className,
}: CreditsResetNoticeProps) {
  const { isReady, windowEnd, pendingCredits, reload } = useCreditsReset()
  const countdown = useBillingCountdown(pendingCredits > 0 ? windowEnd : null)

  // The billing window rolls over at the charge; pick up the new one.
  const isCountdownOver =
    pendingCredits > 0 && windowEnd !== null && countdown === null
  useEffect(() => {
    if (isCountdownOver) reload()
  }, [isCountdownOver, reload])

  if (!isReady) return null
  const heldCredits = Math.max(0, usedCredits - pendingCredits)
  const text =
    pendingCredits > 0 && countdown
      ? `Kreditai atsistatys po ${countdown}.`
      : heldCredits > 0
        ? "Kreditai bus atstatyti, kai grąžinsite aktyvius rinkinius."
        : null
  if (!text) return null
  return <p className={className}>{text}</p>
}
