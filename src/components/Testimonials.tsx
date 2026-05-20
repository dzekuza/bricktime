import { useRef, useEffect } from "react"
import gsap from "gsap"
import { StarIcon } from "lucide-react"
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
  const trackRef = useRef<HTMLDivElement>(null)
  const tweenRef = useRef<gsap.core.Tween | null>(null)

  useEffect(() => {
    // xPercent: -50 moves the track exactly one full set of cards (half its total width),
    // creating a seamless loop since the second half is an identical duplicate.
    tweenRef.current = gsap.to(trackRef.current, {
      xPercent: -50,
      repeat: -1,
      duration: testimonials.length * 7,
      ease: "none",
    })

    return () => { tweenRef.current?.kill() }
  }, [])

  return (
    <section
      className="bg-paper py-10 md:py-20"
      onMouseEnter={() => tweenRef.current?.pause()}
      onMouseLeave={() => tweenRef.current?.play()}
    >
      <div className="mx-auto max-w-[1320px] px-4 md:px-7">
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
      </div>

      {/* Full-bleed ticker — overflow clip sits outside the max-width container */}
      <div className="overflow-hidden py-3">
        <div ref={trackRef} className="flex w-max gap-4 px-2">
          {[...testimonials, ...testimonials].map((t, i) => (
            <div key={i} className="w-[340px] flex-none md:w-[460px]">
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
    </section>
  )
}
