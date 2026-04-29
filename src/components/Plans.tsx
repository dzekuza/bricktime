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
}

const plans: Plan[] = [
  {
    name: 'Mini',
    price: '$14',
    cta: 'Start with Mini',
    bg: '#F5F1EB',
    textColor: '#001B21',
    accentColor: '#5DDB9C',
    ctaBg: '#001B21',
    ctaText: '#F5F1EB',
    perks: [
      '120–180 bricks per drop',
      '1 exclusive minifig',
      'Build card + 8 stickers',
      'Free standard shipping',
    ],
  },
  {
    name: 'Standard',
    price: '$24',
    cta: 'Start with Standard',
    featured: true,
    bg: '#FFD731',
    textColor: '#001B21',
    accentColor: '#001B21',
    ctaBg: '#001B21',
    ctaText: '#F5F1EB',
    perks: [
      '240–320 bricks per drop',
      '2 exclusive minifigs',
      'Build card + 16 stickers',
      'Trade-club access',
      'Free expedited shipping',
    ],
  },
  {
    name: 'Mega',
    price: '$42',
    cta: 'Start with Mega',
    bg: '#FB4903',
    textColor: '#F5F1EB',
    accentColor: '#FFD731',
    ctaBg: '#F5F1EB',
    ctaText: '#001B21',
    perks: [
      '400–520 bricks per drop',
      '3 exclusive minifigs + variant',
      'Hardcover build book',
      'Early access drops',
      'Annual surprise box',
    ],
  },
]

const colSpans = ['lg:col-span-3', 'lg:col-span-6', 'lg:col-span-3']

export default function Plans() {
  const ref = useReveal<HTMLDivElement>()

  return (
    <section id="plans" className="bg-ink py-20">
      <div className="mx-auto max-w-[1320px] px-7">
        {/*
          Bento 12-col, 2 rows:
          [Label col-4] [Tagline col-8]
          [Mini col-3] [Standard col-6] [Mega col-3]
        */}
        <div ref={ref} className="grid grid-cols-1 gap-4 lg:grid-cols-12">

          {/* Tagline tile — full width */}
          <div
            className="reveal flex items-end justify-between rounded-3xl border-2 border-ink p-9 shadow-[6px_6px_0_rgba(245,241,235,.12)] lg:col-span-12"
            style={{ background: '#FFD731' }}
          >
            <h2
              className="uppercase text-ink"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(38px, 4vw, 68px)',
                lineHeight: '.88',
                letterSpacing: '-.015em',
              }}
            >
              Plans for every
              <br />
              desk-shelf situation.
            </h2>
            <div
              className="hidden shrink-0 text-ink/20 lg:block select-none"
              style={{ fontFamily: 'var(--font-display)', fontSize: 80, lineHeight: 1 }}
            >
              ▩
            </div>
          </div>

          {/* Plan cards row */}
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              className={[
                'reveal relative flex flex-col justify-between rounded-3xl border-2 border-ink p-8 shadow-[6px_6px_0_rgba(245,241,235,.15)] transition-all hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[10px_10px_0_rgba(245,241,235,.2)]',
                colSpans[i],
              ].join(' ')}
              style={{ background: plan.bg, transitionDelay: `${i * 100}ms`, minHeight: 360 }}
            >
              {plan.featured && (
                <Badge
                  className="absolute -top-4 right-6 rotate-2 rounded border-2 border-ink px-3 py-1 font-mono text-[11px] tracking-[.08em] uppercase"
                  style={{ background: '#001B21', color: '#F5F1EB' }}
                >
                  Most popular
                </Badge>
              )}

              {/* Name + price */}
              <div>
                <div
                  className="uppercase"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: plan.featured ? 44 : 36,
                    lineHeight: '.88',
                    color: plan.textColor,
                  }}
                >
                  {plan.name}
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: plan.featured ? 76 : 60,
                      lineHeight: '.88',
                      color: plan.textColor,
                    }}
                  >
                    {plan.price}
                  </span>
                  <span
                    className="font-mono text-[12px] tracking-[.06em] uppercase"
                    style={{ color: `${plan.textColor}90` }}
                  >
                    /mo
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
                <a href="#">{plan.cta}</a>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
