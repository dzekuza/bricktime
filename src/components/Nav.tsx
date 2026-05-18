import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MenuIcon, XIcon, ArrowRightIcon, UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { avatarSrc } from '@/lib/avatars'

const PLAN_BUDGETS: Record<string, number> = { nano: 50, mini: 100, standard: 200, pro: 400, mega: 600 }
const PLAN_COLORS: Record<string, { bg: string; text: string }> = {
  nano:     { bg: '#F5F1EB', text: '#001B21' },
  mini:     { bg: '#FFAEE7', text: '#001B21' },
  standard: { bg: '#FFD731', text: '#001B21' },
  pro:      { bg: '#4DA2FF', text: '#001B21' },
  mega:     { bg: '#FB4903', text: '#F5F1EB' },
}

const links = [
  { label: 'Pradžia', to: '/' },
  { label: 'Produktai', to: '/archive' },
  { label: 'Merch', to: '/merch' },
  { label: 'Planai', to: '/subscribe' },
  { label: 'Bendruomenė', to: '/community' },
]

// ── Auth form (sign in + register) ───────────────────────────────────────────

function AuthForm({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<'signin' | 'register'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      setLoading(false)
      if (error) setError(error.message)
      else onClose()
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } })
      if (!error && data.user) {
        // upsert subscriber profile
        await supabase.from('subscribers').upsert({
          id: data.user.id,
          name: name || email.split('@')[0],
          email,
          avatar_id: Math.floor(Math.random() * 5),
          avatar_bg: ['#FFD731','#FB4903','#4DA2FF','#5DDB9C','#FFAEE7'][Math.floor(Math.random() * 5)],
        })
      }
      setLoading(false)
      if (error) setError(error.message)
      else {
        setSuccess('Paskyra sukurta! Patikrink el. paštą arba prisijunk.')
        setMode('signin')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-1">
      {/* Tab toggle */}
      <div className="flex rounded-xl border-2 border-ink/15 overflow-hidden">
        {(['signin', 'register'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setError(''); setSuccess('') }}
            className={`flex-1 py-1.5 font-mono text-[11px] font-bold transition-colors ${mode === m ? 'bg-ink text-paper' : 'text-ink/40 hover:text-ink'}`}
          >
            {m === 'signin' ? 'Prisijungti' : 'Registruotis'}
          </button>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateRows: mode === 'register' ? '1fr' : '0fr',
          opacity: mode === 'register' ? 1 : 0,
          transition: 'grid-template-rows 0.2s ease-out, opacity 0.2s ease-out',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <input
            type="text"
            placeholder="Vardas"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required={mode === 'register'}
            className="mb-0 w-full rounded-xl border-2 border-ink/20 bg-paper px-3 py-2 font-mono text-[13px] text-ink outline-none focus:border-ink transition-colors"
          />
        </div>
      </div>
      <input
        type="email"
        placeholder="El. paštas"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="rounded-xl border-2 border-ink/20 bg-paper px-3 py-2 font-mono text-[13px] text-ink outline-none focus:border-ink transition-colors"
      />
      <input
        type="password"
        placeholder="Slaptažodis"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
        className="rounded-xl border-2 border-ink/20 bg-paper px-3 py-2 font-mono text-[13px] text-ink outline-none focus:border-ink transition-colors"
      />

      {error && <p className="font-mono text-[11px] text-red-500">{error}</p>}
      {success && <p className="font-mono text-[11px] text-green-600">{success}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl border-2 border-ink bg-ink py-2 font-mono text-[12px] font-bold text-paper hover:opacity-80 disabled:opacity-40 transition-all"
      >
        {loading ? '…' : mode === 'signin' ? 'Prisijungti' : 'Sukurti paskyrą'}
      </button>
    </form>
  )
}

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
  const budget = PLAN_BUDGETS[plan] ?? 0
  const colors = PLAN_COLORS[plan] ?? { bg: '#F5F1EB', text: '#001B21' }

  return (
    <Link
      to="/account"
      className="hidden md:flex items-center gap-2.5 rounded-full border-2 border-ink px-3 py-1.5 brick-hover-sm"
      style={{ background: colors.bg }}
    >
      <span className="font-mono text-[11px] font-bold tracking-[.12em] uppercase" style={{ color: colors.text }}>
        {plan.charAt(0).toUpperCase() + plan.slice(1)}
      </span>
      <div className="flex items-center gap-1.5">
        <div className="h-[6px] w-[52px] rounded-full overflow-hidden border border-black/20">
          <div
            className="h-full rounded-full"
            style={{ width: '100%', background: colors.text === '#001B21' ? '#001B21' : '#F5F1EB', opacity: 0.25 }}
          />
        </div>
        <span className="font-mono text-[10px]" style={{ color: `${colors.text}99` }}>
          €{budget}
        </span>
      </div>
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
      <nav className="sticky top-0 z-50 pt-3 px-3 bg-transparent">
        <div className={['mx-auto flex h-[84px] max-w-[1320px] items-center justify-between px-7 md:grid md:grid-cols-3 border-2 border-ink rounded-2xl transition-all duration-300 bg-paper', scrolled ? 'shadow-[6px_6px_0_#001B21]' : 'shadow-none'].join(' ')}>

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

          <Link to="/" className="flex items-center md:justify-self-center">
            <video src="/nav-logo.mov" autoPlay loop muted playsInline className="h-16 w-auto object-contain" />
          </Link>

          {/* Right — CTA + avatar + hamburger */}
          <div className="flex items-center justify-end gap-3">
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
      </nav>

      {/* Mobile drawer */}
      <div className="fixed inset-0 z-40 md:hidden" style={{ pointerEvents: open ? 'all' : 'none' }}>
        <div
          className="absolute inset-0 bg-ink/60 transition-opacity duration-300"
          style={{ opacity: open ? 1 : 0 }}
          onClick={() => setOpen(false)}
        />
        <div
          className="absolute left-0 top-0 w-full flex flex-col border-b-2 border-ink bg-paper"
          style={{
            transform: open ? 'translateY(0)' : 'translateY(-100%)',
            transition: 'transform 0.28s cubic-bezier(0.32, 0, 0.16, 1)',
          }}
        >
          <nav className="flex flex-col px-6 pt-[84px]">
            {links.map((l, i) => {
              const isActive = l.to === '/' ? pathname === '/' : pathname.startsWith(l.to.split('#')[0]) && l.to !== '/'
              return (
                <Link
                  key={l.label}
                  to={l.to}
                  className="flex items-center justify-between border-b-2 border-ink/10 py-5 text-[22px] font-bold uppercase text-ink transition-opacity hover:opacity-60 font-display"
                  style={{
                    opacity: open ? 1 : 0,
                    transform: open ? 'translateY(0)' : 'translateY(-10px)',
                    transition: `opacity 0.22s cubic-bezier(.22,1,.36,1) ${i * 40}ms, transform 0.22s cubic-bezier(.22,1,.36,1) ${i * 40}ms`,
                  }}
                >
                  {l.label}
                  {isActive && <span className="size-2 rounded-full bg-brand-yellow border-2 border-ink" />}
                </Link>
              )
            })}
          </nav>

          {!(user && profile?.plan) && (
            <div
              className="border-t-2 border-ink p-6"
              style={{
                opacity: open ? 1 : 0,
                transform: open ? 'translateY(0)' : 'translateY(-8px)',
                transition: 'opacity 0.25s cubic-bezier(.22,1,.36,1) 220ms, transform 0.25s cubic-bezier(.22,1,.36,1) 220ms',
              }}
            >
              <Link
                to="/subscribe"
                className="flex w-full items-center justify-center rounded-full border-2 border-ink bg-ink py-4 text-center font-bold text-[16px] text-paper"
              >
                Prenumeruoti <ArrowRightIcon className="inline size-4 ml-1" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
