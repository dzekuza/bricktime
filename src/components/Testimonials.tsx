import { useRef, useEffect, useState, useCallback } from "react"
import gsap from "gsap"
import { StarIcon, ArrowLeft, ArrowRight } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const testimonials = [
  {
    quote:
      '"Mano stalas virto mažu miestu. Produktas-26 pašto surinkimas — tai beprotybė."',
    name: "Amelia R.",
    meta: "Prenumeratorė nuo produkto 04",
    avatarColor: "#FB4903",
    initials: "AR",
    bg: "#5DDB9C",
  },
  {
    quote:
      '"Mano vaikai mano, kad esu burtininkas. Surinkimo kortelės tiesiog nuostabios."',
    name: "Marco T.",
    meta: "Legend lygis · 14 mėnesių",
    avatarColor: "#FFAEE7",
    initials: "MT",
    bg: "#F5F1EB",
  },
  {
    quote:
      '"Praleidau mėnesį, jokios dramos. Grįžau į koralinio rifo produktą. Tobula."',
    name: "Yuki S.",
    meta: "Builder lygis",
    avatarColor: "#5DDB9C",
    initials: "YS",
    bg: "#FFAEE7",
  },
  {
    quote:
      '"Kiekvienas mėnuo — siurprizas. Mano kolegos jau pavydi."',
    name: "Jonas K.",
    meta: "Pro lygis · 6 mėnesiai",
    avatarColor: "#FFD731",
    initials: "JK",
    bg: "#ffffff",
  },
]

const CARD_WIDTH = 460
const CARD_GAP = 16
const STEP = CARD_WIDTH + CARD_GAP

function onCardEnter(e: React.MouseEvent<HTMLDivElement>) {
  gsap.to(e.currentTarget.querySelector(".stars"), {
    scale: 1.3,
    y: -4,
    duration: 0.2,
    ease: "back.out(2.5)",
    transformOrigin: "left center",
  })
}
function onCardLeave(e: React.MouseEvent<HTMLDivElement>) {
  gsap.to(e.currentTarget.querySelector(".stars"), {
    scale: 1,
    y: 0,
    duration: 0.3,
    ease: "elastic.out(1, 0.55)",
    transformOrigin: "left center",
  })
}

export default function Testimonials() {
  const trackRef = useRef<HTMLDivElement>(null)
  const autoRef = useRef<gsap.core.Tween | null>(null)
  const xRef = useRef(0)
  const [index, setIndex] = useState(0)

  const TOTAL = testimonials.length

  const goTo = useCallback((next: number) => {
    const clamped = ((next % TOTAL) + TOTAL) % TOTAL
    setIndex(clamped)
    xRef.current = -clamped * STEP
    gsap.to(trackRef.current, {
      x: xRef.current,
      duration: 0.55,
      ease: "power3.out",
    })
    // restart auto-scroll after 4s of inactivity
    autoRef.current?.kill()
    autoRef.current = gsap.delayedCall(4, () => startAuto(clamped))
  }, [TOTAL]) // eslint-disable-line react-hooks/exhaustive-deps

  const startAuto = useCallback((fromIndex: number) => {
    let i = fromIndex
    autoRef.current = gsap.delayedCall(4, function tick() {
      i = (i + 1) % TOTAL
      setIndex(i)
      xRef.current = -i * STEP
      gsap.to(trackRef.current, {
        x: xRef.current,
        duration: 0.55,
        ease: "power3.out",
      })
      autoRef.current = gsap.delayedCall(4, tick)
    })
  }, [TOTAL]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    startAuto(0)
    return () => { autoRef.current?.kill() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="bg-paper py-10 md:py-20">
      <div className="mx-auto max-w-[1320px] px-4 md:px-7">
        <div className="flex items-end justify-between py-6 md:py-9">
          <h2 className="heading-display text-d-lg tracking-[-0.015em] text-ink">
            <span className="inline-block rotate-[-1.5deg] border-[3px] border-ink bg-brand-yellow px-[.12em] shadow-[5px_5px_0_rgba(0,27,33,.12)]">
              Klientų
            </span>
            <br />
            Atsiliepimai.
          </h2>

          {/* Arrow navigation with dots between */}
          <div className="flex items-center gap-3 pb-1">
            <button
              onClick={() => goTo(index - 1)}
              className="brick-card brick-hover-sm flex size-12 items-center justify-center bg-paper text-ink transition-all"
              aria-label="Ankstesnis"
            >
              <ArrowLeft className="size-5" />
            </button>

            <div className="flex items-center gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`h-2 rounded-full border border-ink transition-all duration-300 ${
                    i === index ? "w-6 bg-ink" : "w-2 bg-transparent"
                  }`}
                  aria-label={`Atsiliepimai ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() => goTo(index + 1)}
              className="brick-card brick-hover-sm flex size-12 items-center justify-center bg-ink text-paper transition-all"
              aria-label="Kitas"
            >
              <ArrowRight className="size-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Full-bleed cards */}
      <div className="overflow-hidden py-3">
        <div
          ref={trackRef}
          className="flex w-max gap-4 px-4 md:px-7"
          style={{ x: 0 } as React.CSSProperties}
        >
          {testimonials.map((t, i) => (
            <div key={i} className="w-[340px] flex-none md:w-[460px]">
              <div
                className="brick-card flex min-h-[300px] flex-col justify-between p-6 md:p-10 bg-white transition-all"
                onMouseEnter={(e) => { autoRef.current?.pause?.(); onCardEnter(e) }}
                onMouseLeave={(e) => { autoRef.current?.resume?.(); onCardLeave(e) }}
              >
                <div className="stars flex gap-0.5 text-brand-orange">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <StarIcon key={j} className="size-5 fill-current" />
                  ))}
                </div>
                <p className="heading-display text-d-xs mt-6 leading-[1.05] text-ink uppercase">
                  {t.quote}
                </p>
                <div className="mt-8 flex items-center gap-3">
                  <Avatar className="size-[46px] border-2 border-ink">
                    <AvatarFallback
                      style={{ background: t.avatarColor }}
                      className="text-[13px] font-bold text-ink"
                    >
                      {t.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <b className="text-[15px] text-ink">{t.name}</b>
                    <small className="mt-0.5 block font-mono text-[11px] tracking-[.12em] text-ink/55 uppercase">
                      {t.meta}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </section>
  )
}
