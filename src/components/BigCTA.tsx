import { useRef, useEffect } from "react"
import { ArrowRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useReveal } from "@/hooks/useReveal"
import gsap from "gsap"

export default function BigCTA() {
  const ref = useReveal<HTMLDivElement>()
  const tileRef = useRef<HTMLDivElement>(null)
  const spanRef = useRef<HTMLSpanElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => {
      if (!containerRef.current) return
      gsap.killTweensOf(containerRef.current.querySelectorAll("*"))
    }
  }, [])

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

  function onEnter() {
    if (reduced) return
    gsap.killTweensOf(spanRef.current)
    gsap.to(spanRef.current, {
      rotate: 4,
      scale: 1.12,
      boxShadow: "8px 8px 0 #001B21",
      duration: 0.22,
      ease: "back.out(2.5)",
    })
  }

  function onLeave() {
    if (reduced) return
    gsap.killTweensOf(spanRef.current)
    gsap.to(spanRef.current, {
      rotate: -2,
      scale: 1,
      boxShadow: "0px 0px 0 #001B21",
      duration: 0.28,
      ease: "elastic.out(1, 0.55)",
    })
  }

  return (
    <section ref={containerRef} className="bg-paper py-10 md:py-20">
      <div className="mx-auto max-w-[1320px] px-4 md:px-7">
        <div ref={ref} className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Urgency copy — col-span-7 */}
          <div
            ref={tileRef}
            className="reveal brick-card flex min-h-[340px] flex-col justify-between p-10 lg:col-span-7"
            style={{ background: "#FB4903" }}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
          >
            <h3 className="label-mono tracking-[.24em] text-paper/70">
              ⬢ Katalogas
            </h3>
            <div>
              <h2 className="heading-display text-d-hero leading-[.86] tracking-[-0.015em] text-paper">
                Šimtai
                <br />
                produktų.{" "}
                <span
                  ref={spanRef}
                  className="inline-block border-[3px] border-ink bg-brand-yellow px-[.15em] text-ink"
                  style={{
                    transform: "rotate(-2deg)",
                    transformOrigin: "center",
                  }}
                >
                  Vienas
                </span>
                <br />
                biudžetas.
              </h2>
            </div>
            <p className="mt-4 max-w-[44ch] text-[16px] leading-[1.65] text-paper/80">
              Pasirink planą ir naršyk katalogą jau šiandien. Grąžink bet kada —
              be papildomų mokesčių.
            </p>
          </div>

          {/* CTA actions — col-span-5 */}
          <div
            className="reveal flex min-h-[340px] flex-col justify-between rounded-2xl border-2 border-ink p-10 shadow-[6px_6px_0_rgba(245,241,235,.08)] md:rounded-3xl lg:col-span-5"
            style={{ background: "#001B21" }}
          >
            <div>
              <p className="mb-4 font-mono text-[10px] tracking-[.22em] text-paper/50 uppercase">
                Užsitikrink vietą
              </p>
              <div className="text-d-md font-display leading-[.9] text-paper">
                <div className="mb-1 flex items-baseline gap-2">
                  <span className="text-brand-yellow">Builder</span>
                  <span className="text-2xl text-paper/40">—</span>
                  <span>$14/mėn.</span>
                </div>
                <div className="mb-1 flex items-baseline gap-2">
                  <span className="text-brand-yellow">Advanced</span>
                  <span className="text-2xl text-paper/40">—</span>
                  <span>$24/mėn.</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-brand-yellow">Legend</span>
                  <span className="text-2xl text-paper/40">—</span>
                  <span>$42/mėn.</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Button
                asChild
                size="lg"
                className="w-full rounded-full border-2 border-paper/30 bg-brand-yellow text-[16px] font-bold text-ink transition-[transform,box-shadow] duration-150 ease-out hover:-translate-x-[3px] hover:-translate-y-[3px] hover:bg-brand-yellow hover:text-ink hover:shadow-[6px_6px_0_rgba(245,241,235,.2)] active:translate-x-0 active:translate-y-0 active:scale-[0.97] active:shadow-none"
              >
                <a href="#plans">
                  Pradėti prenumeratą <ArrowRightIcon data-icon="inline-end" />
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full rounded-full border-2 border-paper/30 bg-transparent text-[15px] font-semibold text-paper transition-[transform,box-shadow] duration-150 ease-out hover:-translate-x-[3px] hover:-translate-y-[3px] hover:bg-transparent hover:text-paper hover:shadow-[6px_6px_0_rgba(245,241,235,.15)] active:translate-x-0 active:translate-y-0 active:scale-[0.97] active:shadow-none"
              >
                <a href="/drop">Peržiūrėti produktą № 26</a>
              </Button>
              <p className="mt-1 text-center font-mono text-[10px] tracking-[.1em] text-paper/35 uppercase">
                Atšauk bet kada · Nemokamas pristatymas
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
