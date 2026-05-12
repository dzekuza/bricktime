import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)

interface FloatDropProps {
  children: React.ReactNode
  className?: string
  /** Delay before first item starts (seconds) */
  delay?: number
  /** How long each item bobs in the air (seconds) — skipped when fromY < -100 */
  floatDuration?: number
  /** Stagger offset between sibling items (seconds) */
  stagger?: number
  /** Trigger on scroll into viewport (default true) */
  startOnView?: boolean
  /** Starting Y offset — negative = above resting position. Large values (e.g. -600) make items fall from off-screen */
  fromY?: number
}

export default function FloatDrop({
  children,
  className,
  delay = 0,
  floatDuration = 1.0,
  stagger = 0.12,
  startOnView = true,
  fromY = -40,
}: FloatDropProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    (_, contextSafe) => {
      const container = containerRef.current
      if (!container) return

      const items = Array.from(container.children) as HTMLElement[]
      if (items.length === 0) return

      const mm = gsap.matchMedia()

      mm.add(
        {
          motion: '(prefers-reduced-motion: no-preference)',
          reduced: '(prefers-reduced-motion: reduce)',
        },
        (ctx) => {
          const { reduced } = ctx.conditions as { motion: boolean; reduced: boolean }

          if (reduced) {
            gsap.set(items, { autoAlpha: 1, y: 0 })
            return
          }

          gsap.set(items, { autoAlpha: 0, y: fromY })

          const bigDrop = fromY < -100

          const run = () => {
            items.forEach((item, i) => {
              // slight per-brick duration variation so they don't all land identically
              const fallDuration = 1.05 + (i % 4) * 0.07
              const tl = gsap.timeline({ delay: delay + i * stagger })
              if (bigDrop) {
                // fade in over first ~35% of fall so brick materialises mid-air
                tl.to(item, { autoAlpha: 1, duration: fallDuration * 0.35, ease: 'power2.out' })
                // fall starts at the same moment as the fade
                tl.to(item, { y: 0, duration: fallDuration, ease: 'bounce.out' }, '<')
              } else {
                tl.to(item, { autoAlpha: 1, y: fromY + 22, duration: 0.45, ease: 'power2.out' })
                tl.to(item, { y: fromY + 16, duration: floatDuration / 2, ease: 'sine.inOut', yoyo: true, repeat: 1 })
                tl.to(item, { y: 0, duration: 0.55, ease: 'bounce.out' })
              }
            })
          }

          if (startOnView) {
            // contextSafe wraps the IO callback so tweens are tracked by the context
            const safeRun = contextSafe!(run)
            const io = new IntersectionObserver(
              (entries) => {
                entries.forEach((e) => {
                  if (e.isIntersecting) {
                    safeRun()
                    io.unobserve(e.target)
                  }
                })
              },
              { threshold: 0.15 }
            )
            io.observe(container)
            return () => io.disconnect()
          } else {
            run()
          }
        }
      )

      return () => mm.revert()
    },
    { scope: containerRef, dependencies: [delay, floatDuration, stagger, startOnView, fromY] }
  )

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}
