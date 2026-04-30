import { useRef } from 'react'
import { ArrowRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useReveal } from '@/hooks/useReveal'
import gsap from 'gsap'

export default function BigCTA() {
  const ref = useReveal<HTMLDivElement>()
  const tileRef = useRef<HTMLDivElement>(null)
  const spanRef = useRef<HTMLSpanElement>(null)

  function onEnter() {
    gsap.killTweensOf(spanRef.current)
    gsap.to(spanRef.current, {
      rotate: 4,
      scale: 1.12,
      boxShadow: '8px 8px 0 #001B21',
      duration: 0.22,
      ease: 'back.out(2.5)',
    })
  }

  function onLeave() {
    gsap.killTweensOf(spanRef.current)
    gsap.to(spanRef.current, {
      rotate: -2,
      scale: 1,
      boxShadow: '0px 0px 0 #001B21',
      duration: 0.28,
      ease: 'elastic.out(1, 0.55)',
    })
  }

  return (
    <section className="bg-paper py-20">
      <div className="mx-auto max-w-[1320px] px-7">
        <div ref={ref} className="grid grid-cols-1 gap-4 lg:grid-cols-12">

          {/* Urgency copy — col-span-7 */}
          <div
            ref={tileRef}
            className="reveal flex flex-col justify-between rounded-3xl border-2 border-ink p-10 shadow-[6px_6px_0_#001B21] lg:col-span-7"
            style={{ background: '#FB4903', minHeight: 340 }}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
          >
            <p className="font-mono text-[11px] tracking-[.24em] uppercase text-paper/70">⬢ Paskutinė galimybė</p>
            <div>
              <h2
                className="uppercase text-paper"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(52px, 6vw, 96px)',
                  lineHeight: '.86',
                  letterSpacing: '-.015em',
                }}
              >
                Produktas № 26
                <br />
                išsiunčiamas po{' '}
                <span
                  ref={spanRef}
                  className="inline-block border-[3px] border-ink bg-brand-yellow px-[.15em] text-ink"
                  style={{ transform: 'rotate(-2deg)', transformOrigin: 'center' }}
                >
                  12 dienų
                </span>
              </h2>
            </div>
            <p className="mt-4 max-w-[44ch] text-[16px] leading-[1.65] text-paper/80">
              Prenumeruok iki gegužės 1 d. ir gauk kitą produktą. Po to — laukiamajame sąraše.
            </p>
          </div>

          {/* CTA actions — col-span-5 */}
          <div
            className="reveal flex flex-col justify-between rounded-3xl border-2 border-ink p-10 shadow-[6px_6px_0_rgba(245,241,235,.08)] lg:col-span-5"
            style={{ background: '#001B21', minHeight: 340 }}
          >
            <div>
              <p className="font-mono text-[10px] tracking-[.22em] uppercase text-paper/50 mb-4">
                Užsitikrink vietą
              </p>
              <div
                className="text-paper"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(28px, 3vw, 48px)',
                  lineHeight: '.9',
                }}
              >
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-brand-yellow">Mini</span>
                  <span className="text-paper/40 text-2xl">—</span>
                  <span>$14/mėn.</span>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-brand-yellow">Standard</span>
                  <span className="text-paper/40 text-2xl">—</span>
                  <span>$24/mėn.</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-brand-yellow">Mega</span>
                  <span className="text-paper/40 text-2xl">—</span>
                  <span>$42/mėn.</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-6">
              <Button
                asChild
                size="lg"
                className="w-full rounded-full border-2 border-paper/30 bg-brand-yellow text-ink font-bold text-[16px] hover:bg-brand-yellow hover:text-ink hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[6px_6px_0_rgba(245,241,235,.2)] transition-all"
              >
                <a href="#plans">Pradėti prenumeratą <ArrowRightIcon data-icon="inline-end" /></a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full rounded-full border-2 border-paper/30 bg-transparent text-paper text-[15px] font-semibold hover:bg-transparent hover:text-paper hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[6px_6px_0_rgba(245,241,235,.15)] transition-all"
              >
                <a href="/drop">Peržiūrėti produktą № 26</a>
              </Button>
              <p className="text-center font-mono text-[10px] tracking-[.1em] uppercase text-paper/35 mt-1">
                Atšauk bet kada · Nemokamas pristatymas
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
