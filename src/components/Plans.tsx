import { useRef, useEffect } from "react"
import gsap from "gsap"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useReveal } from "@/hooks/useReveal"
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

export default function Plans() {
  const ref = useReveal<HTMLDivElement>()
  const spanRef = useRef<HTMLSpanElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
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
      className="relative overflow-hidden bg-paper py-10 md:py-20"
    >
      <div className="relative z-10 mx-auto max-w-[1320px] px-4 md:px-7">
        <div ref={ref} className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Tagline tile — full width */}
          <div className="reveal flex items-end justify-between p-6 md:p-9 lg:col-span-12">
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
          <div className="flex flex-col lg:col-span-12 lg:flex-row lg:-space-x-6">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="reveal brick-card relative flex min-w-0 flex-1 flex-col justify-between p-6 shadow-[6px_6px_0_rgba(245,241,235,.15)] md:p-8"
                    style={{ background: "#e5e0da", zIndex: i + 1 }}
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
                    className="reveal brick-card relative flex min-w-0 flex-1 flex-col justify-between p-5 shadow-[6px_6px_0_rgba(245,241,235,.15)] transition-all duration-200 hover:z-10 hover:-translate-y-3 lg:p-6"
                    style={{
                      background: plan.bg_color,
                      transitionDelay: `${i * 80}ms`,
                      zIndex: i + 1,
                    }}
                    onMouseEnter={onCardEnter}
                    onMouseLeave={onCardLeave}
                  >
                    {plan.featured && (
                      <Badge
                        className="absolute -top-4 right-6 rotate-2 rounded border-2 border-ink px-3 py-1 font-mono text-[11px] tracking-[.08em] uppercase"
                        style={{ background: "#001B21", color: "#F5F1EB" }}
                      >
                        Populiariausias
                      </Badge>
                    )}

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div
                          className="heading-display text-base uppercase"
                          style={{ color: plan.text_color }}
                        >
                          {plan.name}
                        </div>
                        <div className="mt-2 flex items-baseline gap-1">
                          <span
                            className="plan-price heading-display text-d-xs inline-block"
                            style={{ color: plan.text_color }}
                          >
                            €{plan.price}
                          </span>
                          <span
                            className="font-mono text-[12px] tracking-[.06em] uppercase"
                            style={{ color: `${plan.text_color}90` }}
                          >
                            /mėn.
                          </span>
                        </div>
                      </div>
                      {plan.brick_image && (
                        <img
                          src={plan.brick_image}
                          alt=""
                          className="pointer-events-none h-16 w-auto shrink-0 object-contain select-none md:h-20"
                        />
                      )}
                    </div>

                    <ul className="mt-5 flex flex-col gap-2.5">
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
                      className="mt-7 w-full rounded-full border-2 border-ink text-[14px] font-bold tracking-[.02em] transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0_#001B21]"
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
