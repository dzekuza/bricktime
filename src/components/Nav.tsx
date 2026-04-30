import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const links = [
  { label: 'Pradžia', to: '/' },
  { label: 'Produktai', to: '/archive' },
  { label: 'Planai', to: '/plans' },
  { label: 'Paskyra', to: '/account' },
]

export default function Nav() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  useEffect(() => { setOpen(false) }, [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <nav
        className="sticky top-0 z-50"
        style={{ background: '#FFFFFF' }}
      >
        <div className="mx-auto grid h-[84px] max-w-[1320px] grid-cols-3 items-center px-7">

          {/* Left — desktop nav links */}
          <div className="hidden items-center gap-7 md:flex">
            {links.map((l) => {
              const isActive = l.to === '/' ? pathname === '/' : pathname.startsWith(l.to.split('#')[0]) && l.to !== '/'
              return (
                <Link
                  key={l.label}
                  to={l.to}
                  className={`relative text-[15px] font-semibold text-ink transition-opacity hover:opacity-70 ${isActive ? "after:absolute after:-bottom-1.5 after:left-0 after:right-0 after:h-[3px] after:bg-ink after:content-['']" : ''}`}
                >
                  {l.label}
                </Link>
              )
            })}
          </div>

          
          <Link to="/" className="flex items-center justify-self-center">
            <video
              src="/nav-logo.mov"
              autoPlay
              loop
              muted
              playsInline
              className="h-16 w-auto object-contain"
            />
          </Link>

          {/* Right — CTA + hamburger */}
          <div className="flex items-center justify-end gap-3">
            <Button
              asChild
              size="sm"
              className="hidden rounded-full border-2 border-ink bg-ink text-paper font-bold hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#001B21] transition-all md:inline-flex"
            >
              <Link to="/subscribe">Prenumeruoti →</Link>
            </Button>

            {/* Account avatar */}
            <Link
              to="/account"
              className="hidden size-9 items-center justify-center overflow-hidden rounded-full border-2 border-ink bg-brand-yellow transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#001B21] md:flex"
              aria-label="Paskyra"
            >
              <img src="/avatars/avatar-classic.png" alt="Paskyra" className="h-full w-full object-cover" />
            </Link>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex size-10 flex-col items-center justify-center gap-[5px] rounded-full border-2 border-ink bg-paper md:hidden"
              aria-label={open ? 'Uždaryti meniu' : 'Atidaryti meniu'}
            >
              <span
                className="block h-[2px] w-5 bg-ink transition-all duration-200"
                style={{ transform: open ? 'translateY(7px) rotate(45deg)' : 'none' }}
              />
              <span
                className="block h-[2px] w-5 bg-ink transition-all duration-200"
                style={{ opacity: open ? 0 : 1 }}
              />
              <span
                className="block h-[2px] w-5 bg-ink transition-all duration-200"
                style={{ transform: open ? 'translateY(-7px) rotate(-45deg)' : 'none' }}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div
        className="fixed inset-0 z-40 md:hidden"
        style={{ pointerEvents: open ? 'all' : 'none' }}
      >
        <div
          className="absolute inset-0 bg-ink/60 transition-opacity duration-300"
          style={{ opacity: open ? 1 : 0 }}
          onClick={() => setOpen(false)}
        />

        <div
          className="absolute right-0 top-0 flex h-full w-[80vw] max-w-[340px] flex-col border-l-2 border-ink"
          style={{
            background: '#FFFFFF',
            transform: open ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.28s cubic-bezier(0.32, 0, 0.16, 1)',
          }}
        >
          <div className="flex h-[84px] items-center justify-between border-b-2 border-ink px-6">
            <span className="uppercase text-ink" style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>
              Meniu
            </span>
            <button
              onClick={() => setOpen(false)}
              className="grid size-9 place-items-center rounded-full border-2 border-ink text-ink"
              aria-label="Uždaryti meniu"
            >
              ✕
            </button>
          </div>

          <nav className="flex flex-col px-6 pt-4">
            {links.map((l, i) => {
              const isActive = l.to === '/' ? pathname === '/' : pathname.startsWith(l.to.split('#')[0]) && l.to !== '/'
              return (
                <Link
                  key={l.label}
                  to={l.to}
                  className="flex items-center justify-between border-b-2 border-ink/10 py-5 text-[22px] font-bold uppercase text-ink transition-opacity hover:opacity-60"
                  style={{
                    fontFamily: 'var(--font-display)',
                    opacity: open ? 1 : 0,
                    transform: open ? 'translateX(0)' : 'translateX(16px)',
                    transition: `opacity 0.22s ease ${i * 40}ms, transform 0.22s ease ${i * 40}ms`,
                  }}
                >
                  {l.label}
                  {isActive && <span className="size-2 rounded-full bg-brand-yellow border-2 border-ink" />}
                </Link>
              )
            })}
          </nav>

          <div
            className="mt-auto border-t-2 border-ink p-6"
            style={{
              opacity: open ? 1 : 0,
              transform: open ? 'translateY(0)' : 'translateY(12px)',
              transition: 'opacity 0.25s ease 220ms, transform 0.25s ease 220ms',
            }}
          >
            <Link
              to="/subscribe"
              className="flex w-full items-center justify-center rounded-full border-2 border-ink bg-ink py-4 text-center font-bold text-[16px] text-paper"
            >
              Prenumeruoti →
            </Link>
            <p className="mt-3 text-center font-mono text-[10px] tracking-[.14em] uppercase text-ink/40">
              Atšauk bet kada · Nemokamas pristatymas
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
