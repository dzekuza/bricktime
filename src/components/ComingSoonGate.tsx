import { useCallback, useLayoutEffect, useRef, type ReactNode } from "react"
import { useSiteAccess } from "@/hooks/useSiteAccess"
import ComingSoon from "@/pages/ComingSoon"

export default function ComingSoonGate({ children }: { children: ReactNode }) {
  const { granted, unlock } = useSiteAccess()
  const wasGranted = useRef(granted)

  const handleUnlock = useCallback(
    (code: string) => {
      const isUnlocked = unlock(code)
      // Close the mobile keyboard first so it can't shift the page after we reset scroll.
      if (isUnlocked && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
      return isUnlocked
    },
    [unlock]
  )

  // Unlocking swaps content without a route change, so App's scroll reset never fires;
  // on phones the gate is usually scrolled down to the code input.
  useLayoutEffect(() => {
    if (granted && !wasGranted.current) window.scrollTo(0, 0)
    wasGranted.current = granted
  }, [granted])

  if (!granted) return <ComingSoon onUnlock={handleUnlock} />

  return <>{children}</>
}
