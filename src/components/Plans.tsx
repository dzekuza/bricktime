import { useRef } from 'react'
import gsap from 'gsap'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useReveal } from '@/hooks/useReveal'

interface Plan {
  name: string
  price: string
  perks: string[]
  featured?: boolean
  cta: string
  bg: string
  textColor: string
  accentColor: string
  ctaBg: string
  ctaText: string
  gridClass: string
}

const plans: Plan[] = [
  {
    name: 'Nano',
    price: '$9',
    cta: 'Pradėti su Nano',
    bg: '#F5F1EB',
    textColor: '#001B21',
    accentColor: '#5DDB9C',
    ctaBg: '#001B21',
    ctaText: '#F5F1EB',
    gridClass: 'lg:col-span-3',
    perks: [
      '60–90 kaladėlių per produktą',
      'Surinkimo kortelė',
      '4 vinilo lipdukai',
      'Nemokamas standartinis pristatymas',
    ],
  },
  {
    name: 'Mini',
    price: '$14',
    cta: 'Pradėti su Mini',
    bg: '#FFAEE7',
    textColor: '#001B21',
    accentColor: '#001B21',
    ctaBg: '#001B21',
    ctaText: '#F5F1EB',
    gridClass: 'lg:col-span-3',
    perks: [
      '120–180 kaladėlių per produktą',
      '1 išskirtinis miniukas',
      'Surinkimo kortelė + 8 lipdukų',
      'Nemokamas standartinis pristatymas',
    ],
  },
  {
    name: 'Standard',
    price: '$24',
    cta: 'Pradėti su Standard',
    bg: '#FFD731',
    textColor: '#001B21',
    accentColor: '#001B21',
    ctaBg: '#001B21',
    ctaText: '#F5F1EB',
    gridClass: 'lg:col-span-3',
    perks: [
      '240–320 kaladėlių per produktą',
      '2 išskirtiniai miniukai',
      'Surinkimo kortelė + 16 lipdukų',
      'Keitimų klubo prieiga',
      'Nemokamas skubus pristatymas',
    ],
  },
  {
    name: 'Pro',
    price: '$35',
    cta: 'Pradėti su Pro',
    bg: '#4DA2FF',
    textColor: '#001B21',
    accentColor: '#001B21',
    ctaBg: '#001B21',
    ctaText: '#F5F1EB',
    gridClass: 'lg:col-span-3',
    perks: [
      '340–400 kaladėlių per produktą',
      '2 miniukai + alternatyvi spalva',
      'Ankstyva prieiga prie produktų',
      'Nemokamas skubus pristatymas',
    ],
  },
  {
    name: 'Mega',
    price: '$55',
    cta: 'Pradėti su Mega',
    bg: '#FB4903',
    textColor: '#F5F1EB',
    accentColor: '#FFD731',
    ctaBg: '#F5F1EB',
    ctaText: '#001B21',
    gridClass: 'lg:col-span-3',
    perks: [
      '420–520 kaladėlių per produktą',
      '3 miniukai + retas variantas',
      'Kietu viršeliu surinkimo knyga',
      'Metinė siurprizų dėžutė',
    ],
  },
]

function onCardEnter(e: React.MouseEvent<HTMLDivElement>) {
  gsap.killTweensOf(e.currentTarget.querySelector('.plan-price'))
  gsap.to(e.currentTarget.querySelector('.plan-price'), {
    scale: 1.1, rotate: -3, duration: 0.22, ease: 'back.out(2.5)',
  })
}
function onCardLeave(e: React.MouseEvent<HTMLDivElement>) {
  gsap.killTweensOf(e.currentTarget.querySelector('.plan-price'))
  gsap.to(e.currentTarget.querySelector('.plan-price'), {
    scale: 1, rotate: 0, duration: 0.32, ease: 'elastic.out(1, 0.5)',
  })
}

export default function Plans() {
  const ref = useReveal<HTMLDivElement>()
  const spanRef = useRef<HTMLSpanElement>(null)

  function onSpanEnter() {
    gsap.killTweensOf(spanRef.current)
    gsap.to(spanRef.current, { rotate: 4, scale: 1.12, boxShadow: '8px 8px 0 #001B21', duration: 0.22, ease: 'back.out(2.5)' })
  }
  function onSpanLeave() {
    gsap.killTweensOf(spanRef.current)
    gsap.to(spanRef.current, { rotate: -1.5, scale: 1, boxShadow: '0px 0px 0 #001B21', duration: 0.28, ease: 'elastic.out(1, 0.55)' })
  }

  return (
    <section id="plans" className="relative bg-paper pt-28 pb-10 md:pt-64 md:pb-20">
      <img src="/transitions/top-lego.png" alt="" aria-hidden="true" className="pointer-events-none absolute top-0 left-0 w-full" style={{ zIndex: 2 }} />
      <div className="relative z-10 mx-auto max-w-[1320px] px-4 md:px-7">
        <div ref={ref} className="grid grid-cols-1 gap-4 lg:grid-cols-12">

          {/* Tagline tile — full width */}
          <div
            className="reveal brick-card flex items-end justify-between p-6 md:p-9 shadow-[6px_6px_0_rgba(245,241,235,.12)] lg:col-span-12"
            style={{ background: '#FFD731' }}
          >
            <h2
              className="heading-display text-d-lg tracking-[-0.015em] text-ink"
            >
              Planai kiekvienai
              <br />
              <span
                ref={spanRef}
                className="inline-block rotate-[-1.5deg] border-[3px] border-ink bg-[#FB4903] px-[.12em] text-paper shadow-[5px_5px_0_rgba(0,27,33,.15)]"
                style={{ transformOrigin: 'center' }}
                onMouseEnter={onSpanEnter}
                onMouseLeave={onSpanLeave}
              >
                lentynų
              </span>{' '}
              situacijai.
            </h2>
            <div
              className="font-display hidden shrink-0 text-ink/20 lg:block select-none leading-none"
              style={{ fontSize: 80 }}
            >
              ▩
            </div>
          </div>

          {/* Plan cards row — full width, overlapping */}
          <div className="lg:col-span-12 flex flex-col lg:flex-row lg:-space-x-4">
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              className="reveal brick-card relative flex flex-col justify-between p-6 md:p-8 shadow-[6px_6px_0_rgba(245,241,235,.15)] transition-all duration-200 hover:-translate-y-3 hover:z-10 flex-1"
              style={{ background: plan.bg, transitionDelay: `${i * 80}ms`, zIndex: i + 1 }}
              onMouseEnter={onCardEnter}
              onMouseLeave={onCardLeave}
            >
              {plan.featured && (
                <Badge
                  className="absolute -top-4 right-6 rotate-2 rounded border-2 border-ink px-3 py-1 font-mono text-[11px] tracking-[.08em] uppercase"
                  style={{ background: '#001B21', color: '#F5F1EB' }}
                >
                  Populiariausias
                </Badge>
              )}

              {/* Name + price */}
              <div>
                <div
                  className="heading-display text-d-xs uppercase"
                  style={{ color: plan.textColor }}
                >
                  {plan.name}
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span
                    className="plan-price heading-display text-d-md inline-block"
                    style={{ color: plan.textColor }}
                  >
                    {plan.price}
                  </span>
                  <span
                    className="font-mono text-[12px] tracking-[.06em] uppercase"
                    style={{ color: `${plan.textColor}90` }}
                  >
                    /mėn.
                  </span>
                </div>
              </div>

              {/* Perks */}
              <ul className="mt-6 flex flex-col gap-2.5">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2.5 text-[14px]">
                    <span
                      className="mt-[3px] size-3 flex-none rounded-full border-2"
                      style={{ background: plan.accentColor, borderColor: plan.textColor }}
                    />
                    <span style={{ color: `${plan.textColor}cc` }}>{perk}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                asChild
                className="mt-7 w-full rounded-full border-2 border-ink font-bold text-[14px] tracking-[.02em] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0_#001B21] transition-all"
                style={{ background: plan.ctaBg, color: plan.ctaText }}
              >
                <a href="/subscribe">{plan.cta}</a>
              </Button>
            </div>
          ))}
          </div>
        </div>
      </div>
    </section>
  )
}
