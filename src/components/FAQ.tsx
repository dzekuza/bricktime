import { useRef, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import gsap from "gsap"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useReveal } from "@/hooks/useReveal"
import { Button } from "@/components/ui/button"
import { HeadingMarkup } from "@/components/HeadingMarkup"
import { faqs as defaultFaqs } from "@/data/faq"
import { supabase } from "@/lib/supabase"

const stats = [
  { value: "12 400+", label: "Aktyvūs prenumeratoriai", yellow: false },
  { value: "4.9", label: "Vidutinis įvertinimas", yellow: true },
  { value: "26", label: "Išsiųstų rinkinių", yellow: false },
  { value: "170", label: "Aktyvių rinkinių", yellow: false },
]

type FAQProps = {
  ctaEyebrow?: string
  ctaHeading?: string
  ctaBody?: string
  ctaLabel?: string
  ctaHref?: string
}

// Used only when the caller doesn't pass a CTA prop AND home_content hasn't
// loaded yet — pages that pass explicit props (e.g. Subscribe) always win.
const DEFAULT_CTA = {
  ctaEyebrow: "Vis dar abejoji?",
  ctaHeading: "Nebesiribok\n==Konstruok!==",
  ctaBody:
    "Prisijunk prie Brick Time ir atrask įspūdingiausius LEGO® rinkinius be didelių išlaidų.",
  ctaLabel: "Pasirinkti prenumeratą →",
  ctaHref: "#subscriptions",
}

export default function FAQ(props: FAQProps) {
  const [expanded, setExpanded] = useState(false)
  const ref = useReveal<HTMLDivElement>()
  const zeroRiskRef = useRef<HTMLSpanElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [faqs, setFaqs] = useState(defaultFaqs)
  const [dbCta, setDbCta] = useState<typeof DEFAULT_CTA | null>(null)

  const cta = {
    ctaEyebrow: props.ctaEyebrow ?? dbCta?.ctaEyebrow ?? DEFAULT_CTA.ctaEyebrow,
    ctaHeading: props.ctaHeading ?? dbCta?.ctaHeading ?? DEFAULT_CTA.ctaHeading,
    ctaBody: props.ctaBody ?? dbCta?.ctaBody ?? DEFAULT_CTA.ctaBody,
    ctaLabel: props.ctaLabel ?? dbCta?.ctaLabel ?? DEFAULT_CTA.ctaLabel,
    ctaHref: props.ctaHref ?? dbCta?.ctaHref ?? DEFAULT_CTA.ctaHref,
  }

  useEffect(() => {
    return () => {
      if (!containerRef.current) return
      gsap.killTweensOf(containerRef.current.querySelectorAll("*"))
    }
  }, [])

  useEffect(() => {
    // Only fetch Home's CTA copy when this instance isn't fully overridden
    // by props — Subscribe always passes its own, so skip the request.
    const ctaKeys: (keyof FAQProps)[] = [
      "ctaEyebrow",
      "ctaHeading",
      "ctaBody",
      "ctaLabel",
      "ctaHref",
    ]
    const needsDbCta = ctaKeys.some((k) => props[k] === undefined)
    if (needsDbCta) {
      supabase
        .from("home_content")
        .select(
          "faq_cta_eyebrow, faq_cta_heading, faq_cta_body, faq_cta_label, faq_cta_href"
        )
        .eq("id", 1)
        .single()
        .then(({ data }) => {
          if (!data) return
          setDbCta({
            ctaEyebrow: data.faq_cta_eyebrow || DEFAULT_CTA.ctaEyebrow,
            ctaHeading: data.faq_cta_heading || DEFAULT_CTA.ctaHeading,
            ctaBody: data.faq_cta_body || DEFAULT_CTA.ctaBody,
            ctaLabel: data.faq_cta_label || DEFAULT_CTA.ctaLabel,
            ctaHref: data.faq_cta_href || DEFAULT_CTA.ctaHref,
          })
        })
    }

    supabase
      .from("faq_items")
      .select("question, answer")
      .order("sort_order")
      .then(({ data }) => {
        if (!data || data.length === 0) return
        setFaqs(data.map((f) => ({ q: f.question, a: f.answer })))
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
              className="absolute top-6 right-6 w-[100px] md:w-[128px]"
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
              className="brick-hover-sm mt-4 rounded-full border-2 border-ink bg-paper text-[14px] font-bold text-ink hover:bg-paper hover:text-ink"
            >
              {expanded ? "Rodyti mažiau" : "Rodyti daugiau"}
            </Button>
          </div>

          {/* Stats tile — col-span-5 */}
          <div className="reveal grid grid-cols-2 gap-4 rounded-2xl border-2 border-ink bg-ink p-6 shadow-[6px_6px_0_rgba(245,241,235,.1)] md:rounded-3xl md:p-8 lg:col-span-5">
            {stats.map((s, i) => (
              <div
                key={i}
                className={`flex flex-col justify-between rounded-xl p-3 md:min-h-[100px] md:rounded-2xl md:p-5 ${
                  s.yellow
                    ? "border-2 border-paper bg-brand-yellow"
                    : "border border-paper/15"
                }`}
              >
                {s.yellow ? (
                  <p className="font-display leading-[.9]">
                    <span className="text-[22px] text-ink">★</span>
                    <span className="text-[36px] text-ink md:text-[44px]">
                      {s.value}
                    </span>
                    <span className="text-[18px] text-ink/50">/5</span>
                  </p>
                ) : (
                  <p className="md:text-d-xs font-display text-[28px] leading-[.9] text-paper">
                    {s.value}
                  </p>
                )}
                <div
                  className={`mt-2 font-mono text-[10px] tracking-[.16em] uppercase ${s.yellow ? "text-ink/50" : "text-paper/50"}`}
                >
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
                {cta.ctaEyebrow}
              </p>
              <h3 className="heading-display text-d-sm mt-3 leading-[.9] text-paper">
                <HeadingMarkup
                  text={cta.ctaHeading}
                  highlightRef={zeroRiskRef}
                  highlightClassName="inline-block border-[3px] border-paper/40 bg-brand-yellow px-[.12em] text-ink shadow-[5px_5px_0_rgba(245,241,235,.2)]"
                  highlightStyle={{
                    transform: "rotate(-1.5deg)",
                    transformOrigin: "center",
                  }}
                />
              </h3>
              <p className="mt-3 text-[15px] leading-[1.6] text-paper/70">
                {cta.ctaBody}
              </p>
            </div>
            {cta.ctaHref.startsWith("#") ? (
              <a
                href={cta.ctaHref}
                className="mt-6 inline-flex items-center justify-center rounded-full border-2 border-ink bg-brand-yellow px-6 py-3 text-center text-[15px] font-bold text-ink transition-all hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[6px_6px_0_rgba(0,0,0,.2)]"
              >
                {cta.ctaLabel}
              </a>
            ) : (
              <Link
                to={cta.ctaHref}
                className="mt-6 inline-flex items-center justify-center rounded-full border-2 border-ink bg-brand-yellow px-6 py-3 text-center text-[15px] font-bold text-ink transition-all hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[6px_6px_0_rgba(0,0,0,.2)]"
              >
                {cta.ctaLabel}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
