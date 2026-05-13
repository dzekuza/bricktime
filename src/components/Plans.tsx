import { useRef, useEffect } from "react"
import gsap from "gsap"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useReveal } from "@/hooks/useReveal"
import { getPlanBrickImage, getPlanDisplayName } from "@/lib/plan-branding"

interface Plan {
  key: "nano" | "mini" | "standard" | "pro" | "mega"
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
  brickImage: string
}

const plans: Plan[] = [
  {
    key: "nano",
    name: getPlanDisplayName("nano"),
    price: "$9",
    cta: `Pradėti su ${getPlanDisplayName("nano")}`,
    bg: "#FB4903",
    textColor: "#F5F1EB",
    accentColor: "#F5F1EB",
    ctaBg: "#F5F1EB",
    ctaText: "#001B21",
    brickImage: getPlanBrickImage("nano") ?? "",
    perks: [
      "60–90 kaladėlių per produktą",
      "Surinkimo kortelė",
      "4 vinilo lipdukai",
      "Nemokamas standartinis pristatymas",
    ],
  },
  {
    key: "mini",
    name: getPlanDisplayName("mini"),
    price: "$14",
    cta: `Pradėti su ${getPlanDisplayName("mini")}`,
    bg: "#5C4ADE",
    textColor: "#F5F1EB",
    accentColor: "#F5F1EB",
    ctaBg: "#F5F1EB",
    ctaText: "#001B21",
    brickImage: getPlanBrickImage("mini") ?? "",
    perks: [
      "120–180 kaladėlių per produktą",
      "1 išskirtinis miniukas",
      "Surinkimo kortelė + 8 lipdukų",
      "Nemokamas standartinis pristatymas",
    ],
  },
  {
    key: "standard",
    name: getPlanDisplayName("standard"),
    price: "$24",
    cta: `Pradėti su ${getPlanDisplayName("standard")}`,
    bg: "#55DB9C",
    textColor: "#001B21",
    accentColor: "#001B21",
    ctaBg: "#001B21",
    ctaText: "#F5F1EB",
    brickImage: getPlanBrickImage("standard") ?? "",
    perks: [
      "240–320 kaladėlių per produktą",
      "2 išskirtiniai miniukai",
      "Surinkimo kortelė + 16 lipdukų",
      "Keitimų klubo prieiga",
      "Nemokamas skubus pristatymas",
    ],
  },
  {
    key: "pro",
    name: getPlanDisplayName("pro"),
    price: "$35",
    cta: `Pradėti su ${getPlanDisplayName("pro")}`,
    bg: "#FFAEE7",
    textColor: "#001B21",
    accentColor: "#001B21",
    ctaBg: "#001B21",
    ctaText: "#F5F1EB",
    brickImage: getPlanBrickImage("pro") ?? "",
    perks: [
      "340–400 kaladėlių per produktą",
      "2 miniukai + alternatyvi spalva",
      "Ankstyva prieiga prie produktų",
      "Nemokamas skubus pristatymas",
    ],
  },
  {
    key: "mega",
    name: getPlanDisplayName("mega"),
    price: "$55",
    cta: `Pradėti su ${getPlanDisplayName("mega")}`,
    bg: "#4DA2FF",
    textColor: "#001B21",
    accentColor: "#001B21",
    ctaBg: "#001B21",
    ctaText: "#F5F1EB",
    brickImage: getPlanBrickImage("mega") ?? "",
    perks: [
      "420–520 kaladėlių per produktą",
      "3 miniukai + retas variantas",
      "Kietu viršeliu surinkimo knyga",
      "Metinė siurprizų dėžutė",
    ],
  },
]

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

  useEffect(() => {
    return () => {
      if (!containerRef.current) return
      gsap.killTweensOf(containerRef.current.querySelectorAll("*"))
    }
  }, [])

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
      className="relative bg-paper py-10 md:py-20"
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
          <div className="flex flex-col lg:col-span-12 lg:flex-row lg:-space-x-4">
            {plans.map((plan, i) => (
              <div
                key={plan.key}
                className="reveal brick-card relative flex flex-1 flex-col justify-between p-6 shadow-[6px_6px_0_rgba(245,241,235,.15)] transition-all duration-200 hover:z-10 hover:-translate-y-3 md:p-8"
                style={{
                  background: plan.bg,
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
                  <img
                    src={plan.brickImage}
                    alt=""
                    className="pointer-events-none h-16 w-auto shrink-0 object-contain select-none md:h-20"
                  />
                </div>

                <ul className="mt-5 flex flex-col gap-2.5">
                  {plan.perks.map((perk) => (
                    <li
                      key={perk}
                      className="flex items-start gap-2.5 text-[14px]"
                    >
                      <span
                        className="mt-[3px] size-3 flex-none rounded-full border-2"
                        style={{
                          background: plan.accentColor,
                          borderColor: plan.textColor,
                        }}
                      />
                      <span style={{ color: `${plan.textColor}cc` }}>
                        {perk}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className="mt-7 w-full rounded-full border-2 border-ink text-[14px] font-bold tracking-[.02em] transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0_#001B21]"
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
