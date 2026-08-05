import type { ReactNode } from "react"
import { useSiteAccess } from "@/hooks/useSiteAccess"
import ComingSoon from "@/pages/ComingSoon"

export default function ComingSoonGate({ children }: { children: ReactNode }) {
  const { granted, unlock } = useSiteAccess()

  if (!granted) return <ComingSoon onUnlock={unlock} />

  return <>{children}</>
}
