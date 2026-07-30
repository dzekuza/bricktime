import { useState, useMemo } from "react"
import { ArrowRight, XIcon } from "lucide-react"
import { Link } from "react-router-dom"
import { useReveal } from "@/hooks/useReveal"
import { SUBSCRIPTION_CHIPS, AGE_CHIPS } from "@/lib/product-filters"
import { FilterPopover } from "@/components/FilterPopover"
import { SortPopover } from "@/components/SortPopover"
import {
  getSubscriptionBrickSvg,
  getSubscriptionTheme,
} from "@/lib/subscription-branding"

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
  // numeric fields for sorting/filtering
  piecesNum: number
  priceNum: number
  yearNum: number
  ageNum: number | null
  planTier: number // higher = more exclusive
  planKey: string // matches SUBSCRIPTION_CHIPS key
  popularity: number // higher = more popular
  ctaBg: string
  ctaLabel: string
}

const SORT_OPTIONS = [
  { value: "newest", label: "Naujausi" },
  { value: "popular", label: "Populiariausi" },
  { value: "pieces", label: "Daugiausiai detalių" },
  { value: "plan", label: "Aukščiausia prenumerata" },
  { value: "price_asc", label: "Pigiausi" },
  { value: "price_desc", label: "Brangiausi" },
] as const

type SortValue = (typeof SORT_OPTIONS)[number]["value"]

function sortProducts(products: Product[], by: SortValue): Product[] {
  const sorted = [...products]
  switch (by) {
    case "newest":
      return sorted.sort((a, b) => b.yearNum - a.yearNum)
    case "popular":
      return sorted.sort((a, b) => b.popularity - a.popularity)
    case "pieces":
      return sorted.sort((a, b) => b.piecesNum - a.piecesNum)
    case "plan":
      return sorted.sort((a, b) => b.planTier - a.planTier)
    case "price_asc":
      return sorted.sort((a, b) => a.priceNum - b.priceNum)
    case "price_desc":
      return sorted.sort((a, b) => b.priceNum - a.priceNum)
    default:
      return sorted
  }
}

const PRODUCTS: Product[] = [
  {
    id: 34,
    name: "Džabos barža",
    series: "Star Wars™",
    image:
      "https://www.lego.com/cdn/cs/set/assets/bltad48b7c771f86707/75397_Prod.png",
    brickImage: "/plans/how-mega.svg",
    isNew: true,
    stats: {
      pieces: "3943",
      year: "2025",
      age: "—",
      price: "€519.99",
      category: "Star Wars",
      plan: "Legenda",
    },
    piecesNum: 3943,
    priceNum: 519.99,
    yearNum: 2025,
    ageNum: null,
    planTier: 5,
    planKey: "mega",
    popularity: 2,
    ctaBg: "#FFD731",
    ctaLabel: "Prenumeruok su Legenda",
  },
  {
    id: 33,
    name: "TIE naikintuvas",
    series: "Star Wars™",
    image:
      "https://www.lego.com/cdn/cs/set/assets/blt42c7adf188ed2eb8/75382.png",
    brickImage: "/plans/how-nano.svg",
    isNew: false,
    stats: {
      pieces: "1931",
      year: "2023",
      age: "—",
      price: "€239.99",
      category: "Star Wars",
      plan: "Pro",
    },
    piecesNum: 1931,
    priceNum: 239.99,
    yearNum: 2023,
    ageNum: null,
    planTier: 3,
    planKey: "pro",
    popularity: 3,
    ctaBg: "#55DB9C",
    ctaLabel: "Prenumeruok su Pro",
  },
  {
    id: 32,
    name: "Grogu (Mandaloriečių mokinys)",
    series: "Star Wars™",
    image:
      "https://www.lego.com/cdn/cs/set/assets/blt7b211beb2f802707/blta8d62a90e62e020c-75446_Prod.png",
    brickImage: "/plans/master.svg",
    isNew: true,
    stats: {
      pieces: "1200",
      year: "2025",
      age: "—",
      price: "€139.99",
      category: "Star Wars",
      plan: "Meistras",
    },
    piecesNum: 1200,
    priceNum: 139.99,
    yearNum: 2025,
    ageNum: null,
    planTier: 2,
    planKey: "standard",
    popularity: 1,
    ctaBg: "#FFAEE7",
    ctaLabel: "Prenumeruok su Meistras",
  },
]

const SERIES_OPTIONS = ["Star Wars™", "Creator Expert", "Technic", "City"]

type Filters = {
  series: string[]
  plan: string[]
  age: string[]
}

function applyFilters(products: Product[], filters: Filters): Product[] {
  return products.filter((p) => {
    const seriesOk =
      filters.series.length === 0 ||
      filters.series.some(
        (s) => p.series === s || p.stats.category === s.replace("™", "")
      )
    const planOk = filters.plan.length === 0 || filters.plan.includes(p.planKey)
    const ageOk =
      filters.age.length === 0 ||
      p.ageNum == null ||
      filters.age.includes(String(p.ageNum))
    return seriesOk && planOk && ageOk
  })
}

function ProductCard({ product, delay }: { product: Product; delay: number }) {
  const planTheme = getSubscriptionTheme(product.stats.plan)
  const statEntries = [
    ["Detalės", product.stats.pieces],
    ["Metai", product.stats.year],
    ["Amžius", product.stats.age],
    ["Kaina", product.stats.price],
    ["Kategorija", product.stats.category],
    ["Prenumerata", product.stats.plan],
  ] as const

  return (
    <Link
      to={`/drop/${product.id}`}
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
        <img
          src={getSubscriptionBrickSvg(product.stats.plan)}
          alt=""
          className="pointer-events-none absolute top-4 left-4 h-10 w-auto select-none"
        />
        {product.isNew && (
          <div className="absolute top-3 right-3 -rotate-12">
            <div
              className="flex h-[53px] w-[53px] items-center justify-center rounded-full border-2 border-ink shadow-[2px_2px_0_#001B21]"
              style={{ backgroundColor: "#FFD731" }}
            >
              <span className="text-center font-display text-[11px] leading-tight text-ink">
                Nauja
              </span>
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
              <span className="font-mono text-[9px] tracking-[.22em] text-ink/40 uppercase">
                {label}
              </span>
              <span className="font-mono text-[12px] font-bold text-ink">
                {value}
              </span>
            </div>
          ))}
        </div>

        <div
          className="mt-auto flex w-full items-center justify-between rounded-[22px] border-2 border-ink px-[18px] py-3"
          style={{
            backgroundColor: planTheme?.bg ?? "#FFD731",
            color: planTheme?.textColor ?? "#001B21",
          }}
        >
          <span className="text-[13px] font-bold">{product.ctaLabel}</span>
          <ArrowRight size={16} />
        </div>
      </div>
    </Link>
  )
}

export default function FeaturedProducts() {
  const ref = useReveal<HTMLDivElement>()
  const [sortBy, setSortBy] = useState<SortValue>("newest")
  const [seriesFilter, setSeriesFilter] = useState<string[]>([])
  const [tierFilter, setTierFilter] = useState<string[]>([])
  const [ageFilter, setAgeFilter] = useState<string[]>([])

  const visible = useMemo(() => {
    const filters: Filters = {
      series: seriesFilter,
      plan: tierFilter,
      age: ageFilter,
    }
    return sortProducts(applyFilters(PRODUCTS, filters), sortBy)
  }, [seriesFilter, tierFilter, ageFilter, sortBy])

  const sortLabel =
    SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? sortBy
  const hasActiveFilter =
    seriesFilter.length > 0 || tierFilter.length > 0 || ageFilter.length > 0

  function clearFilters() {
    setSeriesFilter([])
    setTierFilter([])
    setAgeFilter([])
  }

  return (
    <section className="bg-paper py-10 md:py-20">
      <div className="mx-auto max-w-[1320px] px-4 md:px-7">
        {/* Filter bar */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <FilterPopover
              label={seriesFilter.length === 0 ? "Visos temos" : "Tema"}
              options={SERIES_OPTIONS.map((s) => ({ value: s, label: s }))}
              selected={seriesFilter}
              onChange={setSeriesFilter}
            />
            <FilterPopover
              label="Filtrai pagal prenumeratą"
              options={SUBSCRIPTION_CHIPS.map(({ key, label }) => ({
                value: key,
                label,
              }))}
              selected={tierFilter}
              onChange={setTierFilter}
            />
            <FilterPopover
              label="Amžius"
              options={AGE_CHIPS.map((age) => ({
                value: String(age),
                label: `${age}+`,
              }))}
              selected={ageFilter}
              onChange={setAgeFilter}
            />
            {hasActiveFilter && (
              <>
                <span className="mx-1 h-5 w-px bg-ink/20" />
                <span className="font-mono text-[11px] tracking-[.06em] text-ink/50 uppercase">
                  {visible.length} iš {PRODUCTS.length}
                </span>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 font-mono text-[11px] tracking-[.06em] text-ink/40 uppercase transition-colors hover:text-ink"
                >
                  <XIcon className="size-3" />
                  Išvalyti
                </button>
              </>
            )}
          </div>
          <SortPopover
            value={sortBy}
            options={SORT_OPTIONS}
            onChange={setSortBy}
          />
        </div>

        {/* Cards — horizontal scroll on mobile, 3-col grid on md+ */}
        <div
          ref={ref}
          className="flex touch-pan-x snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:grid-cols-3 md:gap-7 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden"
        >
          {visible.map((product, i) => (
            <div
              key={product.id}
              className="w-[82vw] shrink-0 snap-start md:w-auto md:shrink"
            >
              <ProductCard product={product} delay={i * 80} />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-10 flex flex-col items-center gap-3">
          <Link
            to="/archive"
            className="brick-hover-sm flex h-12 items-center gap-2 rounded-full border-2 border-ink bg-white px-[26px] text-[16px] leading-[26px] font-bold text-ink"
          >
            Peržiūrėti rinkinius
            <ArrowRight size={16} />
          </Link>
          <p className="label-mono text-center text-ink/55">
            Rodoma {visible.length} iš 170 · {sortLabel} pirmiausia
          </p>
        </div>
      </div>
    </section>
  )
}
