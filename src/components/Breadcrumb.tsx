import { createContext, useContext, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

// ── Context so dynamic pages (Drop, MerchDrop, etc.) can push a label ────────

interface BreadcrumbCtx {
  label: string | null
  setLabel: (l: string | null) => void
}

const BreadcrumbContext = createContext<BreadcrumbCtx>({ label: null, setLabel: () => {} })

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [label, setLabel] = useState<string | null>(null)
  return (
    <BreadcrumbContext.Provider value={{ label, setLabel }}>
      {children}
    </BreadcrumbContext.Provider>
  )
}

export function useBreadcrumbLabel() {
  return useContext(BreadcrumbContext)
}

// ── Route config ─────────────────────────────────────────────────────────────

type Crumb = { label: string; to?: string }

const EXACT: Record<string, Crumb[]> = {
  '/archive':                 [{ label: 'Rinkiniai' }],
  '/account':                 [{ label: 'Paskyra' }],
  '/community':               [{ label: 'Bendruomenė' }],
  '/subscribe':               [{ label: 'Planai' }],
  '/checkout':                [{ label: 'Apmokėjimas' }],
  '/merch':                   [{ label: 'Merch' }],
  '/gift-cards':              [{ label: 'Dovanų kortelės' }],
  '/duk':                     [{ label: 'D.U.K.' }],
  '/praleisti-pristabdyti':   [{ label: 'Pristabdyti' }],
  '/pristatymas':             [{ label: 'Pristatymas' }],
  '/grazinimai':              [{ label: 'Grąžinimai' }],
}

const PREFIX: Array<{ match: string; parent: Crumb; fallback: string }> = [
  { match: '/drop/',    parent: { label: 'Rinkiniai', to: '/archive' },   fallback: 'Rinkinio detalės' },
  { match: '/merch/',   parent: { label: 'Merch',     to: '/merch' },     fallback: 'Produktas' },
  { match: '/profile/', parent: { label: 'Bendruomenė', to: '/community' }, fallback: 'Profilis' },
]

function getCrumbs(pathname: string, dynamicLabel: string | null): Crumb[] | null {
  if (pathname === '/') return null

  const exact = EXACT[pathname]
  if (exact) return exact

  for (const { match, parent, fallback } of PREFIX) {
    if (pathname.startsWith(match)) {
      return [parent, { label: dynamicLabel ?? fallback }]
    }
  }

  return null
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Breadcrumb() {
  const { pathname } = useLocation()
  const { label: dynamicLabel } = useContext(BreadcrumbContext)

  const crumbs = getCrumbs(pathname, dynamicLabel)
  if (!crumbs) return null

  const all: Crumb[] = [{ label: 'Bricktime', to: '/' }, ...crumbs]

  return (
    <div className="mx-auto max-w-[1320px] px-4 md:px-7">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2.5 py-2.5">
        {all.map((crumb, i) => {
          const isLast = i === all.length - 1
          return (
            <span key={i} className="flex items-center gap-2.5">
              {i > 0 && (
                <span className="font-mono text-[11px] tracking-[.18em] uppercase text-ink/30 select-none">/</span>
              )}
              {isLast || !crumb.to ? (
                <span className={`font-mono text-[11px] tracking-[.18em] uppercase ${isLast ? 'font-bold text-ink' : 'text-ink/55'}`}>
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.to}
                  className="font-mono text-[11px] tracking-[.18em] uppercase text-ink/55 transition-colors hover:text-ink"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          )
        })}
      </nav>
    </div>
  )
}
