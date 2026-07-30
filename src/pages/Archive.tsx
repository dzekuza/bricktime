import { useState, useEffect } from "react"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { SERIES } from "@/lib/series"
import { SUBSCRIPTION_CHIPS, AGE_CHIPS } from "@/lib/product-filters"
import { FilterPopover } from "@/components/FilterPopover"
import { SortPopover } from "@/components/SortPopover"
import {
  ProductCard,
  dbToProduct,
  type Product,
} from "@/components/ProductCard"
import { NextDrop } from "@/components/NextDrop"

// ── filter constants ────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: "popular", label: "Populiariausi" },
  { value: "newest", label: "Naujausi" },
  { value: "bricks-desc", label: "Daugiausia detalių" },
  { value: "bricks-asc", label: "Mažiausia detalių" },
  { value: "available", label: "Laisvi dabar" },
] as const

type SortValue = (typeof SORT_OPTIONS)[number]["value"]

// ── page ───────────────────────────────────────────────────────────────────
export default function Archive() {
  const [tierFilter, setTierFilter] = useState<string[]>([])
  const [seriesFilter, setSeriesFilter] = useState<string[]>([])
  const [ageFilter, setAgeFilter] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<SortValue>("newest")
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .order("id", { ascending: false })
      .then(({ data }) => {
        if (data) setProducts(data.map(dbToProduct))
        setLoading(false)
      })
  }, [])

  const filteredProducts = products
    .filter((p) => {
      const tierOk =
        tierFilter.length === 0 || tierFilter.includes(p.requiredTier)
      const seriesOk =
        seriesFilter.length === 0 || seriesFilter.includes(p.category)
      const ageOk =
        ageFilter.length === 0 ||
        p.minAge == null ||
        ageFilter.includes(String(p.minAge))
      const availableOk = sortBy !== "available" || p.status === "available"
      return tierOk && seriesOk && ageOk && availableOk
    })
    .sort((a, b) => {
      if (sortBy === "bricks-desc") return b.bricks - a.bricks
      if (sortBy === "bricks-asc") return a.bricks - b.bricks
      if (sortBy === "popular")
        return (
          Number(b.featured) - Number(a.featured) ||
          (b.id as number) - (a.id as number)
        )
      // "newest" and "available" both fall back to newest-first ordering
      return (b.id as number) - (a.id as number)
    })

  const hasActiveFilter =
    tierFilter.length > 0 || seriesFilter.length > 0 || ageFilter.length > 0

  function clearFilters() {
    setTierFilter([])
    setSeriesFilter([])
    setAgeFilter([])
  }

  return (
    <>
      <Nav />

      {/* ── Hero ── */}
      <section className="bg-paper">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
            <div>
              <h1 className="heading-display text-d-xl tracking-[-0.015em] text-ink">
                Visi rinkiniai
                <br />
                <span className="inline-block -rotate-[1.5deg] border-[3px] border-ink bg-brand-yellow px-2 shadow-[5px_5px_0_rgba(0,27,33,0.12)]">
                  vienoje
                </span>{" "}
                vietoje
              </h1>
              <p className="mt-6 max-w-[52ch] text-[17px] leading-[1.65] text-ink/65">
                Naršyk rinkinius pagal temą, sudėtingumą ar prenumeratą ir
                atrask kitą konstravimo projektą.
              </p>
            </div>
            <div className="hidden lg:block">
              <img
                src="/images/build-castle.jpg"
                alt="LEGO rinkiniai"
                className="aspect-[2/1] w-full rounded-2xl border-2 border-ink object-cover shadow-[6px_6px_0_#001B21]"
              />
            </div>
          </div>
        </div>
      </section>

      <NextDrop />

      {/* ── Grid ── */}
      <section className="bg-paper pt-4 pb-16">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
          {/* Filters */}
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
                    {filteredProducts.length} iš {products.length}
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

          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="brick-card animate-pulse overflow-hidden"
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
              : filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
          </div>

          <div className="py-20 text-center">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full border-2 border-ink bg-paper text-[17px] font-bold text-ink transition-all hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[6px_6px_0_#001B21]"
            >
              Rodyti daugiau ↓
            </Button>
            <p className="label-mono mt-3.5 text-ink/55">
              Rodoma {filteredProducts.length} iš {products.length} · Naujausi
              pirmiausia
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
