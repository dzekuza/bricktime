import { useState, useMemo } from 'react'
import { ArrowRight, ChevronDown, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useReveal } from '@/hooks/useReveal'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { getPlanBrickSvg, getPlanTheme } from '@/lib/plan-branding'

type Product = {
  id: number
  name: string
  series: string
  image: string
  brickImage: string
  isNew: boolean
  stats: {
    pieces: string
    year: string
    age: string
    price: string
    category: string
    plan: string
  }
  // numeric fields for sorting
  piecesNum: number
  priceNum: number
  yearNum: number
  planTier: number   // higher = more exclusive
  popularity: number // higher = more popular
  ctaBg: string
  ctaLabel: string
}

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Naujausi' },
  { value: 'popular',    label: 'Populiariausi' },
  { value: 'pieces',     label: 'Daugiausiai detalių' },
  { value: 'plan',       label: 'Aukščiausias planas' },
  { value: 'price_asc',  label: 'Pigiausi' },
  { value: 'price_desc', label: 'Brangiausi' },
] as const

type SortValue = (typeof SORT_OPTIONS)[number]['value']

function sortProducts(products: Product[], by: SortValue): Product[] {
  const sorted = [...products]
  switch (by) {
    case 'newest':     return sorted.sort((a, b) => b.yearNum - a.yearNum)
    case 'popular':    return sorted.sort((a, b) => b.popularity - a.popularity)
    case 'pieces':     return sorted.sort((a, b) => b.piecesNum - a.piecesNum)
    case 'plan':       return sorted.sort((a, b) => b.planTier - a.planTier)
    case 'price_asc':  return sorted.sort((a, b) => a.priceNum - b.priceNum)
    case 'price_desc': return sorted.sort((a, b) => b.priceNum - a.priceNum)
    default:           return sorted
  }
}

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Džabos barža',
    series: 'Star Wars™',
    image: 'https://www.figma.com/api/mcp/asset/a637a90c-dee8-4ce6-b494-3f5b0a16a323',
    brickImage: '/plans/how-mega.svg',
    isNew: true,
    stats: { pieces: '3943', year: '2025', age: '—', price: '€519.99', category: 'Star Wars', plan: 'Legenda+' },
    piecesNum: 3943, priceNum: 519.99, yearNum: 2025, planTier: 5, popularity: 2,
    ctaBg: '#FFD731',
    ctaLabel: 'Nuomok su Legenda+',
  },
  {
    id: 2,
    name: 'TIE naikintuvas',
    series: 'Star Wars™',
    image: 'https://www.figma.com/api/mcp/asset/a2407a96-c6c6-4efd-9e7c-7da1b8ed1400',
    brickImage: '/plans/how-nano.svg',
    isNew: false,
    stats: { pieces: '1931', year: '2023', age: '—', price: '€239.99', category: 'Star Wars', plan: 'Pro+' },
    piecesNum: 1931, priceNum: 239.99, yearNum: 2023, planTier: 3, popularity: 3,
    ctaBg: '#55DB9C',
    ctaLabel: 'Nuomok su Pro+',
  },
  {
    id: 3,
    name: 'Grogu (Mandaloriečių mokinys)',
    series: 'Star Wars™',
    image: 'https://www.figma.com/api/mcp/asset/a7f63131-00c5-4887-82cf-ec408852bebd',
    brickImage: '/plans/master.svg',
    isNew: true,
    stats: { pieces: '1200', year: '2025', age: '—', price: '€139.99', category: 'Star Wars', plan: 'Meistras+' },
    piecesNum: 1200, priceNum: 139.99, yearNum: 2025, planTier: 2, popularity: 1,
    ctaBg: '#FFAEE7',
    ctaLabel: 'Nuomok su Meistras+',
  },
]

const FILTER_OPTIONS = {
  series:  { label: 'Serija',       all: 'Visos serijos', options: ['Star Wars™', 'Creator Expert', 'Technic', 'City'] },
  plan:    { label: 'Prenumerata',  all: 'Visi planai',   options: ['Mėgėjas+', 'Meistras+', 'Pro+', 'Legenda+'] },
  age:     { label: 'Amžius',       all: 'Visi amžiai',  options: ['10+', '12+', '16+', '18+'] },
} as const

type FilterKey = keyof typeof FILTER_OPTIONS

type Filters = Record<FilterKey, string | null>

function applyFilters(products: Product[], filters: Filters): Product[] {
  return products.filter((p) => {
    if (filters.series && p.stats.category !== filters.series.replace('™', '')) {
      const seriesMatch = p.series === filters.series || p.stats.category === filters.series.replace('™', '')
      if (!seriesMatch) return false
    }
    if (filters.plan && p.stats.plan !== filters.plan) return false
    return true
  })
}

function FilterPill({
  filterKey,
  filters,
  onFilter,
}: {
  filterKey: FilterKey
  filters: Filters
  onFilter: (key: FilterKey, value: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const config = FILTER_OPTIONS[filterKey]
  const active = filters[filterKey]
  const label = active ?? config.label

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-4 py-1.5 brick-hover-sm data-[state=open]:bg-ink data-[state=open]:text-paper"
          style={active ? { backgroundColor: '#FFD731' } : undefined}
        >
          <span className="label-mono">{label}</span>
          <ChevronDown size={12} className="text-current opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-48 rounded-2xl border-2 border-ink p-1 shadow-[4px_4px_0_#001B21]">
        <button
          onClick={() => { onFilter(filterKey, null); setOpen(false) }}
          className="flex w-full items-center justify-between rounded-xl px-3 py-2 hover:bg-ink/5"
        >
          <span className="label-mono">{config.all}</span>
          {!active && <Check size={13} className="text-ink" />}
        </button>
        {config.options.map((opt) => (
          <button
            key={opt}
            onClick={() => { onFilter(filterKey, opt); setOpen(false) }}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2 hover:bg-ink/5"
          >
            <span className="label-mono">{opt}</span>
            {active === opt && <Check size={13} className="text-ink" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

function SortPill({
  selected,
  onSelect,
}: {
  selected: (typeof SORT_OPTIONS)[number]
  onSelect: (opt: (typeof SORT_OPTIONS)[number]) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-4 py-1.5 brick-hover-sm data-[state=open]:bg-ink data-[state=open]:text-paper">
          <span className="label-mono">Rūšiuoti: {selected.label}</span>
          <ChevronDown size={12} className="text-current opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 rounded-2xl border-2 border-ink p-1 shadow-[4px_4px_0_#001B21]">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { onSelect(opt); setOpen(false) }}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2 hover:bg-ink/5"
          >
            <span className="label-mono">{opt.label}</span>
            {selected.value === opt.value && <Check size={13} className="text-ink" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

function ProductCard({ product, delay }: { product: Product; delay: number }) {
  const planTheme = getPlanTheme(product.stats.plan)
  const statEntries = [
    ['Detalės', product.stats.pieces],
    ['Metai', product.stats.year],
    ['Amžius', product.stats.age],
    ['Kaina', product.stats.price],
    ['Kategorija', product.stats.category],
    ['Planas', product.stats.plan],
  ] as const

  return (
    <div
      className="reveal brick-card brick-card-hover flex flex-col overflow-hidden bg-white"
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Image area */}
      <div className="relative h-[280px] overflow-hidden border-b-2 border-ink bg-[#f8f6f2]">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-contain p-6"
        />
        <div
          className="pointer-events-none absolute left-4 top-4 flex h-12 w-12 items-center justify-center rounded-xl border-2 border-ink shadow-[3px_3px_0_#001B21]"
          style={{ backgroundColor: planTheme?.bg ?? '#FFD731' }}
        >
          <img src={getPlanBrickSvg(product.stats.plan)} alt="" className="h-8 w-auto select-none" />
        </div>
        {product.isNew && (
          <div className="absolute right-3 top-3 -rotate-12">
            <div
              className="flex h-[53px] w-[53px] items-center justify-center rounded-full border-2 border-ink shadow-[2px_2px_0_#001B21]"
              style={{ backgroundColor: '#FFD731' }}
            >
              <span className="font-display text-center text-[11px] leading-tight text-ink">Nauja</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="heading-display text-d-xs text-ink">{product.name}</h3>
          <p className="label-mono mt-1 text-ink/50">{product.series}</p>
        </div>

        <div className="grid grid-cols-3 gap-y-3 border-t border-ink/10 pt-3">
          {statEntries.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="font-mono text-[9px] uppercase tracking-[.22em] text-ink/40">{label}</span>
              <span className="font-mono text-[12px] font-bold text-ink">{value}</span>
            </div>
          ))}
        </div>

        <button
          className="mt-auto flex w-full items-center justify-between rounded-[22px] border-2 border-ink px-[18px] py-3"
          style={{ backgroundColor: planTheme?.bg ?? '#FFD731', color: planTheme?.textColor ?? '#001B21' }}
        >
          <span className="text-[13px] font-bold">{product.ctaLabel}</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}

export default function FeaturedProducts() {
  const ref = useReveal<HTMLDivElement>()
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]>(SORT_OPTIONS[0])
  const [filters, setFilters] = useState<Filters>({ series: null, plan: null, age: null })

  const handleFilter = (key: FilterKey, value: string | null) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const visible = useMemo(
    () => sortProducts(applyFilters(PRODUCTS, filters), sort.value),
    [filters, sort],
  )

  return (
    <section className="bg-paper py-10 md:py-20">
      <div className="mx-auto max-w-[1320px] px-4 md:px-7">
        {/* Filter bar */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(FILTER_OPTIONS) as FilterKey[]).map((key) => (
              <FilterPill key={key} filterKey={key} filters={filters} onFilter={handleFilter} />
            ))}
          </div>
          <SortPill selected={sort} onSelect={setSort} />
        </div>

        {/* Cards — horizontal scroll on mobile, 3-col grid on md+ */}
        <div
          ref={ref}
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:gap-7 md:overflow-visible md:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {visible.map((product, i) => (
            <div key={product.id} className="w-[82vw] shrink-0 snap-start md:w-auto md:shrink">
              <ProductCard product={product} delay={i * 80} />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-10 flex flex-col items-center gap-3">
          <Link
            to="/archive"
            className="rounded-full border-2 border-ink bg-white px-6 py-3 text-[17px] font-bold text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            Visi produktai ↓
          </Link>
          <p className="label-mono text-center text-ink/55">
            Rodoma {visible.length} iš 170 · {sort.label} pirmiausia
          </p>
        </div>
      </div>
    </section>
  )
}
