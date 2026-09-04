import { useState, useEffect, useMemo } from "react"
import { ArrowRight, XIcon } from "lucide-react"
import { Link } from "react-router-dom"
import { useReveal } from "@/hooks/useReveal"
import { supabase } from "@/lib/supabase"
import { SUBSCRIPTION_CHIPS, AGE_CHIPS } from "@/lib/product-filters"
import { SERIES } from "@/lib/series"
import { FilterPopover } from "@/components/FilterPopover"
import { SortPopover } from "@/components/SortPopover"
import {
  ProductCard,
  dbToProduct,
  type Product,
} from "@/components/ProductCard"
import { useProductAvailability } from "@/hooks/useProductAvailability"

const SORT_OPTIONS = [
  { value: "popular", label: "Populiariausi" },
  { value: "newest", label: "Naujausi" },
  { value: "bricks-desc", label: "Daugiausia detalių" },
  { value: "bricks-asc", label: "Mažiausia detalių" },
  { value: "available", label: "Laisvi dabar" },
] as const

type SortValue = (typeof SORT_OPTIONS)[number]["value"]

function sortProducts(products: Product[], by: SortValue): Product[] {
  const sorted = [...products]
  switch (by) {
    case "bricks-desc":
      return sorted.sort((a, b) => b.bricks - a.bricks)
    case "bricks-asc":
      return sorted.sort((a, b) => a.bricks - b.bricks)
    case "popular":
      return sorted.sort(
        (a, b) =>
          Number(b.featured) - Number(a.featured) ||
          (b.id as number) - (a.id as number)
      )
    // "newest" and "available" both fall back to newest-first ordering
    default:
      return sorted.sort((a, b) => (b.id as number) - (a.id as number))
  }
}

type Filters = {
  series: string[]
  plan: string[]
  age: string[]
  sortBy: SortValue
}

function applyFilters(products: Product[], filters: Filters): Product[] {
  return products.filter((p) => {
    const seriesOk =
      filters.series.length === 0 || filters.series.includes(p.category)
    const planOk =
      filters.plan.length === 0 || filters.plan.includes(p.requiredTier)
    const ageOk =
      filters.age.length === 0 ||
      p.minAge == null ||
      filters.age.includes(String(p.minAge))
    const availableOk =
      filters.sortBy !== "available" || p.status === "available"
    return seriesOk && planOk && ageOk && availableOk
  })
}

export default function FeaturedProducts() {
  const ref = useReveal<HTMLDivElement>()
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const { available } = useProductAvailability()
  const [sortBy, setSortBy] = useState<SortValue>("newest")
  const [seriesFilter, setSeriesFilter] = useState<string[]>([])
  const [tierFilter, setTierFilter] = useState<string[]>([])
  const [ageFilter, setAgeFilter] = useState<string[]>([])

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("featured", true)
      .order("id", { ascending: false })
      .then(({ data }) => {
        if (data) setRows(data)
        setLoading(false)
      })
  }, [])

  const products = useMemo(
    () => rows.map((row) => dbToProduct(row, available.get(row.id as number))),
    [rows, available]
  )

  const visible = useMemo(() => {
    const filters: Filters = {
      series: seriesFilter,
      plan: tierFilter,
      age: ageFilter,
      sortBy,
    }
    return sortProducts(applyFilters(products, filters), sortBy)
  }, [products, seriesFilter, tierFilter, ageFilter, sortBy])

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
              options={SERIES.map((s) => ({ value: s, label: s }))}
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
                  {visible.length} iš {products.length}
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
            side="top"
          />
        </div>

        {/* Cards — horizontal scroll on mobile, 3-col grid on md+ */}
        <div
          ref={ref}
          className="flex touch-pan-x snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:grid-cols-3 md:gap-7 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden"
        >
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="brick-card w-[82vw] shrink-0 animate-pulse snap-start overflow-hidden md:w-auto md:shrink"
                >
                  <div className="h-[280px] bg-ink/10" />
                  <div className="flex flex-col gap-3 p-4 md:p-5">
                    <div className="h-5 w-2/3 rounded bg-ink/10" />
                    <div className="h-3 w-1/2 rounded bg-ink/10" />
                    <div className="h-3 w-full rounded bg-ink/10" />
                    <div className="mt-auto h-9 rounded-xl bg-ink/10" />
                  </div>
                </div>
              ))
            : visible.map((product) => (
                <div
                  key={product.id}
                  className="w-[82vw] shrink-0 snap-start md:w-auto md:shrink"
                >
                  <ProductCard product={product} />
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
            Rodoma {visible.length} iš {products.length} · {sortLabel}{" "}
            pirmiausia
          </p>
        </div>
      </div>
    </section>
  )
}
