import { useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ArrowRightIcon, StarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { HeadingMarkup } from "@/components/HeadingMarkup"
import { HERO_VIDEO_URL } from "@/lib/media"
import { supabase } from "@/lib/supabase"

gsap.registerPlugin(useGSAP)

const avatarColors = ["#5DDB9C", "#FFAEE7", "#FB4903", "#4DA2FF"]
const avatarInitials = ["MK", "TJ", "AR", "LP"]

type BrickColor = "purple" | "pink" | "green" | "yellow" | "blue" | "orange"

interface BrickProps {
  color: BrickColor
  rotate?: number
  size?: number
}

function Brick({ color, rotate = 0, size = 1 }: BrickProps) {
  return (
    <img
      src={`/bricks/brick-${color}.svg`}
      alt=""
      className="brick-el w-[60px] object-contain select-none lg:w-[110px]"
      style={{
        transform: `rotate(${rotate}deg) scale(${size})`,
        display: "block",
        flexShrink: 0,
        height: "auto",
      }}
    />
  )
}

interface BrickEntry extends BrickProps {
  left: string
  top: string
  mobileHide?: boolean
}

const bricks: BrickEntry[] = [
  // Left side
  { color: "purple", rotate: -12, size: 1.0, left: "5%", top: "6%" },
  { color: "pink", rotate: 10, size: 0.78, left: "16%", top: "32%" },
  {
    color: "green",
    rotate: -6,
    size: 0.62,
    left: "7%",
    top: "52%",
    mobileHide: true,
  },
  {
    color: "yellow",
    rotate: 5,
    size: 0.7,
    left: "15%",
    top: "65%",
    mobileHide: true,
  },
  // Right side
  { color: "pink", rotate: 14, size: 0.72, left: "85%", top: "6%" },
  { color: "yellow", rotate: -8, size: 0.95, left: "74%", top: "22%" },
  {
    color: "green",
    rotate: 6,
    size: 0.6,
    left: "84%",
    top: "44%",
    mobileHide: true,
  },
  {
    color: "orange",
    rotate: -5,
    size: 0.68,
    left: "73%",
    top: "55%",
    mobileHide: true,
  },
]

// Gentle bob amplitude while floating at scattered positions
const FLOAT_AMP = 12
// Seconds before the drop

const DEFAULT_HERO_VIDEO = HERO_VIDEO_URL
const DEFAULT_HERO_POSTER = "/hero-video-poster.jpeg"

const DEFAULT_COPY = {
  headline: "Lego® Rinkinių\n==Prenumerata==\nVisiems",
  subtext:
    "Konstruok įspūdingiausius originalius LEGO® rinkinius be didelių išlaidų. Pasirink prenumeratą, išsirink norimą rinkinį, mėgaukis konstravimo procesu ir, baigęs, rinkis kitą projektą.",
  ctaPrimaryLabel: "Prenumeruoti",
  ctaSecondaryLabel: "Peržiūrėti rinkinius",
}

export default function Hero() {
  const bricksRef = useRef<HTMLDivElement>(null)
  const spanRef = useRef<HTMLSpanElement>(null)
  const [copy, setCopy] = useState(DEFAULT_COPY)
  const [posterUrl, setPosterUrl] = useState(DEFAULT_HERO_POSTER)
  const [videoUrl, setVideoUrl] = useState(DEFAULT_HERO_VIDEO)

  useEffect(() => {
    supabase
      .from("home_content")
      .select(
        "hero_headline, hero_subtext, hero_cta_primary_label, hero_cta_secondary_label, hero_poster_url, hero_video_url"
      )
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (!data) return
        setCopy({
          headline: data.hero_headline || DEFAULT_COPY.headline,
          subtext: data.hero_subtext || DEFAULT_COPY.subtext,
          ctaPrimaryLabel:
            data.hero_cta_primary_label || DEFAULT_COPY.ctaPrimaryLabel,
          ctaSecondaryLabel:
            data.hero_cta_secondary_label || DEFAULT_COPY.ctaSecondaryLabel,
        })
        if (data.hero_poster_url) setPosterUrl(data.hero_poster_url)
        if (data.hero_video_url) setVideoUrl(data.hero_video_url)
      })
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

  useGSAP(
    () => {
      const container = bricksRef.current
      if (!container) return
      const items = Array.from(
        container.querySelectorAll(":scope > div")
      ) as HTMLElement[]
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches

      if (prefersReducedMotion) {
        gsap.set(items, { autoAlpha: 1, y: 0 })
        return
      }

      // Appear in place with a slight upward nudge, then settle
      gsap.set(items, { autoAlpha: 0, y: -20 })
      gsap.to(items, {
        autoAlpha: 1,
        y: 0,
        duration: 0.55,
        ease: "power2.out",
        stagger: 0.07,
      })

      // Gentle independent bob at each brick's scattered position
      const bobTweens = items.map((item, i) =>
        gsap.to(item, {
          y: -FLOAT_AMP,
          duration: 1.2 + i * 0.09,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: i * 0.15,
        })
      )

      return () => {
        bobTweens.forEach((t) => t.kill())
      }
    },
    { scope: bricksRef }
  )

  return (
    <section className="relative overflow-hidden bg-paper">
      {/* Text + bricks — bricks are absolute within this wrapper, not the full section */}
      <div className="relative">
        <div className="relative z-10 mx-auto max-w-[1320px] px-4 pt-10 pb-10 text-center md:px-7 md:pt-14">
          {/* Social proof */}
          <div className="mb-8 flex items-center justify-center gap-3">
            <div className="flex">
              {avatarColors.map((color, i) => (
                <Avatar
                  key={i}
                  className="size-[28px] border-2 border-ink"
                  style={{ marginLeft: i === 0 ? 0 : -8 }}
                >
                  <AvatarFallback
                    style={{ background: color }}
                    className="text-xs font-bold text-ink"
                  >
                    {avatarInitials[i]}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <div className="flex items-center gap-1 text-[13px] text-ink/60">
              <span className="inline-flex items-center gap-0.5 font-bold text-ink">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon key={i} className="size-3 fill-current" />
                ))}{" "}
                4.9
              </span>
              {" · "}12 400+ kūrėjų
            </div>
          </div>

          {/* Headline */}
          <h1 className="heading-display text-d-hero tracking-[-0.02em] text-ink">
            <HeadingMarkup
              text={copy.headline}
              highlightRef={spanRef}
              highlightClassName="inline-block border-[3px] border-ink/30 bg-brand-yellow px-[.12em] text-ink shadow-[5px_5px_0_rgba(0,27,33,.12)]"
              highlightStyle={{
                transform: "rotate(-1.5deg)",
                transformOrigin: "center",
              }}
              onHighlightMouseEnter={onSpanEnter}
              onHighlightMouseLeave={onSpanLeave}
            />
          </h1>

          {/* Subtext */}
          <p className="mx-auto mt-7 max-w-[52ch] text-[17px] leading-[1.65] text-ink/65">
            {copy.subtext}
          </p>

          {/* CTAs */}
          <div className="mt-9 flex w-full justify-center gap-3 md:w-auto md:flex-wrap">
            <Button
              asChild
              size="lg"
              className="brick-hover-sm flex-1 rounded-full border-2 border-ink bg-brand-yellow text-[16px] font-bold text-ink hover:bg-brand-yellow hover:text-ink md:flex-none [a]:hover:bg-brand-yellow"
            >
              <a href="#subscriptions">
                {copy.ctaPrimaryLabel} <ArrowRightIcon data-icon="inline-end" />
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="brick-hover-sm flex-1 rounded-full border-2 border-ink bg-paper text-[16px] font-bold text-ink hover:bg-paper hover:text-ink md:flex-none"
            >
              <a href="/archive">{copy.ctaSecondaryLabel}</a>
            </Button>
          </div>
        </div>

        {/* Bricks scoped to text area — top percentages relative to text height, not full section */}
        <div ref={bricksRef} className="pointer-events-none absolute inset-0">
          {bricks.map(({ left, top, mobileHide, ...b }, i) => (
            <div
              key={i}
              className={`absolute ${mobileHide ? "hidden lg:block" : ""}`}
              style={{ left, top }}
            >
              <Brick {...b} />
            </div>
          ))}
        </div>
      </div>

      {/* Video below bricks scope */}
      <div className="mx-auto max-w-[1320px] px-4 pb-16 md:px-7">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[28px] border-2 border-ink shadow-[6px_6px_0_#001B21] md:aspect-[16/7] md:rounded-3xl">
          <img
            src={posterUrl}
            alt="BRICKTIME hero"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <video
            key={videoUrl}
            className="relative z-[1] h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster={posterUrl}
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
        </div>
      </div>
    </section>
  )
}
