import { useRef, useEffect, useState } from "react"
import gsap from "gsap"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useReveal } from "@/hooks/useReveal"
import { Button } from "@/components/ui/button"
import { faqs } from "@/data/faq"

const stats = [
  { value: "12 400+", label: "Aktyvūs prenumeratoriai", yellow: false },
  { value: "4.9", label: "Vidutinis įvertinimas", yellow: true },
  { value: "26", label: "Išsiųstų rinkinių", yellow: false },
  { value: "170", label: "Aktyvių rinkinių", yellow: false },
]

export default function FAQ() {
  const [expanded, setExpanded] = useState(false)
  const ref = useReveal<HTMLDivElement>()
  const zeroRiskRef = useRef<HTMLSpanElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => {
      if (!containerRef.current) return
      gsap.killTweensOf(containerRef.current.querySelectorAll("*"))
    }
  }, [])

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

  function onCtaEnter() {
    if (reduced) return
    gsap.killTweensOf(zeroRiskRef.current)
    gsap.to(zeroRiskRef.current, {
      rotate: 3,
      scale: 1.1,
      duration: 0.2,
      ease: "back.out(2.5)",
    })
  }
  function onCtaLeave() {
    if (reduced) return
    gsap.killTweensOf(zeroRiskRef.current)
    gsap.to(zeroRiskRef.current, {
      rotate: -1.5,
      scale: 1,
      duration: 0.28,
      ease: "elastic.out(1, 0.55)",
    })
  }

  return (
    <section id="faq" ref={containerRef} className="bg-paper py-10 md:py-20">
      <div className="mx-auto max-w-[1320px] px-4 md:px-7">
        <div ref={ref} className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* FAQ accordion — col-span-7, row-span-2 */}
          <div className="reveal brick-card relative bg-paper p-6 md:p-9 lg:col-span-7 lg:row-span-2">
            <img
              src="/faq-mascot.svg"
              alt=""
              className="absolute right-6 top-6 w-[100px] md:w-[128px]"
              aria-hidden="true"
            />
            <h2 className="heading-display text-d-lg mt-3 text-ink">
              <span
                className="inline-block border-[3px] border-ink bg-brand-yellow px-[.12em] text-ink shadow-[5px_5px_0_rgba(0,27,33,.12)]"
                style={{ transform: "rotate(-1.5deg)" }}
              >
                Dažniausi
              </span>
              <br />
              klausimai.
            </h2>

            <Accordion
              type="single"
              collapsible
              defaultValue="item-0"
              className="mt-6"
            >
              {(expanded ? faqs : faqs.slice(0, 8)).map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="py-0.5">
                  <AccordionTrigger className="py-4 text-left text-[16px] leading-snug font-bold hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="max-w-[58ch] pb-4 text-[15px] leading-[1.65] text-ink/70">
                      {faq.a}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <Button
              variant="outline"
              onClick={() => setExpanded((v) => !v)}
              className="mt-4 rounded-full border-2 border-ink bg-paper text-[14px] font-bold text-ink hover:bg-paper hover:text-ink brick-hover-sm"
            >
              {expanded ? "Rodyti mažiau" : "Rodyti daugiau"}
            </Button>
          </div>

          {/* Stats tile — col-span-5 */}
          <div
            className="reveal grid grid-cols-2 gap-4 rounded-2xl border-2 border-ink bg-ink p-6 shadow-[6px_6px_0_rgba(245,241,235,.1)] md:rounded-3xl md:p-8 lg:col-span-5"
          >
            {stats.map((s, i) => (
              <div
                key={i}
                className={`flex md:min-h-[100px] flex-col justify-between rounded-xl p-3 md:rounded-2xl md:p-5 ${
                  s.yellow
                    ? "border-2 border-paper bg-brand-yellow"
                    : "border border-paper/15"
                }`}
              >
                {s.yellow ? (
                  <p className="font-display leading-[.9]">
                    <span className="text-[22px] text-ink">★</span>
                    <span className="text-[36px] md:text-[44px] text-ink">{s.value}</span>
                    <span className="text-[18px] text-ink/50">/5</span>
                  </p>
                ) : (
                  <p className="text-[28px] md:text-d-xs font-display leading-[.9] text-paper">
                    {s.value}
                  </p>
                )}
                <div className={`mt-2 font-mono text-[10px] tracking-[.16em] uppercase ${s.yellow ? "text-ink/50" : "text-paper/50"}`}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* CTA tile — col-span-5, row 2 */}
          <div
            className="reveal brick-card flex flex-col justify-between p-6 md:p-8 lg:col-span-5"
            style={{ background: "#5C4ADE" }}
            onMouseEnter={onCtaEnter}
            onMouseLeave={onCtaLeave}
          >
            <div>
              <p className="font-mono text-[10px] tracking-[.22em] text-paper/60 uppercase">
                Vis dar abejoji?
              </p>
              <h3 className="heading-display text-d-sm mt-3 leading-[.9] text-paper">
                Nebesiribok
                <br />
                <span
                  ref={zeroRiskRef}
                  className="inline-block border-[3px] border-paper/40 bg-brand-yellow px-[.12em] text-ink shadow-[5px_5px_0_rgba(245,241,235,.2)]"
                  style={{
                    transform: "rotate(-1.5deg)",
                    transformOrigin: "center",
                  }}
                >
                  Konstruok!
                </span>
              </h3>
              <p className="mt-3 text-[15px] leading-[1.6] text-paper/70">
                Prisijunk prie Brick Time ir atrask įspūdingiausius LEGO®
                rinkinius be didelių išlaidų.
              </p>
            </div>
            <a
              href="#subscriptions"
              className="mt-6 inline-flex items-center justify-center rounded-full border-2 border-ink bg-brand-yellow px-6 py-3 text-center text-[15px] font-bold text-ink transition-all hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[6px_6px_0_rgba(0,0,0,.2)]"
            >
              Pasirinkti prenumeratą →
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
