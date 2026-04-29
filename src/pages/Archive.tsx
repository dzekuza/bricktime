import { useState } from 'react'
import { Link } from 'react-router-dom'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'

// ── types ──────────────────────────────────────────────────────────────────
type Tier = 'nano' | 'mini' | 'standard' | 'pro' | 'mega'

interface Drop {
  num: number
  title: string
  subtitle: string
  date: string
  category: string
  year: number
  bricks: number
  minifigs: string
  rating?: string
  bg: string
  stamp?: 'this-month' | 'sold-out' | 'anniv'
  stampLabel?: string
  featured?: boolean
  brickColors: string[]
  brickHeights: number[]
  requiredTier: Tier
}

// ── tier config ────────────────────────────────────────────────────────────
const tierConfig: Record<Tier, { label: string; bg: string; textColor: string; level: number }> = {
  nano:     { label: 'Nano',     bg: '#F5F1EB', textColor: '#001B21', level: 1 },
  mini:     { label: 'Mini',     bg: '#FFAEE7', textColor: '#001B21', level: 2 },
  standard: { label: 'Standard', bg: '#FFD731', textColor: '#001B21', level: 3 },
  pro:      { label: 'Pro',      bg: '#4DA2FF', textColor: '#001B21', level: 4 },
  mega:     { label: 'Mega',     bg: '#FB4903', textColor: '#F5F1EB', level: 5 },
}

// ── data ───────────────────────────────────────────────────────────────────
const drops: Drop[] = [
  { num: 26, title: 'Mailbox row', subtitle: '+ Postman Otto', date: 'May 2026 · ships May 5', category: 'Cityscape', year: 2026, bricks: 312, minifigs: '2 minifigs', rating: undefined, bg: '#5C4ADE', stamp: 'this-month', stampLabel: 'This month', featured: true, brickColors: ['#FB4903','#F5F1EB','#FFD731','#5DDB9C','#FFAEE7','#4DA2FF','#FB4903'], brickHeights: [46,130,80,170,60,96,48], requiredTier: 'standard' },
  { num: 25, title: 'The greenhouse', subtitle: '+ Botanist Iris', date: 'April 2026', category: 'Nature', year: 2026, bricks: 268, minifigs: '1 minifig', rating: '★★★★★ 4.92', bg: '#5DDB9C', brickColors: ['#F5F1EB','#5DDB9C','#FB4903','#FFAEE7'], brickHeights: [60,42,28,36], requiredTier: 'mini' },
  { num: 24, title: 'Donut diner', subtitle: '+ Chef Margo', date: 'March 2026', category: 'Cityscape', year: 2026, bricks: 295, minifigs: '2 minifigs', rating: '★★★★★ 4.89', bg: '#FFAEE7', stamp: 'sold-out', stampLabel: 'Sold out', brickColors: ['#FB4903','#F5F1EB','#FFD731','#001B21'], brickHeights: [46,36,50,28], requiredTier: 'standard' },
  { num: 23, title: 'Pocket sub', subtitle: '+ Captain Reef', date: 'February 2026', category: 'Vehicles', year: 2026, bricks: 248, minifigs: '1 minifig + variant', rating: '★★★★★ 4.78', bg: '#FFD731', brickColors: ['#4DA2FF','#001B21','#FB4903','#F5F1EB','#5C4ADE'], brickHeights: [40,32,36,24,48], requiredTier: 'mini' },
  { num: 22, title: 'Lander №7', subtitle: '+ Astronaut Kai', date: 'January 2026', category: 'Sci-fi', year: 2026, bricks: 274, minifigs: '1 minifig', rating: '★★★★★ 4.84', bg: '#FB4903', brickColors: ['#F5F1EB','#001B21','#FFD731','#5DDB9C'], brickHeights: [52,30,38,46], requiredTier: 'pro' },
  { num: 21, title: 'Lighthouse', subtitle: '+ Keeper Anya', date: 'December 2025', category: 'Cityscape', year: 2025, bricks: 292, minifigs: '2 minifigs', rating: '★★★★★ 4.96', bg: '#4DA2FF', brickColors: ['#F5F1EB','#FB4903','#001B21','#FFD731'], brickHeights: [80,24,36,40], requiredTier: 'standard' },
  { num: 20, title: 'The big wheel', subtitle: '+ Ringmaster Max', date: 'November 2025', category: 'Cityscape', year: 2025, bricks: 412, minifigs: '3 minifigs', rating: '★★★★★ 4.99', bg: '#001B21', stamp: 'anniv', stampLabel: 'Anniv. edition', brickColors: ['#FB4903','#5DDB9C','#FFAEE7','#FFD731','#4DA2FF'], brickHeights: [44,64,36,50,30], requiredTier: 'mega' },
  { num: 19, title: 'Field tractor', subtitle: '+ Farmer Lou', date: 'October 2025', category: 'Vehicles', year: 2025, bricks: 222, minifigs: '1 minifig', rating: '★★★★ 4.61', bg: '#5DDB9C', brickColors: ['#FB4903','#001B21','#F5F1EB'], brickHeights: [38,34,24], requiredTier: 'nano' },
  { num: 18, title: 'Record shop', subtitle: '+ DJ Petra', date: 'September 2025', category: 'Cityscape', year: 2025, bricks: 264, minifigs: '1 minifig', rating: '★★★★★ 4.81', bg: '#FFAEE7', brickColors: ['#001B21','#FFD731','#FB4903','#F5F1EB'], brickHeights: [60,30,46,26], requiredTier: 'mini' },
]

const filters = ['All', 'Nano+', 'Mini+', 'Standard+', 'Pro+', 'Mega only', '2026', '2025', 'Vehicles', 'Cityscape', 'Sci-fi', 'Nature']

const timelineMonths = [
  { label: 'Mar', year: "'24", status: 'done' }, { label: 'Apr', year: "'24", status: 'done' },
  { label: 'May', year: "'24", status: 'done' }, { label: 'Jun', year: "'24", status: 'done' },
  { label: 'Jul', year: "'24", status: 'done' }, { label: 'Aug', year: "'24", status: 'done' },
  { label: 'Sep', year: "'24", status: 'done' }, { label: 'Oct', year: "'24", status: 'done' },
  { label: 'Nov', year: "'24", status: 'done' }, { label: 'Dec', year: "'24", status: 'done' },
  { label: 'Jan', year: "'25", status: 'done' }, { label: 'Feb', year: "'25", status: 'done' },
  { label: 'Mar', year: "'25", status: 'done' }, { label: 'Apr', year: "'25", status: 'done' },
  { label: 'May', year: "'25", status: 'done' }, { label: 'Jun', year: "'25", status: 'done' },
  { label: 'Jul', year: "'25", status: 'done' }, { label: 'Aug', year: "'25", status: 'done' },
  { label: 'Sep', year: "'25", status: 'done' }, { label: 'Oct', year: "'25", status: 'done' },
  { label: 'Nov', year: "'25", status: 'done' }, { label: 'Dec', year: "'25", status: 'done' },
  { label: 'Jan', year: "'26", status: 'done' }, { label: 'Feb', year: "'26", status: 'done' },
  { label: 'Mar', year: "'26", status: 'done' }, { label: 'Apr', year: "'26", status: 'done' },
  { label: 'May', year: "'26", status: 'active' },
  { label: 'Jun', year: "'26", status: 'future' },
  { label: 'Jul', year: "'26", status: 'future' },
]

// ── sub-components ─────────────────────────────────────────────────────────
function MockModel({ colors, heights }: { colors: string[]; heights: number[] }) {
  return (
    <div className="relative z-10 flex items-end gap-1.5 px-5 pb-0" style={{ height: 180 }}>
      {colors.map((color, i) => (
        <div
          key={i}
          className="relative rounded border-[2px] border-ink"
          style={{
            background: color,
            width: 30 + (i % 2) * 10,
            height: heights[i] ?? 40,
            boxShadow: 'inset 0 -6px 0 rgba(0,0,0,.18)',
          }}
        >
          <span
            className="absolute -top-2 left-1/2 size-3 -translate-x-1/2 rounded-full border-[2px] border-ink"
            style={{ background: color }}
          />
        </div>
      ))}
    </div>
  )
}

function StudBg({ color, children, className = '' }: { color: string; children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: color,
        backgroundImage: 'radial-gradient(circle at 14px 14px, rgba(255,255,255,.16) 4px, transparent 5px)',
        backgroundSize: '36px 36px',
      }}
    >
      {children}
    </div>
  )
}

function TierBadge({ tier }: { tier: Tier }) {
  const t = tierConfig[tier]
  const isTop = tier === 'mega'
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-3 py-1 font-mono text-[10px] tracking-[.12em] uppercase font-bold"
      style={{ background: t.bg, color: t.textColor }}
    >
      {isTop ? '🔒 ' : ''}{t.label}{isTop ? ' only' : '+'}
    </span>
  )
}

function DropCard({ drop, featured = false }: { drop: Drop; featured?: boolean }) {
  const stampBg = drop.stamp === 'this-month' ? '#FFD731' : drop.stamp === 'sold-out' ? '#001B21' : '#FB4903'
  const stampColor = drop.stamp === 'this-month' ? '#001B21' : '#F5F1EB'
  const cornerBg = drop.bg === '#001B21' ? '#FFD731' : '#001B21'
  const cornerColor = drop.bg === '#001B21' ? '#001B21' : '#F5F1EB'
  const tier = tierConfig[drop.requiredTier]

  return (
    <Link
      to={`/checkout?drop=${drop.num}&tier=${drop.requiredTier}`}
      className={[
        'group flex flex-col overflow-hidden rounded-3xl border-2 border-ink bg-paper text-ink no-underline',
        'transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0_#001B21]',
        featured ? 'md:col-span-2' : '',
      ].join(' ')}
    >
      {/* Visual */}
      <StudBg color={drop.bg} className={`relative border-b-2 border-ink ${featured ? 'h-[380px]' : 'h-[280px]'}`}>
        {/* Drop number corner */}
        <div
          className="absolute left-[18px] top-[18px] rounded-[8px] border-2 border-ink px-3.5 py-2.5 z-10"
          style={{ fontFamily: 'var(--font-display)', fontSize: featured ? 56 : 42, lineHeight: '.9', background: cornerBg, color: cornerColor }}
        >
          № {drop.num}
        </div>
        {/* Stamp */}
        {drop.stamp && (
          <div
            className="absolute right-[18px] top-[18px] z-10 grid size-[78px] -rotate-12 place-items-center rounded-full border-2 border-ink p-2 text-center shadow-[3px_3px_0_#001B21]"
            style={{ fontFamily: 'var(--font-display)', fontSize: 13, lineHeight: 1, background: stampBg, color: stampColor }}
          >
            {drop.stampLabel?.split(' ').map((w, i) => <span key={i} className="block">{w}</span>)}
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center">
          <MockModel colors={drop.brickColors} heights={drop.brickHeights} />
        </div>
      </StudBg>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex items-center justify-between font-mono text-[11px] tracking-[.16em] uppercase text-ink/60">
          <span>{drop.date}</span>
          <span>{drop.category}</span>
        </div>
        <h3
          className="uppercase text-ink"
          style={{ fontFamily: 'var(--font-display)', fontSize: featured ? 48 : 32, lineHeight: '.95' }}
        >
          {drop.title}<br />{drop.subtitle}
        </h3>
        <p className="text-[14px] leading-[1.5] text-ink/70 line-clamp-2">
          {featured
            ? 'Five-storey apartment block with a working mailbox door, three balconies, and the first crossover with drop 14. Postman Otto is numbered 1/3,500.'
            : `${drop.bricks} bricks · ${drop.minifigs}${drop.rating ? ` · ${drop.rating}` : ''}`}
        </p>

        {/* Tier + chips row */}
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <TierBadge tier={drop.requiredTier} />
          {[`⬢ ${drop.bricks} bricks`].map((s) => (
            <span key={s} className="rounded-full border-[1.5px] border-ink px-2.5 py-1 font-mono text-[10px] tracking-[.14em] uppercase text-ink">
              {s}
            </span>
          ))}
          {drop.rating && (
            <span className="rounded-full border-[1.5px] border-ink px-2.5 py-1 font-mono text-[10px] tracking-[.14em] uppercase text-ink">
              {drop.rating}
            </span>
          )}
        </div>

        {/* Footer action — clicking the card goes to drop detail; this is the visual CTA */}
        <div
          className="mt-auto flex items-center justify-between rounded-2xl border-2 border-ink px-4 py-3 text-[13px] font-bold transition-all group-hover:shadow-[4px_4px_0_#001B21]"
          style={{ background: tier.bg, color: tier.textColor }}
        >
          <span>Rent with {tier.label}+</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>→</span>
        </div>
      </div>
    </Link>
  )
}

// ── page ───────────────────────────────────────────────────────────────────
export default function Archive() {
  const [activeFilter, setActiveFilter] = useState('All drops')

  const tierOrder: Tier[] = ['nano', 'mini', 'standard', 'pro', 'mega']
  const filteredDrops = drops.filter((d) => {
    if (activeFilter === 'All') return true
    if (activeFilter === 'Mega only') return d.requiredTier === 'mega'
    if (activeFilter.endsWith('+')) {
      const tierName = activeFilter.replace('+', '').toLowerCase() as Tier
      return tierOrder.indexOf(d.requiredTier) >= tierOrder.indexOf(tierName)
    }
    if (['2024', '2025', '2026'].includes(activeFilter)) return d.year === Number(activeFilter)
    return d.category === activeFilter
  })

  return (
    <>
      <Nav />

      {/* ── Hero ── */}
      <section className="bg-ink py-20">
        <div className="mx-auto max-w-[1320px] px-7">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

            {/* Left tile — breadcrumb + heading + description */}
            <div className="flex flex-col justify-between rounded-3xl border-2 border-ink bg-ink p-9 shadow-[6px_6px_0_#001B21] transition-all hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[10px_10px_0_#001B21] lg:col-span-8" style={{ minHeight: 420 }}>
              {/* Breadcrumb */}
              <div className="mb-6 flex items-center gap-2.5 font-mono text-[11px] tracking-[.18em] uppercase">
                <Link to="/" className="text-paper/50 hover:text-paper transition-colors">BRICKTIME</Link>
                <span className="text-paper/30">/</span>
                <span className="text-paper/50">Products</span>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <h1
                  className="max-w-[14ch] uppercase text-paper"
                  style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(48px,5.5vw,84px)', lineHeight: '.88', letterSpacing: '-.015em' }}
                >
                  Every{' '}
                  <span className="inline-block text-brand-orange" style={{ fontStyle: 'italic', transform: 'skew(-8deg)' }}>
                    product,
                  </span>
                  <br />every month.
                </h1>

                <p className="mt-6 max-w-[52ch] text-[17px] leading-[1.65] text-paper/70">
                  Twenty-six monthly drops since launch in March 2024 — every one a piece of the BRICKTIME universe. Browse the back catalogue, see what subscribers built, and pick up missing months.
                </p>
              </div>
            </div>

            {/* Right tile — stats */}
            <div className="flex flex-col justify-around rounded-3xl border-2 border-ink bg-brand-orange p-9 shadow-[6px_6px_0_#001B21] transition-all hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[10px_10px_0_#001B21] lg:col-span-4" style={{ minHeight: 420 }}>
              {[['26', 'Drops shipped'], ['7,840', 'Bricks total'], ['54', 'Minifigs released']].map(([val, label]) => (
                <div key={label} className="flex flex-col gap-2 border-b border-paper/20 pb-8 last:border-b-0 last:pb-0">
                  <b style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px,4vw,60px)', lineHeight: '.88', color: '#F5F1EB' }}>{val}</b>
                  <small className="font-mono text-[11px] tracking-[.16em] uppercase text-paper/70">{label}</small>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── Filter bar ── */}
      <div className="sticky top-[72px] z-40 border-b-2 border-ink bg-ink">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-4 px-7 py-[18px]">
          <div className="flex flex-wrap gap-2.5">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={[
                  'rounded-full border-2 px-4 py-2 text-[13px] font-semibold transition-all',
                  activeFilter === f
                    ? 'border-brand-yellow bg-brand-yellow text-ink'
                    : 'border-paper bg-transparent text-paper hover:bg-paper/10',
                ].join(' ')}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2.5 font-mono text-[11px] tracking-[.16em] uppercase text-paper/85">
            <span>Sort</span>
            <select className="rounded-full border-2 border-paper bg-transparent px-3 py-2 text-[13px] font-semibold text-paper tracking-normal normal-case">
              <option>Newest first</option>
              <option>Oldest first</option>
              <option>Most bricks</option>
              <option>Subscriber rating</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <section className="py-16">
        <div className="mx-auto max-w-[1320px] px-7">
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
            {filteredDrops.map((drop) => (
              <DropCard key={drop.num} drop={drop} featured={drop.featured} />
            ))}
          </div>

          {/* Load more */}
          <div className="py-20 text-center">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full border-2 border-ink bg-paper text-ink text-[17px] font-bold hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[6px_6px_0_#001B21] transition-all"
            >
              Load drops 01 – 17 ↓
            </Button>
            <p className="mt-3.5 font-mono text-[11px] tracking-[.16em] uppercase text-ink/55">
              Showing {filteredDrops.length} of 26 · Newest first
            </p>
          </div>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section className="bg-paper py-20">
        <div className="mx-auto max-w-[1320px] px-7">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

            {/* Header tile */}
            <div className="flex flex-col justify-center rounded-3xl border-2 border-ink bg-paper p-9 shadow-[6px_6px_0_#001B21] transition-all hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[10px_10px_0_#001B21] lg:col-span-7">
              <p className="font-mono text-[11px] tracking-[.22em] uppercase text-ink">⬢ Universe map</p>
              <h2
                className="mt-3 uppercase text-ink"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(48px,6vw,88px)', lineHeight: '.9', letterSpacing: '-.01em' }}
              >
                26 months,<br />one connected world.
              </h2>
            </div>

            {/* Blurb tile */}
            <div className="flex flex-col justify-center rounded-3xl border-2 border-ink p-9 shadow-[6px_6px_0_#001B21] transition-all hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[10px_10px_0_#001B21] lg:col-span-5" style={{ background: '#5C4ADE' }}>
              <p className="text-[17px] leading-[1.65] text-paper">
                Every drop locks into the BRICKTIME universe. Yellow dot is the active month — green are shipped, dotted are upcoming.
              </p>
              <p className="mt-6 font-mono text-[11px] tracking-[.16em] uppercase text-paper/60">
                Green = shipped · Yellow = active · Dashed = upcoming
              </p>
            </div>

            {/* Timeline bar */}
            <div className="overflow-hidden rounded-3xl border-2 border-ink bg-ink shadow-[6px_6px_0_#001B21] lg:col-span-12" style={{ height: 160 }}>
              <div className="flex h-full items-center px-6 overflow-x-auto">
                {timelineMonths.map((m, i) => (
                  <div
                    key={i}
                    className="flex flex-1 min-w-[56px] flex-col items-center justify-center gap-2 border-r border-dashed border-paper/15 last:border-r-0 h-full font-mono text-[11px] tracking-[.16em] uppercase text-paper"
                  >
                    <span
                      className="rounded-full"
                      style={{
                        width: m.status === 'active' ? 20 : 14,
                        height: m.status === 'active' ? 20 : 14,
                        background: m.status === 'done' ? '#5DDB9C' : m.status === 'active' ? '#FFD731' : 'transparent',
                        border: m.status === 'future' ? '2px dashed rgba(245,241,235,.3)' : 'none',
                      }}
                    />
                    <b style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: '.02em' }}>{m.label}</b>
                    <small className="opacity-50 text-[9px]">{m.year}</small>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
