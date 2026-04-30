import { useState } from 'react'
import { Link } from 'react-router-dom'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { ArrowRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// ── types ──────────────────────────────────────────────────────────────────
type Tier = 'nano' | 'mini' | 'standard' | 'pro' | 'mega'

interface Product {
  id: number
  title: string
  subtitle: string
  date: string
  category: string
  year: number
  bricks: number
  minifigs: string
  rating?: string
  bg: string
  badge?: 'new' | 'sold-out' | 'limited'
  badgeLabel?: string
  featured?: boolean
  brickColors: string[]
  brickHeights: number[]
  requiredTier: Tier
  image?: string
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
const products: Product[] = [
  { id: 26, title: 'Mailbox row', subtitle: '+ Paštininkas Otto', date: '2026 gegužė', category: 'Miestas', year: 2026, bricks: 312, minifigs: '2 minifigūrėlės', rating: undefined, bg: '#5C4ADE', badge: 'new', badgeLabel: 'Nauja', featured: true, brickColors: ['#FB4903','#F5F1EB','#FFD731','#5DDB9C','#FFAEE7','#4DA2FF','#FB4903'], brickHeights: [46,130,80,170,60,96,48], requiredTier: 'standard', image: '/images/build-castle.jpg' },
  { id: 25, title: 'The greenhouse', subtitle: '+ Botanikė Iris', date: '2026 balandis', category: 'Gamta', year: 2026, bricks: 268, minifigs: '1 minifigūrėlė', rating: '★★★★★ 4.92', bg: '#5DDB9C', brickColors: ['#F5F1EB','#5DDB9C','#FB4903','#FFAEE7'], brickHeights: [60,42,28,36], requiredTier: 'mini', image: '/images/build-cactus.jpg' },
  { id: 24, title: 'Donut diner', subtitle: '+ Virėja Margo', date: '2026 kovas', category: 'Miestas', year: 2026, bricks: 295, minifigs: '2 minifigūrėlės', rating: '★★★★★ 4.89', bg: '#FFAEE7', badge: 'sold-out', badgeLabel: 'Išnuomota', brickColors: ['#FB4903','#F5F1EB','#FFD731','#001B21'], brickHeights: [46,36,50,28], requiredTier: 'standard' },
  { id: 23, title: 'Pocket sub', subtitle: '+ Kapitonas Reef', date: '2026 vasaris', category: 'Transportas', year: 2026, bricks: 248, minifigs: '1 minifigūrėlė + variantas', rating: '★★★★★ 4.78', bg: '#FFD731', brickColors: ['#4DA2FF','#001B21','#FB4903','#F5F1EB','#5C4ADE'], brickHeights: [40,32,36,24,48], requiredTier: 'mini', image: '/images/build-sailboat.jpg' },
  { id: 22, title: 'Lander №7', subtitle: '+ Astronautas Kai', date: '2026 sausis', category: 'Sci-fi', year: 2026, bricks: 274, minifigs: '1 minifigūrėlė', rating: '★★★★★ 4.84', bg: '#FB4903', brickColors: ['#F5F1EB','#001B21','#FFD731','#5DDB9C'], brickHeights: [52,30,38,46], requiredTier: 'pro', image: '/images/build-spaceship.jpg' },
  { id: 21, title: 'Lighthouse', subtitle: '+ Sargė Anya', date: '2025 gruodis', category: 'Miestas', year: 2025, bricks: 292, minifigs: '2 minifigūrėlės', rating: '★★★★★ 4.96', bg: '#4DA2FF', brickColors: ['#F5F1EB','#FB4903','#001B21','#FFD731'], brickHeights: [80,24,36,40], requiredTier: 'standard' },
  { id: 20, title: 'The big wheel', subtitle: '+ Cirko vedėjas Max', date: '2025 lapkritis', category: 'Miestas', year: 2025, bricks: 412, minifigs: '3 minifigūrėlės', rating: '★★★★★ 4.99', bg: '#001B21', badge: 'limited', badgeLabel: 'Ribotas', brickColors: ['#FB4903','#5DDB9C','#FFAEE7','#FFD731','#4DA2FF'], brickHeights: [44,64,36,50,30], requiredTier: 'mega' },
  { id: 19, title: 'Field tractor', subtitle: '+ Ūkininkas Lou', date: '2025 spalis', category: 'Transportas', year: 2025, bricks: 222, minifigs: '1 minifigūrėlė', rating: '★★★★ 4.61', bg: '#5DDB9C', brickColors: ['#FB4903','#001B21','#F5F1EB'], brickHeights: [38,34,24], requiredTier: 'nano' },
  { id: 18, title: 'Record shop', subtitle: '+ DJ Petra', date: '2025 rugsėjis', category: 'Miestas', year: 2025, bricks: 264, minifigs: '1 minifigūrėlė', rating: '★★★★★ 4.81', bg: '#FFAEE7', brickColors: ['#001B21','#FFD731','#FB4903','#F5F1EB'], brickHeights: [60,30,46,26], requiredTier: 'mini' },
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

function StudBg({ color, image, children, className = '' }: { color: string; image?: string; children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={image ? { background: color } : {
        background: color,
        backgroundImage: 'radial-gradient(circle at 14px 14px, rgba(255,255,255,.16) 4px, transparent 5px)',
        backgroundSize: '36px 36px',
      }}
    >
      {image && (
        <>
          <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0" style={{ background: `${color}55` }} />
        </>
      )}
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
      {isTop ? '🔒 ' : ''}{t.label}{isTop ? ' tik' : '+'}
    </span>
  )
}

function ProductCard({ product, featured = false }: { product: Product; featured?: boolean }) {
  const badgeBg = product.badge === 'new' ? '#FFD731' : product.badge === 'sold-out' ? '#001B21' : '#FB4903'
  const badgeColor = product.badge === 'new' ? '#001B21' : '#F5F1EB'
  const tier = tierConfig[product.requiredTier]

  return (
    <Link
      to={`/checkout?product=${product.id}&tier=${product.requiredTier}`}
      className={[
        'group flex flex-col overflow-hidden brick-card brick-card-hover bg-paper text-ink no-underline',
        '',
      ].join(' ')}
    >
      {/* Visual */}
      <StudBg color={product.bg} image={product.image} className={`relative border-b-2 border-ink h-[280px]`}>
        {/* Badge */}
        {product.badge && (
          <div
            className="absolute right-[18px] top-[18px] z-10 grid size-[78px] -rotate-12 place-items-center rounded-full border-2 border-ink p-2 text-center shadow-[3px_3px_0_#001B21] font-display text-[13px] leading-none"
            style={{ background: badgeBg, color: badgeColor }}
          >
            {product.badgeLabel?.split(' ').map((w, i) => <span key={i} className="block">{w}</span>)}
          </div>
        )}
        {!product.image && (
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center">
            <MockModel colors={product.brickColors} heights={product.brickHeights} />
          </div>
        )}
      </StudBg>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-3 md:p-6">
        <div className="flex items-center justify-between label-mono text-ink/60">
          <span>{product.date}</span>
          <span>{product.category}</span>
        </div>
        <h3
          className={`heading-display text-ink ${featured ? 'text-d-sm' : 'text-3xl'}`}
          style={{ lineHeight: '.95' }}
        >
          {product.title}<br />{product.subtitle}
        </h3>
        <p className="text-[14px] leading-[1.5] text-ink/70 line-clamp-2">
          {featured
            ? 'Penkių aukštų daugiabutis su veikiančiomis pašto dėžutėmis, trimis balkonais ir kryžminio personažo minifigūrėle. Paštininkas Otto sunumeruotas 1/3 500.'
            : `${product.bricks} detalės · ${product.minifigs}${product.rating ? ` · ${product.rating}` : ''}`}
        </p>

        {/* Tier + chips row */}
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <TierBadge tier={product.requiredTier} />
          {[`⬢ ${product.bricks} detalės`].map((s) => (
            <span key={s} className="rounded-full border-[1.5px] border-ink px-2.5 py-1 font-mono text-[10px] tracking-[.14em] uppercase text-ink">
              {s}
            </span>
          ))}
          {product.rating && (
            <span className="rounded-full border-[1.5px] border-ink px-2.5 py-1 font-mono text-[10px] tracking-[.14em] uppercase text-ink">
              {product.rating}
            </span>
          )}
        </div>

        {/* Footer CTA */}
        <div
          className="mt-auto flex items-center justify-between rounded-2xl border-2 border-ink px-4 py-3 text-[13px] font-bold transition-all group-hover:shadow-[4px_4px_0_#001B21]"
          style={{ background: tier.bg, color: tier.textColor }}
        >
          <span>Nuomok su {tier.label}+</span>
          <ArrowRightIcon className="size-5" />
        </div>
      </div>
    </Link>
  )
}

// ── page ───────────────────────────────────────────────────────────────────
export default function Archive() {
  const [tierFilter, setTierFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const tierOrder: Tier[] = ['nano', 'mini', 'standard', 'pro', 'mega']
  const categories = [...new Set(products.map((p) => p.category))].sort()

  const filteredProducts = products.filter((p) => {
    const tierOk = tierFilter === 'all' || tierOrder.indexOf(p.requiredTier) >= tierOrder.indexOf(tierFilter as Tier)
    const catOk = categoryFilter === 'all' || p.category === categoryFilter
    return tierOk && catOk
  })

  return (
    <>
      <Nav />

      {/* ── Hero ── */}
      <section className="bg-paper py-4 md:py-6">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
          <div className="rounded-2xl md:rounded-3xl border-2 border-ink bg-ink overflow-hidden p-4 md:p-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

            {/* Left tile */}
            <div className="flex flex-col justify-between brick-card brick-card-hover bg-ink p-6 md:p-9 lg:col-span-8 min-h-[420px]">
              <div className="mb-6 flex items-center gap-2.5 label-mono">
                <Link to="/" className="text-paper/50 hover:text-paper transition-colors">BRICKTIME</Link>
                <span className="text-paper/30">/</span>
                <span className="text-paper/50">Produktai</span>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <h1
                  className="max-w-[14ch] heading-display text-d-xl text-paper tracking-[-0.015em]"
                >
                  Visi{' '}
                  <span className="inline-block text-brand-orange italic" style={{ transform: 'skew(-8deg)' }}>
                    rinkiniai,
                  </span>
                  <br />vienoje vietoje.
                </h1>

                <p className="mt-6 max-w-[52ch] text-[17px] leading-[1.65] text-paper/70">
                  Peržiūrėk visą BRICKTIME katalogą — dvidešimt šeši unikalūs rinkiniai iš miesto, transporto, sci-fi ir gamtos pasaulių. Pasiimk bet kurį rinkinį su aktyvia prenumerata.
                </p>
              </div>
            </div>

            {/* Right tile — stats */}
            <div className="flex flex-col justify-around brick-card brick-card-hover bg-brand-orange p-6 md:p-9 lg:col-span-4 min-h-[420px]">
              {[['26', 'Rinkinių katalogas'], ['7 840', 'Detalių iš viso'], ['54', 'Minifigūrėlių']].map(([val, label]) => (
                <div key={label} className="flex flex-col gap-2 border-b border-paper/20 pb-8 last:border-b-0 last:pb-0">
                  <b className="heading-display text-d-lg" style={{ color: '#F5F1EB' }}>{val}</b>
                  <small className="label-mono text-paper/70">{label}</small>
                </div>
              ))}
            </div>

          </div>
          </div>
        </div>
      </section>


      {/* ── Grid ── */}
      <section className="py-10 md:py-16">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">

          {/* Filters */}
          <div className="mb-8 flex flex-wrap gap-3">
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-[180px] rounded-full border-2 border-ink font-semibold text-[14px]">
                <SelectValue placeholder="Planas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Visi planai</SelectItem>
                <SelectItem value="nano">Nano+</SelectItem>
                <SelectItem value="mini">Mini+</SelectItem>
                <SelectItem value="standard">Standard+</SelectItem>
                <SelectItem value="pro">Pro+</SelectItem>
                <SelectItem value="mega">Tik Mega</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px] rounded-full border-2 border-ink font-semibold text-[14px]">
                <SelectValue placeholder="Kategorija" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Visos kategorijos</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(tierFilter !== 'all' || categoryFilter !== 'all') && (
              <button
                onClick={() => { setTierFilter('all'); setCategoryFilter('all') }}
                className="rounded-full border-2 border-ink/30 px-4 py-2 text-[13px] font-semibold text-ink/50 hover:border-ink hover:text-ink transition-all"
              >
                Išvalyti
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} featured={product.featured} />
            ))}
          </div>

          {/* Load more */}
          <div className="py-20 text-center">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full border-2 border-ink bg-paper text-ink text-[17px] font-bold hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[6px_6px_0_#001B21] transition-all"
            >
              Rodyti daugiau ↓
            </Button>
            <p className="mt-3.5 label-mono text-ink/55">
              Rodoma {filteredProducts.length} iš 26 · Naujausi pirmiausia
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
