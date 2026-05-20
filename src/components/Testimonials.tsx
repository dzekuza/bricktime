import { useRef, useEffect, useState, useCallback } from "react"
import gsap from "gsap"
import { StarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
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
]

function onCardEnter(e: React.MouseEvent<HTMLDivElement>) {
  gsap.killTweensOf(e.currentTarget.querySelector(".stars"))
  gsap.to(e.currentTarget.querySelector(".stars"), {
    scale: 1.3,
    y: -4,
    duration: 0.2,
    ease: "back.out(2.5)",
    transformOrigin: "left center",
  })
}
function onCardLeave(e: React.MouseEvent<HTMLDivElement>) {
  gsap.killTweensOf(e.currentTarget.querySelector(".stars"))
  gsap.to(e.currentTarget.querySelector(".stars"), {
    scale: 1,
    y: 0,
    duration: 0.3,
    ease: "elastic.out(1, 0.55)",
    transformOrigin: "left center",
  })
}

export default function Testimonials() {
  const [current, setCurrent] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const slideWidth = useCallback(() => {
    const vw = viewportRef.current?.offsetWidth ?? 0
    return window.innerWidth >= 768 ? (vw + 16) / 2 : vw
  }, [])

  const goTo = useCallback((idx: number) => {
    const next = ((idx % testimonials.length) + testimonials.length) % testimonials.length
    gsap.to(trackRef.current, {
      x: -next * slideWidth(),
      duration: 0.45,
      ease: "power2.inOut",
    })
    setCurrent(next)
  }, [slideWidth])

  useEffect(() => {
    const handleResize = () => {
      gsap.set(trackRef.current, { x: -current * slideWidth() })
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [current, slideWidth])

  useEffect(() => {
    return () => {
      if (containerRef.current) gsap.killTweensOf(containerRef.current.querySelectorAll("*"))
    }
  }, [])

  return (
    <section ref={containerRef} className="bg-paper py-10 md:py-20">
      <div className="mx-auto max-w-[1320px] px-4 md:px-7">

        {/* Heading */}
        <div className="flex items-end justify-between py-6 md:py-9">
          <h2 className="heading-display text-d-lg tracking-[-0.015em] text-ink">
            <span className="inline-block rotate-[-1.5deg] border-[3px] border-ink bg-brand-yellow px-[.12em] shadow-[5px_5px_0_rgba(0,27,33,.12)]">
              12 400
            </span>{" "}
            kūrėjų
            <br />
            prisijungę.
          </h2>
        </div>

        {/* Carousel viewport */}
        <div ref={viewportRef} className="overflow-x-hidden px-2 py-3">
          <div ref={trackRef} className="flex gap-4">
            {testimonials.map((t, i) => (
              <div key={i} className="min-w-full md:min-w-[calc(50%-8px)]">
                <div
                  className="brick-card brick-card-hover flex min-h-[300px] flex-col justify-between p-6 md:p-10"
                  style={{ background: "#ffffff" }}
                  onMouseEnter={onCardEnter}
                  onMouseLeave={onCardLeave}
                >
                  <div className="stars flex gap-0.5 text-ink">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <StarIcon key={j} className="size-5 fill-current" />
                    ))}
                  </div>
                  <p className="heading-display text-d-sm mt-6 leading-[1.05] text-ink uppercase">
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

        {/* Controls */}
        <div className="mt-5 flex items-center gap-4">
          <button
            onClick={() => goTo(current - 1)}
            className="brick-card brick-hover-sm flex size-10 items-center justify-center bg-paper"
            aria-label="Previous"
          >
            <ChevronLeftIcon className="size-5" />
          </button>
          <div className="flex gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                className="h-2 rounded-full bg-ink transition-all duration-300"
                style={{ width: i === current ? "24px" : "8px", opacity: i === current ? 1 : 0.2 }}
              />
            ))}
          </div>
          <button
            onClick={() => goTo(current + 1)}
            className="brick-card brick-hover-sm flex size-10 items-center justify-center bg-paper"
            aria-label="Next"
          >
            <ChevronRightIcon className="size-5" />
          </button>
        </div>

      </div>
    </section>
  )
}
