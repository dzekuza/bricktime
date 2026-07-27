import { useRef, useEffect } from "react"
import gsap from "gsap"
import { useReveal } from "@/hooks/useReveal"
import { getSubscriptionBrickImage } from "@/lib/subscription-branding"
import { HowItWorksFreedom } from "@/components/how-it-works-freedom"

const steps = [
  {
    num: "01",
    title: "Pasirink\nprenumeratą",
    body: "Pasirink prenumeratą pagal savo poreikius – kiekviena jų atveria skirtingas LEGO® rinkinių galimybes.",
    brick: "nano",
  },
  {
    num: "02",
    title: "Išsirink\nrinkinį",
    body: "Išsirink LEGO® rinkinį, kuris labiausiai įkvepia, o mes pasirūpinsime jo pristatymu.",
    brick: "standard",
  },
  {
    num: "03",
    title: "Grąžink,\nkeisk, kartok",
    body: "Baigęs konstruoti, grąžink rinkinį ir pasiruošk kitam LEGO® projektui.",
    brick: "mega",
  },
]

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

function onCardEnter(e: React.MouseEvent<HTMLDivElement>) {
  if (reduced) return
  const bricks = e.currentTarget.querySelectorAll(".brick-el")
  gsap.killTweensOf(bricks)
  gsap.to(bricks, {
    y: -7,
    rotate: (_i) => (_i === 0 ? -10 : 10),
    duration: 0.22,
    ease: "back.out(2.5)",
    stagger: 0.05,
  })
}
function onCardLeave(e: React.MouseEvent<HTMLDivElement>) {
  if (reduced) return
  const bricks = e.currentTarget.querySelectorAll(".brick-el")
  gsap.killTweensOf(bricks)
  gsap.to(bricks, {
    y: 0,
    rotate: 0,
    duration: 0.35,
    ease: "elastic.out(1, 0.5)",
    stagger: 0.04,
  })
}

function Brick({ plan }: { plan: string }) {
  const image = getSubscriptionBrickImage(plan)

  if (!image) return null

  return (
    <img
      src={image}
      alt=""
      className="brick-el pointer-events-none h-12 w-auto object-contain select-none sm:h-14"
    />
  )
}

export default function HowItWorks() {
  const ref = useReveal<HTMLDivElement>()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => {
      if (!containerRef.current) return
      gsap.killTweensOf(containerRef.current.querySelectorAll("*"))
    }
  }, [])

  return (
    <section ref={containerRef} className="bg-paper pb-10 md:pb-20">
      <div className="mx-auto max-w-[1320px] px-4 md:px-7">
        <div ref={ref} className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Header tile — full width */}
          <div className="reveal flex flex-col justify-center bg-paper py-6 md:py-9 lg:col-span-12">
            <h2 className="heading-display text-d-lg mt-3 text-ink">
              Kaip tai veikia?
              <br />
              <span className="inline-block rotate-[-1.5deg] border-[3px] border-ink bg-brand-yellow px-[.12em] text-ink shadow-[5px_5px_0_rgba(0,27,33,.12)]">
                Pradėk
              </span>{" "}
              konstruoti
            </h2>
            <p className="mt-5 max-w-[50ch] text-[16px] leading-[1.65] text-ink/65">
              Vos keli paprasti žingsniai iki naujo konstravimo projekto tavo
              namuose.
            </p>
          </div>

          {/* Steps — equal 3-column row */}
          {steps.map((step, i) => (
            <div
              key={step.num}
              className="reveal brick-card brick-card-hover flex min-h-[320px] flex-col justify-between bg-paper p-7 md:p-8 lg:col-span-4"
              style={{ transitionDelay: `${i * 100}ms` }}
              onMouseEnter={onCardEnter}
              onMouseLeave={onCardLeave}
            >
              <div>
                <div
                  className="font-display leading-[.8] text-ink/10 select-none"
                  style={{ fontSize: "clamp(52px, 7vw, 88px)" }}
                >
                  {step.num}
                </div>
                <h3 className="heading-display text-d-sm mt-4 text-ink md:mt-1">
                  {step.title.split("\n").map((l, j) => (
                    <span key={j}>
                      {l}
                      <br />
                    </span>
                  ))}
                </h3>
                <p className="mt-3 text-[14px] leading-[1.6] text-ink/75">
                  {step.body}
                </p>
              </div>
              <div className="mt-5 flex gap-2">
                <Brick plan={step.brick} />
              </div>
            </div>
          ))}

          <HowItWorksFreedom />
        </div>
      </div>
    </section>
  )
}
