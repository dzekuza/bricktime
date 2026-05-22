import { useState, useEffect } from "react"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { ChevronDownIcon, CheckIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { supabase } from "@/lib/supabase"
import { SERIES } from "@/lib/series"
import { ProductCard, dbToProduct, type Product } from "@/components/ProductCard"
import { NextDrop } from "@/components/NextDrop"

// ── types ──────────────────────────────────────────────────────────────────

// ── filter constants ────────────────────────────────────────────────────────
const SUBSCRIPTION_CHIPS = [
  { key: "nano",      label: "Mėgėjas" },
  { key: "mini",      label: "Kūrėjas" },
  { key: "standard",  label: "Meistras" },
  { key: "pro",       label: "Pro" },
  { key: "mega",      label: "Legenda" },
  { key: "mystery_s", label: "Mystery Box S" },
  { key: "mystery_m", label: "Mystery Box M" },
] as const

const AGE_CHIPS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18] as const

// ── helpers ─────────────────────────────────────────────────────────────────
// ── sort popover ────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: "newest", label: "Naujausi" },
  { value: "oldest", label: "Seniausi" },
  { value: "az",     label: "A → Ž" },
  { value: "za",     label: "Ž → A" },
] as const

type SortValue = (typeof SORT_OPTIONS)[number]["value"]

function SortPopover({
  value,
  onChange,
}: {
  value: SortValue
  onChange: (v: SortValue) => void
}) {
  const [open, setOpen] = useState(false)
  const label = SORT_OPTIONS.find((o) => o.value === value)?.label ?? value

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-4 py-1.5 brick-hover-sm data-[state=open]:bg-ink data-[state=open]:text-paper">
          <span className="label-mono whitespace-nowrap font-bold">Rūšiuoti: {label}</span>
          <ChevronDownIcon className="size-3 text-current opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 rounded-2xl border-2 border-ink p-1 shadow-[4px_4px_0_#001B21]">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { onChange(opt.value); setOpen(false) }}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2 hover:bg-ink/5"
          >
            <span className="label-mono whitespace-nowrap">{opt.label}</span>
            {value === opt.value && <CheckIcon className="size-3 text-ink" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

// ── sub-components ─────────────────────────────────────────────────────────
function FilterPopover({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (next: string[]) => void
}) {
  const active = selected.length > 0

  function toggle(value: string) {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-4 py-1.5 brick-hover-sm data-[state=open]:bg-ink data-[state=open]:text-paper"
        >
          <span className="label-mono whitespace-nowrap font-bold">{label}</span>
          {active && (
            <span className="flex size-4 items-center justify-center rounded-full bg-ink/10 text-[10px] font-bold leading-none text-ink">
              {selected.length}
            </span>
          )}
          <ChevronDownIcon className="size-3 text-current opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-56 rounded-2xl border-2 border-ink p-2 shadow-[4px_4px_0_#001B21]"
      >
        <div className="max-h-64 overflow-y-auto">
          {options.map(({ value, label: optLabel }) => {
            const checked = selected.includes(value)
            return (
              <button
                key={value}
                onClick={() => toggle(value)}
                className={[
                  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left font-mono text-[11px] tracking-[.04em] uppercase font-semibold transition-colors",
                  checked
                    ? "bg-ink text-paper"
                    : "text-ink hover:bg-ink/5",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex size-4 shrink-0 items-center justify-center rounded border-2 transition-colors",
                    checked
                      ? "border-paper/40 bg-transparent"
                      : "border-ink/30",
                  ].join(" ")}
                >
                  {checked && <CheckIcon className="size-2.5" />}
                </span>
                {optLabel}
              </button>
            )
          })}
        </div>
        {selected.length > 0 && (
          <div className="mt-1 border-t border-ink/10 pt-1">
            <button
              onClick={() => onChange([])}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 font-mono text-[10px] tracking-[.06em] uppercase text-ink/40 transition-colors hover:text-ink"
            >
              <XIcon className="size-3" />
              Išvalyti
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

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
      const tierOk = tierFilter.length === 0 || tierFilter.includes(p.requiredTier)
      const seriesOk = seriesFilter.length === 0 || seriesFilter.includes(p.category)
      const ageOk =
        ageFilter.length === 0 ||
        p.minAge == null ||
        ageFilter.includes(String(p.minAge))
      return tierOk && seriesOk && ageOk
    })
    .sort((a, b) => {
      if (sortBy === "oldest") return (a.id as number) - (b.id as number)
      if (sortBy === "az") return (a.title ?? "").localeCompare(b.title ?? "", "lt")
      if (sortBy === "za") return (b.title ?? "").localeCompare(a.title ?? "", "lt")
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
                Visi rinkiniai<br />
                <span className="inline-block -rotate-[1.5deg] border-[3px] border-ink bg-brand-yellow px-2 shadow-[5px_5px_0_rgba(0,27,33,0.12)]">
                  vienoje
                </span>{" "}
                vietoje
              </h1>
              <p className="mt-6 max-w-[52ch] text-[17px] leading-[1.65] text-ink/65">
                Vos keli paprasti žingsniai iki naujo konstravimo projekto tavo namuose. Pasirink planą pagal savo poreikius, išsirink norimą rinkinį, gauk jį į namus ar paštomatą ir keisk į naują kada panorėjęs.
              </p>
            </div>
            <div className="hidden lg:block">
              <img
                src="/images/build-castle.jpg"
                alt="LEGO rinkiniai"
                className="w-full rounded-2xl border-2 border-ink object-cover aspect-[2/1] shadow-[6px_6px_0_#001B21]"
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
                label="Serija"
                options={SERIES.map((s) => ({ value: s, label: s }))}
                selected={seriesFilter}
                onChange={setSeriesFilter}
              />
              <FilterPopover
                label="Prenumerata"
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
                  <span className="font-mono text-[11px] tracking-[.06em] uppercase text-ink/50">
                    {filteredProducts.length} iš {products.length}
                  </span>
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 font-mono text-[11px] tracking-[.06em] uppercase text-ink/40 transition-colors hover:text-ink"
                  >
                    <XIcon className="size-3" />
                    Išvalyti
                  </button>
                </>
              )}
            </div>
            <SortPopover value={sortBy} onChange={setSortBy} />
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
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
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
              Rodoma {filteredProducts.length} iš {products.length} · Naujausi pirmiausia
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
