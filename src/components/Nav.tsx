import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Breadcrumb from '@/components/Breadcrumb'
import { MenuIcon, XIcon, ArrowRightIcon, UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAuth } from '@/hooks/useAuth'
import { avatarSrc } from '@/lib/avatars'
import { AuthForm } from '@/components/AuthForm'
import { usePlans } from '@/hooks/usePlans'

const PLAN_COLORS: Record<string, { bg: string; text: string }> = {
  nano:     { bg: '#F5F1EB', text: '#001B21' },
  mini:     { bg: '#FFAEE7', text: '#001B21' },
  standard: { bg: '#FFD731', text: '#001B21' },
  pro:      { bg: '#4DA2FF', text: '#001B21' },
  mega:     { bg: '#FB4903', text: '#F5F1EB' },
  mystery_s: { bg: '#FFD731', text: '#001B21' },
  mystery_m: { bg: '#FB4903', text: '#F5F1EB' },
}

const links = [
  { label: 'Rinkiniai', to: '/archive' },
  { label: 'Merch', to: '/merch' },
  { label: 'Dovanų kortelės', to: '/gift-cards' },
  { label: 'Bendruomenė', to: '/community' },
]

// ── Avatar button ─────────────────────────────────────────────────────────────

function AvatarPopover() {
  const { user, profile } = useAuth()
  const [open, setOpen] = useState(false)

  const avatarId = profile?.avatarId ?? 0
  const avatarBg = profile?.avatarBg ?? '#FFD731'

  if (user) {
    return (
      <Link
        to="/account"
        className="flex size-9 items-center justify-center overflow-hidden rounded-full border-2 border-ink brick-hover-sm"
        style={{ background: avatarBg }}
        aria-label="Paskyra"
      >
        <img src={avatarSrc(avatarId)} alt="Paskyra" className="h-full w-full object-cover" />
      </Link>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex size-9 items-center justify-center overflow-hidden rounded-full border-2 border-ink brick-hover-sm"
          style={{ background: avatarBg }}
          aria-label="Prisijungti"
        >
          <UserIcon className="size-4 text-ink" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 rounded-2xl border-2 border-ink p-4 shadow-[6px_6px_0_#001B21] bg-paper" style={{ transformOrigin: 'var(--radix-popover-content-transform-origin)' }}>
        <AuthForm onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}

// ── Plan chip (shown when subscribed) ────────────────────────────────────────

function PlanChip({ plan }: { plan: string }) {
  const { plans } = usePlans()
  const dbPlan = plans.find(p => p.id === plan)
  const bg = dbPlan?.bg_color ?? PLAN_COLORS[plan]?.bg ?? '#F5F1EB'
  const text = dbPlan?.text_color ?? PLAN_COLORS[plan]?.text ?? '#001B21'
  const name = dbPlan?.name ?? (plan.charAt(0).toUpperCase() + plan.slice(1))

  return (
    <Link
      to="/account"
      className="hidden md:flex items-center gap-2 rounded-full border-2 border-ink px-3 py-1.5 brick-hover-sm"
      style={{ background: bg }}
    >
      <span className="font-mono text-[11px] font-bold tracking-[.12em] uppercase" style={{ color: text }}>
        {name}
      </span>
    </Link>
  )
}

// ── Nav ───────────────────────────────────────────────────────────────────────

export default function Nav() {
  const { pathname } = useLocation()
  const { user, profile } = useAuth()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => { setOpen(false) }, [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <nav className="sticky top-0 z-50 py-4 md:py-6 bg-transparent">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
        <div className={['flex h-[84px] items-center justify-between px-7 md:grid md:grid-cols-[1fr_auto_1fr] border-2 border-ink rounded-[28px] transition-all duration-300 bg-paper', scrolled ? 'shadow-[6px_6px_0_#001B21]' : 'shadow-none'].join(' ')}>

          {/* Left — desktop nav links */}
          <div className="hidden items-center gap-7 md:flex">
            {links.map((l) => {
              const isActive = l.to === '/' ? pathname === '/' : pathname.startsWith(l.to.split('#')[0]) && l.to !== '/'
              return (
                <Link
                  key={l.label}
                  to={l.to}
                  className={`relative text-[15px] font-semibold text-ink after:absolute after:-bottom-1.5 after:left-0 after:right-0 after:h-[3px] after:bg-ink after:content-[''] after:transition-transform after:duration-200 after:origin-left ${isActive ? 'after:scale-x-100' : 'after:scale-x-0 hover:after:scale-x-100'}`}
                >
                  {l.label}
                </Link>
              )
            })}
          </div>

          <Link to="/" className="flex items-center md:justify-self-center">
            <video src="/nav-logo.mov" autoPlay loop muted playsInline className="h-16 w-auto object-contain" />
          </Link>

          {/* Right — CTA + avatar + hamburger */}
          <div className="flex items-center justify-end gap-3">
            <Link
              to="/subscribe"
              className={`hidden md:flex relative text-[15px] font-semibold text-ink after:absolute after:-bottom-1.5 after:left-0 after:right-0 after:h-[3px] after:bg-ink after:content-[''] after:transition-transform after:duration-200 after:origin-left ${pathname.startsWith('/subscribe') ? 'after:scale-x-100' : 'after:scale-x-0 hover:after:scale-x-100'}`}
            >
              Planai
            </Link>
            {user && profile?.plan ? (
              <PlanChip plan={profile.plan} />
            ) : (
              <Button
                asChild
                size="sm"
                className="hidden rounded-full border-2 border-ink bg-ink text-paper font-bold brick-hover-sm md:inline-flex"
              >
                <Link to="/subscribe">Prenumeruoti <ArrowRightIcon data-icon="inline-end" /></Link>
              </Button>
            )}

            <AvatarPopover />

            <button
              onClick={() => setOpen((v) => !v)}
              className="grid size-10 place-items-center rounded-full border-2 border-ink bg-paper md:hidden"
              aria-label={open ? 'Uždaryti meniu' : 'Atidaryti meniu'}
            >
              {open ? <XIcon className="size-5 text-ink" /> : <MenuIcon className="size-5 text-ink" />}
            </button>
          </div>
        </div>
        </div>
      </nav>

      <Breadcrumb />

      {/* Mobile drawer */}
      <div
        className="fixed left-0 right-0 bottom-0 z-40 md:hidden flex flex-col border-t border-ink/10 bg-paper/95 backdrop-blur-lg"
        style={{
          top: '96px',
          opacity: open ? 1 : 0,
          transform: open ? 'translateY(0)' : 'translateY(-8px)',
          pointerEvents: open ? 'all' : 'none',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
        }}
      >
        <div className="flex h-full flex-col justify-between gap-4 p-5">
          {/* Nav links */}
          <nav className="flex flex-col gap-1">
            {links.map((l, i) => {
              const isActive = l.to === '/' ? pathname === '/' : pathname.startsWith(l.to.split('#')[0]) && l.to !== '/'
              return (
                <Link
                  key={l.label}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-[16px] font-semibold text-ink transition-colors hover:bg-ink/5 ${isActive ? 'bg-ink/5' : ''}`}
                  style={{
                    opacity: open ? 1 : 0,
                    transform: open ? 'translateY(0)' : 'translateY(-6px)',
                    transition: `opacity 0.18s ease ${i * 30}ms, transform 0.18s ease ${i * 30}ms`,
                  }}
                >
                  {l.label}
                  {isActive && <span className="size-2 rounded-full bg-brand-yellow border-2 border-ink" />}
                </Link>
              )
            })}
          </nav>

          {/* CTA */}
          {!(user && profile?.plan) && (
            <Link
              to="/subscribe"
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center rounded-full border-2 border-ink bg-ink py-3.5 text-center font-bold text-[15px] text-paper brick-hover-sm"
              style={{
                opacity: open ? 1 : 0,
                transition: 'opacity 0.2s ease 120ms',
              }}
            >
              Prenumeruoti <ArrowRightIcon className="inline size-4 ml-1" />
            </Link>
          )}
        </div>
      </div>
    </>
  )
}
