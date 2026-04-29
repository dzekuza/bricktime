import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const links = [
  { label: 'Home', to: '/' },
  { label: 'Archive', to: '/archive' },
  { label: 'This Month', to: '/drop' },
  { label: 'Plans', to: '/plans' },
  { label: 'FAQ', to: '/#faq' },
]

export default function Nav() {
  const { pathname } = useLocation()

  return (
    <nav
      className="sticky top-0 z-50 border-b-2 border-ink"
      style={{
        background: 'rgba(245,241,235,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between px-7">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5" style={{ fontFamily: 'var(--font-display)', fontSize: 28 }}>
          <span
            className="grid size-9 place-items-center rounded-full border-2 border-ink bg-brand-yellow"
            style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}
          >
            B!
          </span>
          BRICKTIME
        </Link>

        {/* Links */}
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

        {/* CTA */}
        <Button
          asChild
          size="sm"
          className="rounded-full border-2 border-ink bg-ink text-paper font-bold hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#001B21] transition-all"
        >
          <Link to="/#plans">Subscribe →</Link>
        </Button>
      </div>
    </nav>
  )
}
