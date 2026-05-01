import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useReveal } from '@/hooks/useReveal'

const faqs = [
  {
    q: 'Iš ko pagamintos kaladėlės?',
    a: 'Aukštos kokybės ABS plastikas prie pramoninio standarto 1,6 mm tolerancijos. Visiškai suderinamos su bet kokios suderinamos markės kaladėlėmis — užsispaudžia, laiko ir išsiskiria švariai.',
  },
  {
    q: 'Kaip veikia mėnesinis biudžetas?',
    a: 'Kiekvienas planas suteikia fiksuotą € biudžetą. Galite turėti kelis produktus vienu metu — kol bendra vertė neviršija biudžeto. Biudžetas atsinaujina kas mėnesį.',
  },
  {
    q: 'Ar produktai skiriasi pagal planą?',
    a: 'Taip. Kai kurie produktai prieinami tik aukštesnio lygio prenumeratoriams. Nano ir Mini planai suteikia prieigą prie bazinio katalogo, Standard+ atveria išskirtinius produktus.',
  },
  {
    q: 'Kur pristatote?',
    a: 'Visame pasaulyje. Nemokamas standartinis pristatymas ES, JK ir JAV. Skubus lygis pristato per 2 darbo dienas.',
  },
  {
    q: 'Kaip grąžinti produktą?',
    a: 'Iš paskyros skydelio užsakyk nemokamą grąžinimo etiketę, supakuok produktą ir išsiųsk. Kai tik grąžinimas patvirtinamas — biudžetas atsinaujina ir gali rinktis naujus produktus.',
  },
]

const stats = [
  { value: '12 400+', label: 'Aktyvūs prenumeratoriai' },
  { value: '★ 4.9', label: 'Vidutinis įvertinimas' },
  { value: '26', label: 'Išsiųstų produktų' },
  { value: '0', label: 'Klausimų be atsakymo' },
]

export default function FAQ() {
  const ref = useReveal<HTMLDivElement>()
  const zeroRiskRef = useRef<HTMLSpanElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => {
      if (!containerRef.current) return
      gsap.killTweensOf(containerRef.current.querySelectorAll('*'))
    }
  }, [])

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  function onCtaEnter() {
    if (reduced) return
    gsap.killTweensOf(zeroRiskRef.current)
    gsap.to(zeroRiskRef.current, { rotate: 3, scale: 1.1, duration: 0.2, ease: 'back.out(2.5)' })
  }
  function onCtaLeave() {
    if (reduced) return
    gsap.killTweensOf(zeroRiskRef.current)
    gsap.to(zeroRiskRef.current, { rotate: -1.5, scale: 1, duration: 0.28, ease: 'elastic.out(1, 0.55)' })
  }

  return (
    <section id="faq" ref={containerRef} className="bg-paper py-10 md:py-20">
      <div className="mx-auto max-w-[1320px] px-4 md:px-7">
        <div ref={ref} className="grid grid-cols-1 gap-4 lg:grid-cols-12">

          {/* FAQ accordion — col-span-7, row-span-2 */}
          <div
            className="reveal brick-card bg-paper p-6 md:p-9 lg:col-span-7 lg:row-span-2"
          >
            <h2 className="mt-3 heading-display text-d-lg text-ink">
              <span
                className="inline-block border-[3px] border-ink bg-brand-yellow px-[.12em] text-ink shadow-[5px_5px_0_rgba(0,27,33,.12)]"
                style={{ transform: 'rotate(-1.5deg)' }}
              >
                Greiti
              </span>
              <br />
              klausimai.
            </h2>

            <Accordion type="single" collapsible defaultValue="item-0" className="mt-6">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="py-0.5">
                  <AccordionTrigger
                    className="text-[16px] font-bold leading-snug py-4 text-left hover:no-underline"
                  >
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="max-w-[58ch] pb-4 text-[15px] leading-[1.65] text-ink/70">{faq.a}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Stats tile — col-span-5 */}
          <div
            className="reveal grid grid-cols-2 gap-4 rounded-2xl md:rounded-3xl border-2 border-ink p-6 md:p-8 shadow-[6px_6px_0_rgba(245,241,235,.1)] lg:col-span-5"
            style={{ background: '#001B21' }}
          >
            {stats.map((s, i) => (
              <div key={i} className="flex flex-col justify-between rounded-xl md:rounded-2xl border border-paper/15 p-3 md:p-5 min-h-[100px]">
                <div className="font-display text-d-xs leading-[.9] text-paper">
                  {s.value}
                </div>
                <div className="mt-2 font-mono text-[10px] tracking-[.16em] uppercase text-paper/50">
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* CTA tile — col-span-5, row 2 */}
          <div
            className="reveal flex flex-col justify-between brick-card p-6 md:p-8 lg:col-span-5"
            style={{ background: '#5C4ADE' }}
            onMouseEnter={onCtaEnter}
            onMouseLeave={onCtaLeave}
          >
            <div>
              <p className="font-mono text-[10px] tracking-[.22em] uppercase text-paper/60">Vis dar abejoji?</p>
              <h3 className="mt-3 heading-display text-d-sm leading-[.9] text-paper">
                Pirmas produktas,
                <br />
                <span
                  ref={zeroRiskRef}
                  className="inline-block border-[3px] border-paper/40 bg-brand-yellow px-[.12em] text-ink shadow-[5px_5px_0_rgba(245,241,235,.2)]"
                  style={{ transform: 'rotate(-1.5deg)', transformOrigin: 'center' }}
                >
                  nulinė rizika
                </span>.
              </h3>
              <p className="mt-3 text-[15px] leading-[1.6] text-paper/70">
                Atšauk iki pirmojo sąskaitos datos ir nemokėk nieko. Vis tiek atsiųsime sekimo nuorodą.
              </p>
            </div>
            <a
              href="#plans"
              className="mt-6 inline-flex items-center justify-center rounded-full border-2 border-paper/40 bg-brand-yellow px-6 py-3 text-center font-bold text-[15px] text-ink transition-all hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[6px_6px_0_rgba(0,0,0,.2)]"
            >
              Pasirinkti planą →
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
