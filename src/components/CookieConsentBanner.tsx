import { useEffect } from "react"
import { useLocation } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { useConsentContext } from "@/contexts/ConsentContext"

// The privacy policy stays readable while the choice is pending, so the page
// is only locked elsewhere.
const READABLE_PATH = "/privatumo-politika"

export default function CookieConsentBanner() {
  const { hasResponded, acceptAll, necessaryOnly } = useConsentContext()
  const { pathname } = useLocation()
  const isBlocking = !hasResponded && pathname !== READABLE_PATH

  useEffect(() => {
    if (!isBlocking) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [isBlocking])

  if (hasResponded) return null

  return (
    <div
      role="dialog"
      aria-modal={isBlocking}
      aria-label="Slapukų nustatymai"
      className={
        isBlocking
          ? "fixed inset-0 z-[60] flex items-end bg-ink/60 px-4 pb-4 backdrop-blur-[2px] md:px-6 md:pb-6"
          : "fixed inset-x-0 bottom-0 z-[60] px-4 pb-4 md:px-6 md:pb-6"
      }
    >
      <div className="brick-card mx-auto flex w-full max-w-[900px] flex-col gap-4 bg-paper p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div className="max-w-[56ch]">
          <p className="label-mono mb-1 text-ink/60">Slapukai</p>
          <p className="text-[14px] leading-[1.5] text-ink/80">
            Naudojame būtinuosius slapukus svetainės veikimui bei, jums sutikus,
            analitinius slapukus (Google Analytics, Meta Pixel). Daugiau —{" "}
            <a
              href="/privatumo-politika"
              className="font-bold text-ink underline underline-offset-4"
            >
              privatumo politikoje
            </a>
            .
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          <Button
            variant="outline"
            className="brick-hover-sm"
            onClick={necessaryOnly}
          >
            Tik būtinieji
          </Button>
          <Button
            className="brick-hover-sm bg-brand-yellow text-ink hover:bg-brand-yellow"
            onClick={acceptAll}
          >
            Priimti visus
          </Button>
        </div>
      </div>
    </div>
  )
}
