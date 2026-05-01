import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MenuIcon, XIcon, ArrowRightIcon, LogOutIcon, UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { avatarSrc } from '@/lib/avatars'

const links = [
  { label: 'Pradžia', to: '/' },
  { label: 'Produktai', to: '/archive' },
  { label: 'Planai', to: '/plans' },
  { label: 'Bendruomenė', to: '/community' },
  { label: 'Paskyra', to: '/account' },
]

// ── Sign-in form inside popover ───────────────────────────────────────────────

function SignInForm({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError(error.message)
    else onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-1">
      <p className="font-bold text-[14px] text-ink">Prisijungti</p>
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
        className="rounded-xl border-2 border-ink/20 bg-paper px-3 py-2 font-mono text-[13px] text-ink outline-none focus:border-ink transition-colors"
      />
      {error && <p className="font-mono text-[11px] text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-xl border-2 border-ink bg-ink py-2 font-mono text-[12px] font-bold text-paper hover:opacity-80 disabled:opacity-40 transition-all"
      >
        {loading ? '…' : 'Prisijungti'}
      </button>
    </form>
  )
}

// ── Avatar button ─────────────────────────────────────────────────────────────

function AvatarPopover() {
  const { user, profile, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  const avatarId = profile?.avatarId ?? 0
  const avatarBg = profile?.avatarBg ?? '#FFD731'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex size-9 items-center justify-center overflow-hidden rounded-full border-2 border-ink brick-hover-sm"
          style={{ background: avatarBg }}
          aria-label="Paskyra"
        >
          {user
            ? <img src={avatarSrc(avatarId)} alt="Paskyra" className="h-full w-full object-cover" />
            : <UserIcon className="size-4 text-ink" />
          }
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-64 rounded-2xl border-2 border-ink p-4 shadow-[6px_6px_0_#001B21] bg-paper">
        {user && profile ? (
          <div className="flex flex-col gap-3">
            {/* Profile row */}
            <div className="flex items-center gap-3">
              <div className="size-10 shrink-0 overflow-hidden rounded-full border-2 border-ink" style={{ background: avatarBg }}>
                <img src={avatarSrc(avatarId)} alt={profile.name} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-ink leading-tight truncate">{profile.name}</p>
                <p className="font-mono text-[11px] text-ink/40 truncate">{user.email}</p>
              </div>
            </div>

            <div className="h-px bg-ink/10" />

            <Link
              to="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold text-ink hover:bg-ink/5 transition-colors"
            >
              <UserIcon className="size-4 text-ink/50" />
              Paskyra
            </Link>

            <button
              onClick={async () => { await signOut(); setOpen(false) }}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold text-ink hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOutIcon className="size-4" />
              Atsijungti
            </button>
          </div>
        ) : (
          <SignInForm onClose={() => setOpen(false)} />
        )}
      </PopoverContent>
    </Popover>
  )
}

// ── Nav ───────────────────────────────────────────────────────────────────────

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
      <nav className="sticky top-0 z-50 bg-white">
        <div className="mx-auto flex h-[84px] max-w-[1320px] items-center justify-between px-7 md:grid md:grid-cols-3">

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
            <Button
              asChild
              size="sm"
              className="hidden rounded-full border-2 border-ink bg-ink text-paper font-bold brick-hover-sm md:inline-flex"
            >
              <Link to="/subscribe">Prenumeruoti <ArrowRightIcon data-icon="inline-end" /></Link>
            </Button>

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
          className="absolute left-0 top-0 w-full flex flex-col border-b-2 border-ink bg-white"
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
            className="border-t-2 border-ink p-6"
            style={{
              opacity: open ? 1 : 0,
              transform: open ? 'translateY(0)' : 'translateY(-8px)',
              transition: 'opacity 0.25s ease 220ms, transform 0.25s ease 220ms',
            }}
          >
            <Link
              to="/subscribe"
              className="flex w-full items-center justify-center rounded-full border-2 border-ink bg-ink py-4 text-center font-bold text-[16px] text-paper"
            >
              Prenumeruoti <ArrowRightIcon className="inline size-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
