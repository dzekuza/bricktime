import { useState } from 'react'
import { Link } from 'react-router-dom'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'

// ── types ──────────────────────────────────────────────────────────────────
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
}

// ── data ───────────────────────────────────────────────────────────────────
const drops: Drop[] = [
  { num: 26, title: 'Mailbox row', subtitle: '+ Postman Otto', date: 'May 2026 · ships May 5', category: 'Cityscape', year: 2026, bricks: 312, minifigs: '2 minifigs', rating: undefined, bg: '#5C4ADE', stamp: 'this-month', stampLabel: 'This month', featured: true, brickColors: ['#FB4903','#F5F1EB','#FFD731','#5DDB9C','#FFAEE7','#4DA2FF','#FB4903'], brickHeights: [46,130,80,170,60,96,48] },
  { num: 25, title: 'The greenhouse', subtitle: '+ Botanist Iris', date: 'April 2026', category: 'Nature', year: 2026, bricks: 268, minifigs: '1 minifig', rating: '★★★★★ 4.92', bg: '#5DDB9C', brickColors: ['#F5F1EB','#5DDB9C','#FB4903','#FFAEE7'], brickHeights: [60,42,28,36] },
  { num: 24, title: 'Donut diner', subtitle: '+ Chef Margo', date: 'March 2026', category: 'Cityscape', year: 2026, bricks: 295, minifigs: '2 minifigs', rating: '★★★★★ 4.89', bg: '#FFAEE7', stamp: 'sold-out', stampLabel: 'Sold out', brickColors: ['#FB4903','#F5F1EB','#FFD731','#001B21'], brickHeights: [46,36,50,28] },
  { num: 23, title: 'Pocket sub', subtitle: '+ Captain Reef', date: 'February 2026', category: 'Vehicles', year: 2026, bricks: 248, minifigs: '1 minifig + variant', rating: '★★★★★ 4.78', bg: '#FFD731', brickColors: ['#4DA2FF','#001B21','#FB4903','#F5F1EB','#5C4ADE'], brickHeights: [40,32,36,24,48] },
  { num: 22, title: 'Lander №7', subtitle: '+ Astronaut Kai', date: 'January 2026', category: 'Sci-fi', year: 2026, bricks: 274, minifigs: '1 minifig', rating: '★★★★★ 4.84', bg: '#FB4903', brickColors: ['#F5F1EB','#001B21','#FFD731','#5DDB9C'], brickHeights: [52,30,38,46] },
  { num: 21, title: 'Lighthouse', subtitle: '+ Keeper Anya', date: 'December 2025', category: 'Cityscape', year: 2025, bricks: 292, minifigs: '2 minifigs', rating: '★★★★★ 4.96', bg: '#4DA2FF', brickColors: ['#F5F1EB','#FB4903','#001B21','#FFD731'], brickHeights: [80,24,36,40] },
  { num: 20, title: 'The big wheel', subtitle: '+ Ringmaster Max', date: 'November 2025', category: 'Cityscape', year: 2025, bricks: 412, minifigs: '3 minifigs', rating: '★★★★★ 4.99', bg: '#001B21', stamp: 'anniv', stampLabel: 'Anniv. edition', brickColors: ['#FB4903','#5DDB9C','#FFAEE7','#FFD731','#4DA2FF'], brickHeights: [44,64,36,50,30] },
  { num: 19, title: 'Field tractor', subtitle: '+ Farmer Lou', date: 'October 2025', category: 'Vehicles', year: 2025, bricks: 222, minifigs: '1 minifig', rating: '★★★★ 4.61', bg: '#5DDB9C', brickColors: ['#FB4903','#001B21','#F5F1EB'], brickHeights: [38,34,24] },
  { num: 18, title: 'Record shop', subtitle: '+ DJ Petra', date: 'September 2025', category: 'Cityscape', year: 2025, bricks: 264, minifigs: '1 minifig', rating: '★★★★★ 4.81', bg: '#FFAEE7', brickColors: ['#001B21','#FFD731','#FB4903','#F5F1EB'], brickHeights: [60,30,46,26] },
]

const filters = ['All drops', '2026', '2025', '2024', 'Vehicles', 'Cityscape', 'Sci-fi', 'Nature']

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

function DropCard({ drop, featured = false }: { drop: Drop; featured?: boolean }) {
  const stampBg = drop.stamp === 'this-month' ? '#FFD731' : drop.stamp === 'sold-out' ? '#001B21' : '#FB4903'
  const stampColor = drop.stamp === 'this-month' ? '#001B21' : '#F5F1EB'
  const cornerBg = drop.bg === '#001B21' ? '#FFD731' : '#001B21'
  const cornerColor = drop.bg === '#001B21' ? '#001B21' : '#F5F1EB'

  return (
    <Link
      to={`/drop/${drop.num}`}
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
        <div className="flex flex-wrap gap-2 mt-1">
          {[`⬢ ${drop.bricks} bricks`, `⬢ ${drop.minifigs}`].map((s) => (
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
        <div className="mt-auto flex items-center justify-between border-t border-dashed border-ink/20 pt-3.5 text-[14px] font-bold">
          <span>{featured ? 'Open drop №26' : 'View drop'}</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 24 }}>→</span>
        </div>
      </div>
    </Link>
  )
}

// ── page ───────────────────────────────────────────────────────────────────
export default function Archive() {
  const [activeFilter, setActiveFilter] = useState('All drops')

  const filteredDrops = drops.filter((d) => {
    if (activeFilter === 'All drops') return true
    if (['2024', '2025', '2026'].includes(activeFilter)) return d.year === Number(activeFilter)
    return d.category === activeFilter
  })

  return (
    <>
      <Nav />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b-2 border-ink bg-paper pb-14 pt-20">
        <div className="mx-auto max-w-[1320px] px-7">
          {/* Breadcrumb */}
          <div className="mb-6 flex items-center gap-2.5 font-mono text-[11px] tracking-[.18em] uppercase">
            <Link to="/" className="text-ink/55 hover:text-ink transition-colors">BRICKTIME</Link>
            <span className="text-ink/30">/</span>
            <span className="text-ink">Archive</span>
          </div>

          <h1
            className="max-w-[14ch] uppercase text-ink"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(72px,11vw,160px)', lineHeight: '.86', letterSpacing: '-.015em' }}
          >
            Every{' '}
            <span className="inline-block text-brand-indigo" style={{ fontStyle: 'italic', transform: 'skew(-8deg)' }}>
              drop,
            </span>
            <br />every month.
          </h1>

          <div className="mt-12 flex flex-wrap items-end justify-between gap-8">
            <p className="max-w-[52ch] text-[18px] leading-[1.65] text-ink/80">
              Twenty-six monthly drops since launch in March 2024 — every one a piece of the BRICKTIME universe. Browse the back catalogue, see what subscribers built, and pick up missing months.
            </p>
            <div className="flex gap-8 flex-wrap">
              {[['26', 'Drops shipped'], ['7,840', 'Bricks total'], ['54', 'Minifigs released']].map(([val, label]) => (
                <div key={label} className="flex flex-col gap-1">
                  <b style={{ fontFamily: 'var(--font-display)', fontSize: 64, lineHeight: '.9', color: '#001B21' }}>{val}</b>
                  <small className="font-mono text-[11px] tracking-[.16em] uppercase text-ink/60">{label}</small>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating bricks */}
        <div className="absolute right-[8%] top-[60px] -rotate-12">
          <div className="relative h-[70px] w-[140px] rounded border-[3px] border-ink bg-brand-orange" style={{ boxShadow: 'inset 0 -8px 0 rgba(0,0,0,.18)' }}>
            <span className="absolute -top-3.5 left-5 size-7 rounded-full border-[3px] border-ink bg-brand-orange" />
            <span className="absolute -top-3.5 right-5 size-7 rounded-full border-[3px] border-ink bg-brand-orange" />
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
      <section className="pt-16 pb-0">
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
      <section className="border-t-2 border-ink bg-paper py-[120px]">
        <div className="mx-auto max-w-[1320px] px-7">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-12">
            <div>
              <p className="font-mono text-[11px] tracking-[.22em] uppercase text-ink">⬢ Universe map</p>
              <h2
                className="mt-3 uppercase"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(48px,6vw,88px)', lineHeight: '.9', letterSpacing: '-.01em' }}
              >
                26 months,<br />one connected world.
              </h2>
            </div>
            <p className="max-w-[480px] text-[17px] leading-[1.65] text-ink/75">
              Every drop locks into the BRICKTIME universe. Yellow dot is the active month — green are shipped, dotted are upcoming.
            </p>
          </div>

          {/* Timeline bar */}
          <div className="overflow-hidden rounded-3xl border-2 border-ink bg-ink" style={{ height: 160 }}>
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
      </section>

      <Footer />
    </>
  )
}
