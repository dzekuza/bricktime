import { useRef, useEffect, useState, useCallback } from "react"
import gsap from "gsap"
import { StarIcon, ArrowLeft, ArrowRight } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { HeadingMarkup } from "@/components/HeadingMarkup"
import { supabase } from "@/lib/supabase"

const DEFAULT_HEADING = { heading: "==Klientų==\nAtsiliepimai." }

const DEFAULT_TESTIMONIALS = [
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
    quote: '"Kiekvienas mėnuo — siurprizas. Mano kolegos jau pavydi."',
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
const PX_PER_SEC = 55 // auto-scroll speed

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
  const xRef = useRef(0)
  const pausedRef = useRef(false)
  const steppingRef = useRef(false)
  const [dotIndex, setDotIndex] = useState(0)
  const [heading, setHeading] = useState(DEFAULT_HEADING)
  const [testimonials, setTestimonials] = useState(DEFAULT_TESTIMONIALS)
  const totalRef = useRef(testimonials.length)
  const items = [...testimonials, ...testimonials] // 2 copies — seamless loop

  useEffect(() => {
    totalRef.current = testimonials.length
  }, [testimonials])

  useEffect(() => {
    supabase
      .from("home_content")
      .select("testimonials_heading")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (!data) return
        setHeading({
          heading: data.testimonials_heading || DEFAULT_HEADING.heading,
        })
      })

    supabase
      .from("home_testimonials")
      .select("quote, name, meta, avatar_color, initials, bg")
      .order("sort_order")
      .then(({ data }) => {
        if (!data || data.length === 0) return
        setTestimonials(
          data.map((t) => ({
            quote: t.quote,
            name: t.name,
            meta: t.meta,
            avatarColor: t.avatar_color,
            initials: t.initials,
            bg: t.bg,
          }))
        )
      })
  }, [])

  const normalize = (x: number) => {
    const loopWidth = totalRef.current * STEP
    let n = x % -loopWidth
    if (n > 0) n -= loopWidth
    return n
  }

  useEffect(() => {
    let lastT = performance.now()

    const tick = () => {
      if (pausedRef.current || steppingRef.current) {
        lastT = performance.now()
        return
      }
      const now = performance.now()
      const dt = Math.min(now - lastT, 50) // cap delta to avoid jump after tab switch
      lastT = now
      xRef.current = normalize(xRef.current - (PX_PER_SEC * dt) / 1000)
      gsap.set(trackRef.current, { x: xRef.current })
      const total = totalRef.current
      setDotIndex(((Math.round(-xRef.current / STEP) % total) + total) % total)
    }

    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [])

  const step = useCallback((dir: 1 | -1) => {
    steppingRef.current = true
    const snapped = Math.round(xRef.current / STEP) * STEP
    const target = normalize(snapped - dir * STEP)

    gsap.to(trackRef.current, {
      x: target,
      duration: 0.55,
      ease: "power3.out",
      onComplete: () => {
        xRef.current = target
        steppingRef.current = false
      },
    })
    const total = totalRef.current
    setDotIndex(((Math.round(-target / STEP) % total) + total) % total)
  }, [])

  return (
    <section className="bg-paper py-10 md:py-20">
      <div className="mx-auto max-w-[1320px] px-4 md:px-7">
        <div className="flex items-end justify-between py-6 md:py-9">
          <h2 className="heading-display text-d-lg tracking-[-0.015em] text-ink">
            <HeadingMarkup
              text={heading.heading}
              highlightClassName="inline-block rotate-[-1.5deg] border-[3px] border-ink bg-brand-yellow px-[.12em] shadow-[5px_5px_0_rgba(0,27,33,.12)]"
            />
          </h2>

          <div className="flex items-center gap-3 pb-1">
            <button
              onClick={() => step(-1)}
              className="brick-card brick-hover-sm flex size-12 items-center justify-center bg-paper text-ink transition-all"
              aria-label="Ankstesnis"
            >
              <ArrowLeft className="size-5" />
            </button>

            <div className="flex items-center gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const target = normalize(-i * STEP)
                    steppingRef.current = true
                    gsap.to(trackRef.current, {
                      x: target,
                      duration: 0.55,
                      ease: "power3.out",
                      onComplete: () => {
                        xRef.current = target
                        steppingRef.current = false
                      },
                    })
                    setDotIndex(i)
                  }}
                  className={`h-2 rounded-full border border-ink transition-all duration-300 ${
                    i === dotIndex ? "w-6 bg-ink" : "w-2 bg-transparent"
                  }`}
                  aria-label={`Atsiliepimai ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() => step(1)}
              className="brick-card brick-hover-sm flex size-12 items-center justify-center bg-ink text-paper transition-all"
              aria-label="Kitas"
            >
              <ArrowRight className="size-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden py-3">
        <div ref={trackRef} className="flex w-max gap-4 px-4 md:px-7">
          {items.map((t, i) => (
            <div key={i} className="w-[340px] flex-none md:w-[460px]">
              <div
                className="brick-card flex min-h-[300px] flex-col justify-between bg-white p-6 md:p-10"
                onMouseEnter={(e) => {
                  pausedRef.current = true
                  onCardEnter(e)
                }}
                onMouseLeave={(e) => {
                  pausedRef.current = false
                  onCardLeave(e)
                }}
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
