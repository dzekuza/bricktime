import { useEffect, useRef } from 'react'

export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const targets = el.querySelectorAll<HTMLElement>('.reveal')
    if (targets.length === 0) return

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const target = e.target as HTMLElement
            target.classList.add('visible')
            target.addEventListener('transitionend', () => {
              target.style.transitionDelay = ''
              target.classList.remove('reveal')
            }, { once: true })
            io.unobserve(target)
          }
        })
      },
      { threshold: 0.12 }
    )

    targets.forEach((t) => io.observe(t))
    return () => io.disconnect()
  }, [])

  return ref
}
