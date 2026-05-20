import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ArrowRightIcon, StarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getPlanBrickImage } from '@/lib/plan-branding'

gsap.registerPlugin(useGSAP)

const avatarColors = ['#5DDB9C', '#FFAEE7', '#FB4903', '#4DA2FF']
const avatarInitials = ['MK', 'TJ', 'AR', 'LP']

interface BrickProps {
  plan: 'nano' | 'mini' | 'standard' | 'pro' | 'mega'
  rotate?: number
  size?: number
}

function Brick({ plan, rotate = 0, size = 1 }: BrickProps) {
  const image = getPlanBrickImage(plan)

  if (!image) return null

  return (
    <img
      src={image}
      alt=""
      className="brick-el select-none object-contain w-[60px] lg:w-[110px]"
      style={{
        transform: `rotate(${rotate}deg) scale(${size})`,
        display: 'block',
        flexShrink: 0,
        height: 'auto',
      }}
    />
  )
}

interface BrickEntry extends BrickProps {
  left: string
  top: string
  mobileHide?: boolean
}

// Scattered around the heading like a loose orbit — different heights on each side
const bricks: BrickEntry[] = [
  // Left side — outer → inner → outer → inner, top to bottom
  { plan: 'mini',     rotate: -15, size: 0.85, left: '6%',  top: '8%'  },
  { plan: 'mega',     rotate:   8, size: 1.0,  left: '18%', top: '30%' },
  { plan: 'standard', rotate:  -6, size: 0.68, left: '9%',  top: '48%', mobileHide: true },
  { plan: 'nano',     rotate:   4, size: 0.62, left: '17%', top: '58%', mobileHide: true },
  // Right side — outer → inner → outer → inner, top to bottom
  { plan: 'pro',      rotate:  12, size: 0.78, left: '85%', top: '8%'  },
  { plan: 'nano',     rotate:  -8, size: 0.85, left: '74%', top: '23%' },
  { plan: 'mini',     rotate:   6, size: 0.90, left: '83%', top: '40%', mobileHide: true },
  { plan: 'standard', rotate:  -4, size: 0.65, left: '73%', top: '52%', mobileHide: true },
]

// Gentle bob amplitude while floating at scattered positions
const FLOAT_AMP = 12
// Seconds before the drop

export default function Hero() {
  const bricksRef = useRef<HTMLDivElement>(null)
  const spanRef = useRef<HTMLSpanElement>(null)

  function onSpanEnter() {
    gsap.killTweensOf(spanRef.current)
    gsap.to(spanRef.current, { rotate: 4, scale: 1.12, boxShadow: '8px 8px 0 #001B21', duration: 0.22, ease: 'back.out(2.5)' })
  }
  function onSpanLeave() {
    gsap.killTweensOf(spanRef.current)
    gsap.to(spanRef.current, { rotate: -1.5, scale: 1, boxShadow: '0px 0px 0 #001B21', duration: 0.28, ease: 'elastic.out(1, 0.55)' })
  }

  useGSAP(
    () => {
      const container = bricksRef.current
      if (!container) return
      const items = Array.from(container.querySelectorAll(':scope > div')) as HTMLElement[]
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

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
        ease: 'power2.out',
        stagger: 0.07,
      })

      // Gentle independent bob at each brick's scattered position
      const bobTweens = items.map((item, i) =>
        gsap.to(item, {
          y: -FLOAT_AMP,
          duration: 1.2 + i * 0.09,
          ease: 'sine.inOut',
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
    <section className="relative bg-paper overflow-hidden">
      {/* Text + bricks — bricks are absolute within this wrapper, not the full section */}
      <div className="relative">
      <div className="relative z-10 mx-auto max-w-[1320px] px-4 md:px-7 pt-10 md:pt-14 pb-10 text-center">
        {/* Social proof */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex">
            {avatarColors.map((color, i) => (
              <Avatar
                key={i}
                className="size-[28px] border-2 border-ink"
                style={{ marginLeft: i === 0 ? 0 : -8 }}
              >
                <AvatarFallback style={{ background: color }} className="text-ink font-bold text-xs">{avatarInitials[i]}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <div className="text-[13px] text-ink/60">
            <span className="inline-flex items-center gap-0.5 font-bold text-ink">
              {Array.from({ length: 5 }).map((_, i) => <StarIcon key={i} className="size-3 fill-current" />)}
              {' '}4.9
            </span>
            {' · '}12 400+ kūrėjų
          </div>
        </div>

        {/* Headline */}
        <h1
          className="heading-display text-d-hero tracking-[-0.02em] text-ink"
        >
          Praplėsk savo{' '}
          <span
            ref={spanRef}
            className="inline-block border-[3px] border-ink/30 bg-brand-yellow px-[.12em] text-ink shadow-[5px_5px_0_rgba(0,27,33,.12)]"
            style={{ transform: 'rotate(-1.5deg)', transformOrigin: 'center' }}
            onMouseEnter={onSpanEnter}
            onMouseLeave={onSpanLeave}
          >
            kaladėlių
          </span>
          <br />
          <span className="inline-block italic skew-x-[-8deg]">
            kolekciją
          </span>
          <br />
          protingiau.
        </h1>

        {/* Subtext */}
        <p className="mt-7 mx-auto max-w-[52ch] text-[17px] leading-[1.65] text-ink/65">
          Kas mėnesį į pašto dėžutę tilpstantis rinkinys su aukštos kokybės kaladėlėmis, išskirtiniais
          miniukais ir surinkimo kortele. Atšauk, keisk ar praleisk bet kurį mėnesį — kaladėlės amžinai.
        </p>

        {/* CTAs */}
        <div className="mt-9 flex gap-3 w-full justify-center md:flex-wrap md:w-auto">
          <Button
            asChild
            size="lg"
            className="flex-1 md:flex-none rounded-full border-2 border-ink bg-brand-yellow text-ink font-bold text-[16px] hover:bg-brand-yellow [a]:hover:bg-brand-yellow hover:text-ink brick-hover-sm"
          >
            <a href="#plans">Prenumeruoti <ArrowRightIcon data-icon="inline-end" /></a>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="flex-1 md:flex-none rounded-full border-2 border-ink bg-paper text-ink text-[16px] font-bold hover:bg-paper hover:text-ink brick-hover-sm"
          >
            <a href="/archive"><span className="md:hidden">Produktai</span><span className="hidden md:inline">Žiūrėti ankstesnius produktus</span></a>
          </Button>
        </div>

      </div>

      {/* Bricks scoped to text area — top percentages relative to text height, not full section */}
      <div ref={bricksRef} className="absolute inset-0 pointer-events-none">
        {bricks.map(({ left, top, mobileHide, ...b }, i) => (
          <div key={i} className={`absolute${mobileHide ? ' hidden lg:block' : ''}`} style={{ left, top }}>
            <Brick {...b} />
          </div>
        ))}
      </div>
      </div>

      {/* Video below bricks scope */}
      <div className="mx-auto max-w-[1320px] px-4 md:px-7 pb-16">
        <div className="w-full overflow-hidden rounded-[28px] md:rounded-3xl border-2 border-ink shadow-[6px_6px_0_#001B21] aspect-[4/3] md:aspect-[16/7]">
          <video
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src="/hero-video.mp4" type="video/mp4" />
          </video>
        </div>
      </div>
    </section>
  )
}
