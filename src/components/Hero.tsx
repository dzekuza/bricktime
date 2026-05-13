import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ArrowRightIcon, StarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getPlanBrickImage } from '@/lib/plan-branding'

gsap.registerPlugin(useGSAP)

const avatarColors = ['#5DDB9C', '#FFAEE7', '#FB4903', '#4DA2FF']

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
      className="brick-el select-none object-contain"
      style={{
        transform: `rotate(${rotate}deg) scale(${size})`,
        display: 'block',
        flexShrink: 0,
        width: 110,
        height: 'auto',
      }}
    />
  )
}

interface BrickEntry extends BrickProps {
  left: string
  top: string
  landOn: 'video' | 'floor'
}

// Scattered around the heading like a loose orbit — different heights on each side
// landOn: 'video' drops onto the video surface, 'floor' falls to section bottom
const bricks: BrickEntry[] = [
  { plan: 'standard', rotate: -8,  size: 0.9,  left: '3%',  top: '8%',  landOn: 'floor' },
  { plan: 'nano',     rotate: 6,   size: 0.72, left: '82%', top: '6%',  landOn: 'video' },
  { plan: 'mega',     rotate: -4,  size: 0.92, left: '1%',  top: '40%', landOn: 'floor' },
  { plan: 'standard', rotate: 10,  size: 0.96, left: '85%', top: '35%', landOn: 'floor' },
  { plan: 'mini',     rotate: -12, size: 0.78, left: '6%',  top: '68%', landOn: 'floor' },
  { plan: 'pro',      rotate: 5,   size: 0.9,  left: '78%', top: '62%', landOn: 'video' },
  { plan: 'nano',     rotate: -6,  size: 0.82, left: '30%', top: '22%', landOn: 'video' },
  { plan: 'standard', rotate: 13,  size: 0.72, left: '60%', top: '18%', landOn: 'video' },
]

// Gentle bob amplitude while floating at scattered positions
const FLOAT_AMP = 12
// Seconds before the drop
const DROP_DELAY = 5

export default function Hero() {
  const bricksRef = useRef<HTMLDivElement>(null)
  const spanRef = useRef<HTMLSpanElement>(null)
  const videoWrapRef = useRef<HTMLDivElement>(null)

  function onSpanEnter() {
    gsap.killTweensOf(spanRef.current)
    gsap.to(spanRef.current, { rotate: 4, scale: 1.12, boxShadow: '8px 8px 0 #001B21', duration: 0.22, ease: 'back.out(2.5)' })
  }
  function onSpanLeave() {
    gsap.killTweensOf(spanRef.current)
    gsap.to(spanRef.current, { rotate: -1.5, scale: 1, boxShadow: '0px 0px 0 #001B21', duration: 0.28, ease: 'elastic.out(1, 0.55)' })
  }

  useGSAP(
    (_, contextSafe) => {
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

      // After DROP_DELAY seconds: drop bricks — some onto video surface, rest to floor
      const dropCall = gsap.delayedCall(
        DROP_DELAY,
        contextSafe!(() => {
          bobTweens.forEach((t) => t.kill())
          const containerH = container.offsetHeight
          const containerTop = container.getBoundingClientRect().top
          const videoTop = videoWrapRef.current
            ? videoWrapRef.current.getBoundingClientRect().top - containerTop
            : containerH

          items.forEach((item, i) => {
            const floorY = containerH - item.offsetTop - item.offsetHeight
            const videoY = videoTop - item.offsetTop - item.offsetHeight
            const targetY = bricks[i].landOn === 'video' ? videoY : floorY
            gsap.to(item, {
              y: targetY,
              duration: 0.9 + (i % 4) * 0.08,
              ease: 'bounce.out',
              delay: i * 0.06,
            })
          })
        })
      )

      return () => {
        bobTweens.forEach((t) => t.kill())
        dropCall.kill()
      }
    },
    { scope: bricksRef }
  )

  return (
    <section className="relative bg-paper overflow-hidden min-h-[88vh]">
      {/* Text content */}
      <div className="mx-auto max-w-[1320px] px-4 md:px-7 pt-10 md:pt-14 pb-16 text-center">
        {/* Social proof */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex">
            {avatarColors.map((color, i) => (
              <span
                key={i}
                className="size-[28px] rounded-full border-2 border-ink/20"
                style={{ background: color, marginLeft: i === 0 ? 0 : -8 }}
              />
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
            className="flex-1 md:flex-none rounded-full border-2 border-ink bg-brand-yellow text-ink font-bold text-[16px] hover:bg-brand-yellow hover:text-ink brick-hover-sm"
          >
            <a href="#plans">Prenumeruoti <ArrowRightIcon data-icon="inline-end" /></a>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="flex-1 md:flex-none rounded-full border-2 border-ink bg-transparent text-ink text-[16px] font-bold hover:bg-transparent hover:text-ink brick-hover-sm"
          >
            <a href="/archive"><span className="md:hidden">Produktai</span><span className="hidden md:inline">Žiūrėti ankstesnius produktus</span></a>
          </Button>
        </div>

        {/* Hero video / fallback image */}
        <div ref={videoWrapRef} className="mt-8 md:mt-10 w-full overflow-hidden rounded-[28px] md:rounded-3xl border-2 border-ink shadow-[6px_6px_0_#001B21] aspect-[4/3] md:aspect-[16/7]">
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

      {/* Bricks pinned to section bottom — float up from there, drop back with bounce */}
      <div ref={bricksRef} className="absolute inset-0 pointer-events-none">
        {bricks.map(({ left, top, ...b }, i) => (
          <div key={i} className="absolute" style={{ left, top }}>
            <Brick {...b} />
          </div>
        ))}
      </div>
    </section>
  )
}
