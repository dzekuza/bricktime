import { useRef, useEffect, useState } from "react"
import gsap from "gsap"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useReveal } from "@/hooks/useReveal"
import { useAuth } from "@/hooks/useAuth"

const BRICK_BY_COLOR: Record<string, string> = {
  "#ffd731": "/bricks/brick-yellow.svg",
  "#5ddb9c": "/bricks/brick-green.svg",
  "#55db9c": "/bricks/brick-green.svg",
  "#ffaee7": "/bricks/brick-pink.svg",
  "#fb4903": "/bricks/brick-orange.svg",
  "#4da2ff": "/bricks/brick-blue.svg",
  "#5c4ade": "/bricks/brick-purple.svg",
}
import { useSubscriptions, type DbSubscription } from "@/hooks/useSubscriptions"

// Decorative brick pokes 36px above each card; keep it clear of the pinned header.
const BRICK_OVERHANG = 40
// Must stay above the pinned header (z-20) so card tops and bricks are never covered.
const CARD_Z_BASE = 21

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
      ease: "power2.out",
      onUpdate: () => {
        if (spanRef.current) {
          spanRef.current.textContent = `€${obj.current.val.toFixed(2)}`
        }
      },
    })
  }, [value])

  return (
    <span
      ref={spanRef}
      className="plan-price heading-display text-d-xs inline-block"
      style={{ color }}
    >
      €{value.toFixed(2)}
    </span>
  )
}

export default function Subscriptions({
  onSubscribe,
}: {
  onSubscribe?: (plan: DbSubscription, billing: "monthly" | "yearly") => void
} = {}) {
  const ref = useReveal<HTMLDivElement>()
  const containerRef = useRef<HTMLDivElement>(null)
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly")
  const headerRef = useRef<HTMLDivElement>(null)
  const [headerHeight, setHeaderHeight] = useState(0)

  // Cards stack below the pinned header, whose height changes with wrapping.
  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const observer = new ResizeObserver(() => setHeaderHeight(el.offsetHeight))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const { subscriptions, loading } = useSubscriptions()
  const { profile } = useAuth()

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

  return (
    <section
      id="subscriptions"
      ref={containerRef}
      className="relative overflow-x-clip bg-paper pb-10 md:pb-20"
    >
      <div className="relative z-10 mx-auto max-w-[1320px] px-4 md:px-7">
        <div ref={ref} className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Wrapper shares a sticky scope so the header pins like the cards */}
          <div className="flex flex-col lg:col-span-12">
            {/* Tagline tile — full width */}
            <div
              ref={headerRef}
              className="reveal sticky top-[140px] z-20 flex flex-col items-center gap-4 bg-paper pt-0 pb-0 md:py-9 lg:static lg:flex-row lg:items-end lg:justify-between"
            >
              {/* Billing toggle */}
              <div className="order-first flex shrink-0 flex-col items-center gap-2 lg:order-last lg:ml-6 lg:self-start">
                <span className="label-mono hidden text-ink/45 lg:inline">
                  Atsiskaitymas
                </span>
                <div className="flex items-center gap-1 rounded-full border-2 border-ink bg-paper p-1.5 shadow-[4px_4px_0_#001B21]">
                  <button
                    onClick={() => setBilling("monthly")}
                    className={`rounded-full px-4 py-2 font-mono text-[11px] tracking-[0.08em] uppercase transition-colors ${billing === "monthly" ? "bg-ink text-paper" : "text-ink/60 hover:text-ink"}`}
                  >
                    Mėn.
                  </button>
                  <button
                    onClick={() => setBilling("yearly")}
                    className={`rounded-full px-4 py-2 font-mono text-[11px] tracking-[0.08em] uppercase transition-colors ${billing === "yearly" ? "bg-ink text-paper" : "text-ink/60 hover:text-ink"}`}
                  >
                    Metinis −15%
                  </button>
                </div>
              </div>
              <div className="hidden items-center gap-3 lg:mt-8 lg:flex">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-full border-2 border-ink bg-ink px-4 py-1.5 font-mono text-[11px] tracking-[.08em] text-paper uppercase transition-all">
                    <span>1</span>
                    <span>Pasirinkti prenumeratą</span>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-arrow-right size-4 text-ink/30"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-full border-2 border-ink/20 px-4 py-1.5 font-mono text-[11px] tracking-[.08em] text-ink/40 uppercase transition-all">
                    <span>2</span>
                    <span>Mokėjimas</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Plan cards row — full width, overlapping */}
            <div className="mt-8 flex flex-col gap-3 lg:mt-10 lg:flex-row lg:gap-0 lg:-space-x-6">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="reveal brick-card relative flex min-w-0 flex-1 flex-col bg-ink/10 p-6 pt-14 shadow-[6px_6px_0_rgba(245,241,235,.15)] md:p-8 md:pt-16"
                      style={{ zIndex: i + 1 }}
                    >
                      <div className="animate-pulse space-y-4">
                        <div className="h-6 w-2/3 rounded bg-ink/10" />
                        <div className="h-10 w-1/2 rounded bg-ink/10" />
                        <div className="mt-5 space-y-2.5">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <div
                              key={j}
                              className="h-4 w-full rounded bg-ink/10"
                            />
                          ))}
                        </div>
                        <div className="mt-7 h-10 w-full rounded-full bg-ink/10" />
                      </div>
                    </div>
                  ))
                : subscriptions.map((plan, i) => (
                    <div
                      key={plan.id}
                      className="reveal brick-card sticky flex min-w-0 flex-1 flex-col p-4 pt-3 shadow-[6px_6px_0_rgba(245,241,235,.15)] transition-[transform,box-shadow] duration-300 ease-out [--card-step:44px] hover:z-10 hover:-translate-y-3 hover:shadow-[10px_10px_0_rgba(245,241,235,.25)] lg:relative lg:!top-0 lg:p-5 lg:pt-10"
                      style={{
                        background: plan.bg_color,
                        transitionDelay: `${i * 80}ms`,
                        zIndex: CARD_Z_BASE + i,
                        top: `calc(${140 + headerHeight + BRICK_OVERHANG}px + ${i} * var(--card-step))`,
                      }}
                      onMouseEnter={onCardEnter}
                      onMouseLeave={onCardLeave}
                    >
                      {(() => {
                        const src =
                          plan.brick_image ??
                          BRICK_BY_COLOR[plan.bg_color.toLowerCase()]
                        return src ? (
                          <img
                            src={src}
                            alt=""
                            className="pointer-events-none absolute -top-9 right-6 h-16 w-auto object-contain select-none lg:right-8 lg:h-[72px]"
                          />
                        ) : null
                      })()}

                      <div className="flex items-baseline gap-1">
                        <AnimatedPrice
                          value={
                            billing === "yearly"
                              ? (plan.annual_price ?? plan.price * 0.85)
                              : Number(plan.price)
                          }
                          color={plan.text_color}
                        />
                        <span
                          className="font-mono text-[12px] tracking-[.06em] uppercase"
                          style={{ color: `${plan.text_color}90` }}
                        >
                          {billing === "yearly" ? "/mėn. (metinis)" : "/mėn."}
                        </span>
                      </div>
                      <h3
                        className="heading-display mt-2 min-h-8 text-[28px] uppercase md:text-base"
                        style={{ color: plan.text_color }}
                      >
                        {plan.name}
                      </h3>
                      <div
                        className={
                          plan.featured
                            ? "mt-3 h-7"
                            : "hidden lg:mt-3 lg:block lg:h-7"
                        }
                      >
                        {plan.featured && (
                          <Badge className="rotate-2 rounded border-2 border-ink bg-ink px-3 py-1 font-mono text-[11px] tracking-[.08em] text-primary-foreground uppercase">
                            Populiariausias
                          </Badge>
                        )}
                      </div>

                      <ul className="mt-3 flex flex-1 flex-col gap-1 lg:gap-2">
                        {plan.perks.map((perk) => (
                          <li
                            key={perk.label}
                            className="flex items-start gap-2.5 text-[14px]"
                          >
                            <span
                              className="mt-[4px] size-2 flex-none rounded-full border-2"
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

                      {profile?.plan === plan.id &&
                      profile.status === "active" ? (
                        <Button
                          disabled
                          className="mt-6 w-full cursor-default rounded-full border-2 border-ink text-[14px] font-bold tracking-[.02em] opacity-60"
                          style={{
                            background: plan.cta_bg,
                            color: plan.cta_text,
                          }}
                        >
                          Tavo prenumerata ✓
                        </Button>
                      ) : onSubscribe ? (
                        <Button
                          className="mt-6 w-full rounded-full border-2 border-ink text-[14px] font-bold tracking-[.02em] transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0_#001B21]"
                          style={{
                            background: plan.cta_bg,
                            color: plan.cta_text,
                          }}
                          onClick={() => onSubscribe(plan, billing)}
                        >
                          {plan.cta_label ?? "Pradėti"}
                        </Button>
                      ) : (
                        <Button
                          asChild
                          className="mt-6 w-full rounded-full border-2 border-ink text-[14px] font-bold tracking-[.02em] transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0_#001B21]"
                          style={{
                            background: plan.cta_bg,
                            color: plan.cta_text,
                          }}
                        >
                          <a href="/subscribe">{plan.cta_label ?? "Pradėti"}</a>
                        </Button>
                      )}
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
