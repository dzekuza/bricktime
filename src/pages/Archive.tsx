import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { ArrowRightIcon, ChevronDownIcon, CheckIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { supabase } from "@/lib/supabase"
import { getPlanDisplayName, getPlanTheme } from "@/lib/plan-branding"
import { SERIES } from "@/lib/series"
import { NextDrop } from "@/components/NextDrop"

// ── types ──────────────────────────────────────────────────────────────────
type Tier =
  | "nano"
  | "mini"
  | "standard"
  | "pro"
  | "mega"
  | "mystery_s"
  | "mystery_m"

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
  badge?: "new" | "sold-out" | "limited"
  badgeLabel?: string
  featured?: boolean
  brickColors: string[]
  brickHeights: number[]
  requiredTier: Tier
  minAge?: number | null
  price?: number | null
  image?: string
}

// ── tier config ────────────────────────────────────────────────────────────
function planTier(plan: string, level: number) {
  const theme = getPlanTheme(plan)
  return { label: getPlanDisplayName(plan), bg: theme?.bg ?? "#1C1C2E", textColor: theme?.textColor ?? "#F5F1EB", level }
}

const tierConfig: Record<Tier, { label: string; bg: string; textColor: string; level: number }> = {
  nano:      planTier("nano",     1),
  mini:      planTier("mini",     2),
  standard:  planTier("standard", 3),
  pro:       planTier("pro",      4),
  mega:      planTier("mega",     5),
  mystery_s: { label: "Mystery Box S", bg: "#FFD731", textColor: "#001B21", level: 0 },
  mystery_m: { label: "Mystery Box M", bg: "#FFAEE7", textColor: "#001B21", level: 0 },
}

// ── filter constants ────────────────────────────────────────────────────────
const SUBSCRIPTION_CHIPS = [
  { key: "nano",      label: "Mėgėjas" },
  { key: "mini",      label: "Kūrėjas" },
  { key: "standard",  label: "Masteris" },
  { key: "mega",      label: "Legenda" },
  { key: "mystery_s", label: "Mystery Box S" },
  { key: "mystery_m", label: "Mystery Box M" },
] as const

const AGE_CHIPS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18] as const

// ── helpers ─────────────────────────────────────────────────────────────────
const LT_MONTHS = [
  "sausis", "vasaris", "kovas", "balandis", "gegužė", "birželis",
  "liepa", "rugpjūtis", "rugsėjis", "spalis", "lapkritis", "gruodis",
]

function formatReleaseDate(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  return `${d.getFullYear()} ${LT_MONTHS[d.getMonth()]}`
}

function dbToProduct(row: Record<string, unknown>): Product {
  const status = row.status as string
  let badge: Product["badge"]
  let badgeLabel: string | undefined
  if (row.is_new) {
    badge = "new"
    badgeLabel = "Nauja"
  } else if (status === "sold_out") {
    badge = "sold-out"
    badgeLabel = "Išnuomota"
  } else if (status === "limited") {
    badge = "limited"
    badgeLabel = "Ribotas"
  }
  return {
    id: row.id as number,
    title: row.title as string,
    subtitle: row.subtitle as string,
    date: formatReleaseDate(row.release_date as string | null),
    category: row.category as string,
    year: row.year as number,
    bricks: row.bricks as number,
    minifigs: row.minifigs as string,
    rating: row.rating as string | undefined,
    bg: row.bg as string,
    badge,
    badgeLabel,
    featured: row.featured as boolean,
    brickColors: row.brick_colors as string[],
    brickHeights: row.brick_heights as number[],
    requiredTier: row.tier as Tier,
    minAge: row.min_age as number | null | undefined,
    price: row.value as number | null | undefined,
    image: row.image_url as string | undefined,
  }
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
          className={[
            "inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-4 py-1.5 font-mono text-[11px] tracking-[.06em] uppercase font-bold transition-all select-none",
            active
              ? "bg-ink text-paper"
              : "bg-paper text-ink hover:bg-ink/5",
          ].join(" ")}
        >
          {label}
          {active && (
            <span className="flex size-4 items-center justify-center rounded-full bg-paper/20 text-[10px] font-bold leading-none">
              {selected.length}
            </span>
          )}
          <ChevronDownIcon className="size-3 opacity-60" />
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

function MockModel({
  colors,
  heights,
}: {
  colors: string[]
  heights: number[]
}) {
  return (
    <div
      className="relative z-10 flex items-end gap-1.5 px-5 pb-0 h-[180px]"
    >
      {colors.map((color, i) => (
        <div
          key={i}
          className="relative rounded border-[2px] border-ink"
          style={{
            background: color,
            width: 30 + (i % 2) * 10,
            height: heights[i] ?? 40,
            boxShadow: "inset 0 -6px 0 rgba(0,0,0,.18)",
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

function StudBg({
  color,
  image,
  children,
  className = "",
}: {
  color: string
  image?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={
        image
          ? { background: color }
          : {
              background: color,
              backgroundImage:
                "radial-gradient(circle at 14px 14px, rgba(255,255,255,.16) 4px, transparent 5px)",
              backgroundSize: "36px 36px",
            }
      }
    >
      {image && (
        <img
          src={image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}
      {children}
    </div>
  )
}

function ProductCard({
  product,
  featured: _featured = false,
}: {
  product: Product
  featured?: boolean
}) {
  const badgeBg =
    product.badge === "new"
      ? "#FFD731"
      : product.badge === "sold-out"
        ? "#001B21"
        : "#FB4903"
  const badgeColor = product.badge === "new" ? "#001B21" : "#F5F1EB"
  const tier = tierConfig[product.requiredTier]

  return (
    <Link
      to={`/drop/${product.id}`}
      className="group brick-card brick-card-hover flex flex-col overflow-hidden bg-paper text-ink no-underline"
    >
      <StudBg
        color={product.bg}
        image={product.image}
        className="relative h-[280px] border-b-2 border-ink"
      >
        {product.badge && (
          <div
            className="absolute top-[18px] right-[18px] z-10 grid size-[78px] -rotate-12 place-items-center rounded-full border-2 border-ink p-2 text-center font-display text-[13px] leading-none shadow-[3px_3px_0_#001B21]"
            style={{ background: badgeBg, color: badgeColor }}
          >
            {product.badgeLabel?.split(" ").map((w, i) => (
              <span key={i} className="block">
                {w}
              </span>
            ))}
          </div>
        )}
        {!product.image && (
          <div className="absolute right-0 bottom-0 left-0 flex items-end justify-center">
            <MockModel
              colors={product.brickColors}
              heights={product.brickHeights}
            />
          </div>
        )}
      </StudBg>

      <div className="flex flex-1 flex-col gap-3 p-4 md:p-5">
        <div>
          <h3
            className="heading-display text-d-xs text-ink leading-[.95]"
          >
            {product.title}
          </h3>
          <p className="mt-1 font-mono text-[11px] tracking-[.12em] text-ink/50 uppercase">
            {product.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-x-3 gap-y-2.5 border-t border-ink/10 pt-3">
          <div>
            <p className="label-mono text-ink/40 text-[9px]">Detalės</p>
            <p className="font-mono text-[12px] font-bold text-ink">{product.bricks}</p>
          </div>
          <div>
            <p className="label-mono text-ink/40 text-[9px]">Metai</p>
            <p className="font-mono text-[12px] font-bold text-ink">{product.year}</p>
          </div>
          <div>
            <p className="label-mono text-ink/40 text-[9px]">Amžius</p>
            <p className="font-mono text-[12px] font-bold text-ink">{product.minAge ? `${product.minAge}+` : '—'}</p>
          </div>
          <div>
            <p className="label-mono text-ink/40 text-[9px]">Kaina</p>
            <p className="font-mono text-[12px] font-bold text-ink">{product.price ? `€${product.price}` : '—'}</p>
          </div>
          <div>
            <p className="label-mono text-ink/40 text-[9px]">Kategorija</p>
            <p className="font-mono text-[12px] font-bold text-ink capitalize">{product.category || '—'}</p>
          </div>
          <div>
            <p className="label-mono text-ink/40 text-[9px]">Planas</p>
            <p className="font-mono text-[12px] font-bold text-ink">{tier.label}+</p>
          </div>
        </div>

        <div
          className="mt-auto flex items-center justify-between rounded-xl border-2 border-ink px-4 py-2.5 text-[13px] font-bold transition-all group-hover:shadow-[4px_4px_0_#001B21]"
          style={{ background: tier.bg, color: tier.textColor }}
        >
          <span>Nuomok su {tier.label}+</span>
          <ArrowRightIcon className="size-4" />
        </div>
      </div>
    </Link>
  )
}

// ── page ───────────────────────────────────────────────────────────────────
export default function Archive() {
  const [tierFilter, setTierFilter] = useState<string[]>([])
  const [seriesFilter, setSeriesFilter] = useState<string[]>([])
  const [ageFilter, setAgeFilter] = useState<string[]>([])
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

  const filteredProducts = products.filter((p) => {
    const tierOk = tierFilter.length === 0 || tierFilter.includes(p.requiredTier)
    const seriesOk = seriesFilter.length === 0 || seriesFilter.includes(p.category)
    const ageOk =
      ageFilter.length === 0 ||
      p.minAge == null ||
      ageFilter.includes(String(p.minAge))
    return tierOk && seriesOk && ageOk
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
      <section className="bg-paper py-4 md:py-6">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
          <div className="overflow-hidden rounded-2xl border-2 border-ink bg-ink p-4 md:rounded-3xl md:p-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="brick-card brick-card-hover flex min-h-[420px] flex-col justify-between bg-ink p-6 md:p-9 lg:col-span-8">
                <div className="label-mono mb-6 flex items-center gap-2.5">
                  <Link
                    to="/"
                    className="text-paper/50 transition-colors hover:text-paper"
                  >
                    BRICKTIME
                  </Link>
                  <span className="text-paper/30">/</span>
                  <span className="text-paper/50">Produktai</span>
                </div>

                <div className="flex flex-1 flex-col justify-center">
                  <h1 className="heading-display text-d-xl max-w-[14ch] tracking-[-0.015em] text-paper">
                    Visi{" "}
                    <span className="inline-block text-brand-yellow italic skew-x-[-8deg]">
                      rinkiniai,
                    </span>
                    <br />
                    vienoje vietoje.
                  </h1>

                  <p className="mt-6 max-w-[52ch] text-[17px] leading-[1.65] text-paper/70">
                    Peržiūrėk visą BRICKTIME katalogą — dvidešimt šeši unikalūs
                    rinkiniai iš miesto, transporto, sci-fi ir gamtos pasaulių.
                    Pasiimk bet kurį rinkinį su aktyvia prenumerata.
                  </p>
                </div>
              </div>

              <div className="brick-card-hover flex min-h-[420px] flex-col justify-around rounded-2xl md:rounded-3xl border-2 border-white/20 shadow-[6px_6px_0_#001B21] bg-white/10 p-6 md:p-9 lg:col-span-4">
                {[
                  ["26", "Rinkinių katalogas"],
                  ["7 840", "Detalių iš viso"],
                  ["54", "Minifigūrėlių"],
                ].map(([val, label]) => (
                  <div
                    key={label}
                    className="flex flex-col gap-2 border-b border-white/20 pb-8 last:border-b-0 last:pb-0"
                  >
                    <b className="heading-display text-d-lg text-paper">
                      {val}
                    </b>
                    <small className="label-mono text-white/70">{label}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <NextDrop />

      {/* ── Grid ── */}
      <section className="bg-paper pt-4 pb-16">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
          {/* Filters */}
          <div className="mb-8 flex flex-wrap items-center gap-2">
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
                    featured={product.featured}
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
