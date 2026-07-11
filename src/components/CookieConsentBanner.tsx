import { Button } from "@/components/ui/button"
import { useConsentContext } from "@/contexts/ConsentContext"

export default function CookieConsentBanner() {
  const { hasResponded, acceptAll, necessaryOnly } = useConsentContext()

  if (hasResponded) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 md:px-6 md:pb-6">
      <div className="brick-card mx-auto flex max-w-[900px] flex-col gap-4 bg-paper p-5 md:flex-row md:items-center md:justify-between md:p-6">
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
