import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ArrowRightIcon } from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'
import FloatDrop from '@/components/FloatDrop'


const features = [
  {
    num: '01',
    title: 'Nemokamas pristatymas',
    body: 'Visi LEGO® rinkiniai pristatomi į paštomatą nemokamai visoje Lietuvoje.',
  },
  {
    num: '02',
    title: 'Keisk rinkinius bet kada',
    body: 'Surink, grąžink ir išsirink naują rinkinį kada panorėjęs — be papildomų mokesčių.',
  },
  {
    num: '03',
    title: 'Jokių ilgalaikių įsipareigojimų',
    body: 'Pakeisk planą, pristabdyk prenumeratą arba atšauk ją bet kuriuo metu.',
  },
  {
    num: '04',
    title: '30 dienų garantija',
    body: 'Jeigu rinkinys neatitiko lūkesčių — padėsime jį pakeisti kitu.',
  },
  {
    num: '05',
    title: 'Nauji rinkiniai kas mėnesį',
    body: 'Atrask naujus LEGO® modelius ir gauk ankstyvą prieigą prie naujų papildymų.',
  },
]

function onCardEnter(e: React.MouseEvent<HTMLDivElement>) {
  gsap.killTweensOf(e.currentTarget.querySelector('.card-num'))
  gsap.to(e.currentTarget.querySelector('.card-num'), {
    rotate: 14, scale: 1.18, duration: 0.22, ease: 'back.out(2.5)',
  })
}
function onCardLeave(e: React.MouseEvent<HTMLDivElement>) {
  gsap.killTweensOf(e.currentTarget.querySelector('.card-num'))
  gsap.to(e.currentTarget.querySelector('.card-num'), {
    rotate: 0, scale: 1, duration: 0.32, ease: 'elastic.out(1, 0.55)',
  })
}

export default function WhatsInside() {
  const spanRef = useRef<HTMLSpanElement>(null)

  function onSpanEnter() {
    gsap.killTweensOf(spanRef.current)
    gsap.to(spanRef.current, { rotate: 4, scale: 1.12, boxShadow: '8px 8px 0 #001B21', duration: 0.22, ease: 'back.out(2.5)' })
  }
  function onSpanLeave() {
    gsap.killTweensOf(spanRef.current)
    gsap.to(spanRef.current, { rotate: -1.5, scale: 1, boxShadow: '0px 0px 0 #001B21', duration: 0.28, ease: 'elastic.out(1, 0.55)' })
  }

  const ref = useReveal<HTMLDivElement>()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => {
      if (!containerRef.current) return
      gsap.killTweensOf(containerRef.current.querySelectorAll('*'))
    }
  }, [])


  return (
    <section ref={containerRef} className="relative bg-paper py-10 md:py-20">
      <div className="relative z-10 mx-auto max-w-[1320px] px-4 md:px-7">
        <div ref={ref} className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-20">

          {/* Left — sticky headline */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="reveal">
            <h2
              className="heading-display text-d-lg tracking-[-0.015em] mt-4 text-ink"
            >
              Prenumerata
              <br />
              <span
                ref={spanRef}
                className="inline-block rotate-[-1.5deg] border-[3px] border-ink bg-brand-yellow px-[.12em] text-ink shadow-[5px_5px_0_rgba(0,27,33,.12)]"
                style={{ transformOrigin: 'center' }}
                onMouseEnter={onSpanEnter}
                onMouseLeave={onSpanLeave}
              >
                be rizikos.
              </span>
            </h2>
            <p className="mt-6 max-w-[40ch] text-[17px] leading-[1.65] text-ink/65">
              Lanksti LEGO® rinkinių prenumerata su nemokamu pristatymu ir galimybe keisti rinkinius kada tik panorėjus. Statyk daugiau, sutaupyk ir nebeleisk rinkiniams dulkėti lentynose.
            </p>
            <a
              href="/subscribe"
              className="mt-8 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-ink px-7 py-3.5 font-bold text-[15px] text-paper brick-hover-sm"
            >
              Pradėti prenumeratą <ArrowRightIcon className="size-4" />
            </a>

            {/* Lifestyle photo */}
            <div className="brick-card mt-8 h-[260px] overflow-hidden">
              <img
                src="/images/build-cactus.jpg"
                alt="Statytojas dedantis paskutinę detalę"
                className="h-full w-full object-cover"
                style={{ objectPosition: 'center 35%' }}
              />
            </div>
            </div>
          </div>

          {/* Right — scrollable stacked cards */}
          <div>
          <FloatDrop className="flex flex-col gap-4" stagger={0.15} floatDuration={0.8}>
            {features.map((f, i) => (
              <div
                key={f.num}
                className="brick-card brick-card-hover relative flex gap-6 p-6 md:p-8 overflow-hidden bg-paper"
                style={{ transitionDelay: `${i * 60}ms` }}
                onMouseEnter={onCardEnter}
                onMouseLeave={onCardLeave}
              >
                <div className="font-display text-ink/10 select-none leading-[.8] absolute top-2 right-4 text-d-hero">
                  {f.num}
                </div>
                <div className="pt-1 max-w-[80%]">
                  <h3
                    className="heading-display text-d-xs text-ink"
                  >
                    {f.title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-[1.65] text-ink/65">{f.body}</p>
                </div>
              </div>
            ))}
          </FloatDrop>
          </div>
        </div>
      </div>
    </section>
  )
}
