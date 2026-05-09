import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { useReveal } from '@/hooks/useReveal'

const steps = [
  {
    num: '01',
    title: 'Pasirink\nplaną',
    body: 'Pasirink lygį pagal biudžetą. Keisk bet kada — daugiau biudžeto, daugiau pasirinkimų.',
    bg: '#5DDB9C',
    bricks: ['#FB4903', '#001B21'],
  },
  {
    num: '02',
    title: 'Naršyk\nir pasiimk',
    body: 'Peržiūrėk katalogą. Rinkis produktus pagal savo plano biudžetą — vienu metu.',
    bg: '#FFAEE7',
    bricks: ['#4DA2FF', '#F5F1EB'],
  },
  {
    num: '03',
    title: 'Grąžink,\nkeisk, kartok',
    body: 'Grąžink produktus ir pasiimk naujus iš katalogo — be papildomų mokesčių.',
    bg: '#FFD731',
    bricks: ['#5C4ADE', '#FB4903'],
  },
]

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

function onCardEnter(e: React.MouseEvent<HTMLDivElement>) {
  if (reduced) return
  const bricks = e.currentTarget.querySelectorAll('.brick-el')
  gsap.killTweensOf(bricks)
  gsap.to(bricks, { y: -7, rotate: (_i) => (_i === 0 ? -10 : 10), duration: 0.22, ease: 'back.out(2.5)', stagger: 0.05 })
}
function onCardLeave(e: React.MouseEvent<HTMLDivElement>) {
  if (reduced) return
  const bricks = e.currentTarget.querySelectorAll('.brick-el')
  gsap.killTweensOf(bricks)
  gsap.to(bricks, { y: 0, rotate: 0, duration: 0.35, ease: 'elastic.out(1, 0.5)', stagger: 0.04 })
}

function Brick({ color }: { color: string }) {
  return (
    <div
      className="brick-el relative rounded border-[3px] border-ink"
      style={{ width: 54, height: 38, background: color, boxShadow: 'inset 0 -6px 0 rgba(0,0,0,.18)' }}
    >
      <span
        className="absolute -top-[11px] left-[10px] size-[20px] rounded-full border-[3px] border-ink"
        style={{ background: color, boxShadow: 'inset 0 -2px 0 rgba(0,0,0,.18)' }}
      />
      <span
        className="absolute -top-[11px] right-[10px] size-[20px] rounded-full border-[3px] border-ink"
        style={{ background: color, boxShadow: 'inset 0 -2px 0 rgba(0,0,0,.18)' }}
      />
    </div>
  )
}

export default function HowItWorks() {
  const ref = useReveal<HTMLDivElement>()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => {
      if (!containerRef.current) return
      gsap.killTweensOf(containerRef.current.querySelectorAll('*'))
    }
  }, [])

  return (
    <section ref={containerRef} className="bg-paper py-10 md:py-20">
      <div className="mx-auto max-w-[1320px] px-4 md:px-7">
        <div ref={ref} className="grid grid-cols-1 gap-4 lg:grid-cols-12">

          {/* Header tile — full width */}
          <div
            className="reveal flex flex-col justify-center bg-paper p-6 md:p-9 lg:col-span-12"
          >
            <h2
              className="heading-display text-d-lg mt-3 text-ink"
            >
              Pasirink planą,
              <br />
              <span
                className="inline-block rotate-[-1.5deg] border-[3px] border-ink bg-brand-yellow px-[.12em] text-ink shadow-[5px_5px_0_rgba(0,27,33,.12)]"
              >
                statyk
              </span>{' '}
              pasaulį.
            </h2>
            <p className="mt-5 max-w-[50ch] text-[16px] leading-[1.65] text-ink/65">
              Trys paprasti žingsniai. Jokio klijų, jokių instrukcijų už mokamą užtvarą, jokio ilgalaikio įsipareigojimo.
              Pasirink produktus iš katalogo pagal savo biudžetą. Grąžink ir pasiimk naujus — be papildomų mokesčių.
            </p>
          </div>

          {/* Steps — equal 3-column row */}
          {steps.map((step, i) => (
            <div
              key={step.num}
              className="reveal brick-card brick-card-hover flex flex-col justify-between p-6 md:p-7 min-h-[260px] lg:col-span-4"
              style={{ background: step.bg, transitionDelay: `${i * 100}ms` }}
              onMouseEnter={onCardEnter}
              onMouseLeave={onCardLeave}
            >
              <div>
<div
                  className="font-display text-ink/10 select-none leading-[.8]"
                  style={{ fontSize: 'clamp(52px, 7vw, 88px)' }}
                >
                  {step.num}
                </div>
                <h3 className="heading-display text-d-sm mt-1 text-ink">
                  {step.title.split('\n').map((l, j) => (
                    <span key={j}>{l}<br /></span>
                  ))}
                </h3>
                <p className="mt-3 text-[14px] leading-[1.6] text-ink/75">{step.body}</p>
              </div>
              <div className="mt-5 flex gap-2">
                {step.bricks.map((c, j) => (
                  <Brick key={j} color={c} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
