import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { loadGoogleAnalytics, loadMetaPixel } from "@/lib/analytics"

const CONSENT_COOKIE = "bricktime_cookie_consent"
const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365

type ConsentValue = "all" | "necessary"

interface ConsentContextValue {
  hasResponded: boolean
  analyticsGranted: boolean
  acceptAll: () => void
  necessaryOnly: () => void
}

const ConsentContext = createContext<ConsentContextValue | null>(null)

function readConsentCookie(): ConsentValue | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${CONSENT_COOKIE}=([^;]*)`)
  )
  const value = match?.[1]
  return value === "all" || value === "necessary" ? value : null
}

function writeConsentCookie(value: ConsentValue) {
  document.cookie = `${CONSENT_COOKIE}=${value}; max-age=${CONSENT_MAX_AGE_SECONDS}; path=/; SameSite=Lax`
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentValue | null>(null)

  useEffect(() => {
    setConsent(readConsentCookie())
  }, [])

  useEffect(() => {
    if (consent === "all") {
      loadGoogleAnalytics()
      loadMetaPixel()
    }
  }, [consent])

  function acceptAll() {
    writeConsentCookie("all")
    setConsent("all")
  }

  function necessaryOnly() {
    writeConsentCookie("necessary")
    setConsent("necessary")
  }

  return (
    <ConsentContext.Provider
      value={{
        hasResponded: consent !== null,
        analyticsGranted: consent === "all",
        acceptAll,
        necessaryOnly,
      }}
    >
      {children}
    </ConsentContext.Provider>
  )
}

export function useConsentContext(): ConsentContextValue {
  const ctx = useContext(ConsentContext)
  if (!ctx)
    throw new Error("useConsentContext must be used inside ConsentProvider")
  return ctx
}
