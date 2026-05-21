import { useRef, useEffect, useState } from "react"
import gsap from "gsap"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useReveal } from "@/hooks/useReveal"

const BRICK_BY_COLOR: Record<string, string> = {
  '#ffd731': '/bricks/brick-yellow.svg',
  '#5ddb9c': '/bricks/brick-green.svg',
  '#55db9c': '/bricks/brick-green.svg',
  '#ffaee7': '/bricks/brick-pink.svg',
  '#fb4903': '/bricks/brick-orange.svg',
  '#4da2ff': '/bricks/brick-blue.svg',
  '#5c4ade': '/bricks/brick-purple.svg',
}
import { usePlans } from "@/hooks/usePlans"

function onCardEnter(e: React.MouseEvent<HTMLDivElement>) {
  gsap.killTweensOf(e.currentTarget.querySelector(".plan-price"))
  gsap.to(e.currentTarget.querySelector(".plan-price"), {
    scale: 1.1,
    rotate: -3,
    duration: 0.22,
    ease: "back.out(2.5)",
  })
}
function onCardLeave(e: React.MouseEvent<HTMLDivElement>) {
  gsap.killTweensOf(e.currentTarget.querySelector(".plan-price"))
  gsap.to(e.currentTarget.querySelector(".plan-price"), {
    scale: 1,
    rotate: 0,
    duration: 0.32,
    ease: "elastic.out(1, 0.5)",
  })
}

function AnimatedPrice({ value, color }: { value: number; color: string }) {
  const spanRef = useRef<HTMLSpanElement>(null)
  const obj = useRef({ val: value })

  useEffect(() => {
    gsap.killTweensOf(obj.current)
    gsap.to(obj.current, {
      val: value,
      duration: 0.55,
      ease: 'power2.out',
      onUpdate: () => {
        if (spanRef.current) {
          spanRef.current.textContent = `€${obj.current.val.toFixed(2)}`
        }
      },
    })
  }, [value])

  return (
    <span ref={spanRef} className="plan-price heading-display text-d-xs inline-block" style={{ color }}>
      €{value.toFixed(2)}
    </span>
  )
}

export default function Plans() {
  const ref = useReveal<HTMLDivElement>()
  const spanRef = useRef<HTMLSpanElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')
  const { plans, loading } = usePlans()

  useEffect(() => {
    return () => {
      if (!containerRef.current) return
      gsap.killTweensOf(containerRef.current.querySelectorAll("*"))
    }
  }, [])

  // After async plans load the skeleton is replaced with real cards.
  // useReveal already fired on mount (skeletons), so the new .reveal
  // elements were never observed. Force-trigger them here.
  useEffect(() => {
    if (loading || !containerRef.current) return
    containerRef.current
      .querySelectorAll<HTMLElement>(".reveal:not(.visible)")
      .forEach((el) => el.classList.add("visible"))
  }, [loading])

  function onSpanEnter() {
    gsap.killTweensOf(spanRef.current)
    gsap.to(spanRef.current, {
      rotate: 4,
      scale: 1.12,
      boxShadow: "8px 8px 0 #001B21",
      duration: 0.22,
      ease: "back.out(2.5)",
    })
  }
  function onSpanLeave() {
    gsap.killTweensOf(spanRef.current)
    gsap.to(spanRef.current, {
      rotate: -1.5,
      scale: 1,
      boxShadow: "0px 0px 0 #001B21",
      duration: 0.28,
      ease: "elastic.out(1, 0.55)",
    })
  }

  return (
    <section
      id="plans"
      ref={containerRef}
      className="relative overflow-x-clip bg-paper py-10 md:py-20"
    >
      <div className="relative z-10 mx-auto max-w-[1320px] px-4 md:px-7">
        <div ref={ref} className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Tagline tile — full width */}
          <div className="reveal flex items-end justify-between py-6 md:py-9 lg:col-span-12">
            {/* Billing toggle */}
            <div className="hidden lg:flex flex-col items-center gap-2 order-last ml-6 shrink-0 self-start pt-1">
              <span className="label-mono text-ink/45">Atsiskaitymas</span>
              <div className="flex items-center gap-1 rounded-full border-2 border-ink bg-paper p-1.5 shadow-[4px_4px_0_#001B21]">
                <button
                  onClick={() => setBilling('monthly')}
                  className={`rounded-full px-4 py-2 font-mono text-[11px] tracking-[0.08em] uppercase transition-colors ${billing === 'monthly' ? 'bg-ink text-paper' : 'text-ink/60 hover:text-ink'}`}
                >
                  Mėn.
                </button>
                <button
                  onClick={() => setBilling('yearly')}
                  className={`rounded-full px-4 py-2 font-mono text-[11px] tracking-[0.08em] uppercase transition-colors ${billing === 'yearly' ? 'bg-ink text-paper' : 'text-ink/60 hover:text-ink'}`}
                >
                  Metinis −17%
                </button>
              </div>
            </div>
            <h2 className="heading-display text-d-lg tracking-[-0.015em] text-ink">
              Planai kiekvienai
              <br />
              <span
                ref={spanRef}
                className="inline-block rotate-[-1.5deg] border-[3px] border-ink bg-brand-yellow px-[.12em] text-ink shadow-[5px_5px_0_rgba(0,27,33,.15)]"
                style={{ transformOrigin: "center" }}
                onMouseEnter={onSpanEnter}
                onMouseLeave={onSpanLeave}
              >
                lentynų
              </span>{" "}
              situacijai.
            </h2>
          </div>

          {/* Plan cards row — full width, overlapping */}
          <div className="flex flex-col lg:col-span-12 lg:flex-row lg:-space-x-6 mt-8 lg:mt-10">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="reveal brick-card bg-ink/10 relative flex min-w-0 flex-1 flex-col p-6 pt-14 shadow-[6px_6px_0_rgba(245,241,235,.15)] md:p-8 md:pt-16"
                  style={{ zIndex: i + 1 }}
                  >
                    <div className="animate-pulse space-y-4">
                      <div className="h-6 w-2/3 rounded bg-ink/10" />
                      <div className="h-10 w-1/2 rounded bg-ink/10" />
                      <div className="mt-5 space-y-2.5">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <div key={j} className="h-4 w-full rounded bg-ink/10" />
                        ))}
                      </div>
                      <div className="mt-7 h-10 w-full rounded-full bg-ink/10" />
                    </div>
                  </div>
                ))
              : plans.map((plan, i) => (
                  <div
                    key={plan.id}
                    className="reveal brick-card sticky lg:relative lg:!top-0 flex min-w-0 flex-1 flex-col p-5 pt-8 shadow-[6px_6px_0_rgba(245,241,235,.15)] transition-all duration-200 hover:z-10 hover:-translate-y-3 lg:p-6 lg:pt-8"
                    style={{
                      background: plan.bg_color,
                      transitionDelay: `${i * 80}ms`,
                      zIndex: i + 1,
                      top: `${80 + i * 72}px`,
                    }}
                    onMouseEnter={onCardEnter}
                    onMouseLeave={onCardLeave}
                  >
                    {(() => {
                      const src = plan.brick_image ?? BRICK_BY_COLOR[plan.bg_color.toLowerCase()]
                      return src ? (
                        <img
                          src={src}
                          alt=""
                          className="pointer-events-none absolute -top-9 right-6 h-16 w-auto object-contain select-none lg:h-[72px] lg:right-8"
                        />
                      ) : null
                    })()}

                    <h3
                        className="heading-display text-[28px] md:text-base uppercase min-h-8"
                        style={{ color: plan.text_color }}
                      >
                        {plan.name}
                      </h3>
                      <div className="mt-2 flex items-baseline gap-1">
                        <AnimatedPrice
                          value={billing === 'yearly' ? plan.price * 0.83 : Number(plan.price)}
                          color={plan.text_color}
                        />
                        <span
                          className="font-mono text-[12px] tracking-[.06em] uppercase"
                          style={{ color: `${plan.text_color}90` }}
                        >
                          {billing === 'yearly' ? '/mėn. (metinis)' : '/mėn.'}
                        </span>
                      </div>
                      <div className="mt-3 h-7">
                        {plan.featured && (
                          <Badge className="rotate-2 rounded border-2 border-ink px-3 py-1 font-mono text-[11px] tracking-[.08em] uppercase bg-ink text-primary-foreground">
                            Populiariausias
                          </Badge>
                        )}
                      </div>

                    <ul className="mt-3 flex-1 flex flex-col gap-2">
                      {plan.perks.map((perk) => (
                        <li
                          key={perk.label}
                          className="flex items-start gap-2.5 text-[14px]"
                        >
                          <span
                            className="mt-[3px] size-3 flex-none rounded-full border-2"
                            style={{
                              background: plan.accent_color,
                              borderColor: plan.text_color,
                            }}
                          />
                          <span style={{ color: `${plan.text_color}cc` }}>
                            {perk.label}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      asChild
                      className="mt-6 w-full rounded-full border-2 border-ink text-[14px] font-bold tracking-[.02em] transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0_#001B21]"
                      style={{ background: plan.cta_bg, color: plan.cta_text }}
                    >
                      <a href="/subscribe">{plan.cta_label ?? "Pradėti"}</a>
                    </Button>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </section>
  )
}
