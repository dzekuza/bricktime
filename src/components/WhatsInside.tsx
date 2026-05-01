import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ArrowRightIcon } from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'
import FloatDrop from '@/components/FloatDrop'

const legoNumImages: Record<string, string> = {
  '01': '/lego-num-1.png',
  '02': '/lego-num-2.png',
  '03': '/lego-num-3.png',
  '04': '/lego-num-4.png',
}

const features = [
  {
    num: '01',
    title: '200–400 aukštos kokybės ABS kaladėlių',
    body: 'Tikslios tolerancijos, ryškios spalvos, visiškai suderinamos su tavo kaladėlėmis.',
    bg: '#FB4903',
  },
  {
    num: '02',
    title: '1–2 išskirtiniai miniukai',
    body: 'Sukurti svečių menininkų. Sunumeruoti, niekada neišleisti pakartotinai, keičiami klube.',
    bg: '#4DA2FF',
  },
  {
    num: '03',
    title: 'Surinkimo kortelė + lipdukų rinkinys',
    body: 'Žingsnis po žingsnio vienoje pusėje, istorija kitoje. Plius 16 vinilo lipdukų per produktą.',
    bg: '#FFD731',
  },
  {
    num: '04',
    title: 'Jungiasi į visatą',
    body: 'Kiekvienas produktas jungiasi. Po 12 mėnesių tu pastatęs visą gatvę.',
    bg: '#5DDB9C',
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
  const floatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const imgs = floatRef.current?.querySelectorAll<HTMLElement>('.lego-num-img')
    if (!imgs?.length) return
    imgs.forEach((el, i) => {
      gsap.to(el, {
        y: -10,
        duration: 2.2,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: i * 0.4,
      })
    })
    return () => { imgs.forEach((el) => gsap.killTweensOf(el)) }
  }, [])

  return (
    <section className="relative bg-paper pt-10 pb-48 md:pt-20 md:pb-64">
      <img src="/transitions/bottom-lego.png" alt="" aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 w-full" style={{ zIndex: 2 }} />
      <div className="relative z-10 mx-auto max-w-[1320px] px-4 md:px-7">
        <div ref={ref} className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-20">

          {/* Left — sticky headline */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="reveal">
            <h2
              className="heading-display text-d-xl tracking-[-0.015em] mt-4 text-ink"
            >
              Rinkinys, kurį
              <br />
              <span
                ref={spanRef}
                className="inline-block rotate-[-1.5deg] border-[3px] border-ink bg-brand-yellow px-[.12em] text-ink shadow-[5px_5px_0_rgba(0,27,33,.12)]"
                style={{ transformOrigin: 'center' }}
                onMouseEnter={onSpanEnter}
                onMouseLeave={onSpanLeave}
              >
                norisi atplėšti
              </span>
            </h2>
            <p className="mt-6 max-w-[40ch] text-[17px] leading-[1.65] text-ink/65">
              Kiekvienas produktas sukurtas statytojams, tinka į pašto dėžutę ir sujungiamas — mėnesį po mėnesio.
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
          <div ref={floatRef}>
          <FloatDrop className="flex flex-col gap-4" stagger={0.15} floatDuration={0.8}>
            {features.map((f, i) => (
              <div
                key={f.num}
                className="brick-card brick-card-hover relative flex gap-6 p-6 md:p-8 overflow-hidden"
                style={{ background: f.bg, transitionDelay: `${i * 60}ms` }}
                onMouseEnter={onCardEnter}
                onMouseLeave={onCardLeave}
              >
                {legoNumImages[f.num] ? (
                  <img
                    src={legoNumImages[f.num]}
                    alt={f.num}
                    className="card-num lego-num-img absolute top-0 right-0 w-28 max-w-[80%] h-auto select-none pointer-events-none"
                  />
                ) : (
                  <div className="card-num font-display text-d-md shrink-0 select-none leading-none text-ink/20">
                    {f.num}
                  </div>
                )}
                <div className="pt-1 max-w-[80%]">
                  <h3
                    className="heading-display text-d-xs tracking-[-0.01em] leading-[.92] text-ink"
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
