import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { ArrowRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { getPlanDisplayName } from "@/lib/plan-branding"

// ── types ──────────────────────────────────────────────────────────────────
type Tier = "nano" | "mini" | "standard" | "pro" | "mega"

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
  image?: string
}

// ── tier config ────────────────────────────────────────────────────────────
const tierConfig: Record<
  Tier,
  { label: string; bg: string; textColor: string; level: number }
> = {
  nano: {
    label: getPlanDisplayName("nano"),
    bg: "#F5F1EB",
    textColor: "#001B21",
    level: 1,
  },
  mini: {
    label: getPlanDisplayName("mini"),
    bg: "#FFAEE7",
    textColor: "#001B21",
    level: 2,
  },
  standard: {
    label: getPlanDisplayName("standard"),
    bg: "#FFD731",
    textColor: "#001B21",
    level: 3,
  },
  pro: {
    label: getPlanDisplayName("pro"),
    bg: "#4DA2FF",
    textColor: "#001B21",
    level: 4,
  },
  mega: {
    label: getPlanDisplayName("mega"),
    bg: "#FB4903",
    textColor: "#F5F1EB",
    level: 5,
  },
}

// ── data ───────────────────────────────────────────────────────────────────
const LT_MONTHS = [
  "sausis",
  "vasaris",
  "kovas",
  "balandis",
  "gegužė",
  "birželis",
  "liepa",
  "rugpjūtis",
  "rugsėjis",
  "spalis",
  "lapkritis",
  "gruodis",
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
    image: row.image_url as string | undefined,
  }
}

// ── sub-components ─────────────────────────────────────────────────────────
function MockModel({
  colors,
  heights,
}: {
  colors: string[]
  heights: number[]
}) {
  return (
    <div
      className="relative z-10 flex items-end gap-1.5 px-5 pb-0"
      style={{ height: 180 }}
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
        <>
          <img
            src={image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div
            className="absolute inset-0"
            style={{ background: `${color}55` }}
          />
        </>
      )}
      {children}
    </div>
  )
}

function TierBadge({ tier }: { tier: Tier }) {
  const t = tierConfig[tier]
  const isTop = tier === "mega"
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-3 py-1 font-mono text-[10px] font-bold tracking-[.12em] uppercase"
      style={{ background: t.bg, color: t.textColor }}
    >
      {isTop ? "🔒 " : ""}
      {t.label}
      {isTop ? " tik" : "+"}
    </span>
  )
}

function ProductCard({
  product,
  featured = false,
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
      className={[
        "group brick-card brick-card-hover flex flex-col overflow-hidden bg-paper text-ink no-underline",
        "",
      ].join(" ")}
    >
      {/* Visual */}
      <StudBg
        color={product.bg}
        image={product.image}
        className={`relative h-[280px] border-b-2 border-ink`}
      >
        {/* Badge */}
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

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4 md:p-5">
        <div>
          <h3
            className="heading-display text-d-xs text-ink"
            style={{ lineHeight: ".95" }}
          >
            {product.title}
          </h3>
          <p className="mt-1 font-mono text-[11px] tracking-[.12em] text-ink/50 uppercase">
            {product.subtitle}
          </p>
        </div>

        <p className="line-clamp-2 text-[13px] leading-[1.5] text-ink/60">
          {featured
            ? "Penkių aukštų daugiabutis su veikiančiomis pašto dėžutėmis, trimis balkonais ir kryžminio personažo minifigūrėle."
            : `${product.bricks} detalės · ${product.minifigs}${product.rating ? " · " + product.rating.split(" ").pop() : ""}`}
        </p>

        {/* Tier + rating row */}
        <div className="flex flex-wrap items-center gap-2">
          <TierBadge tier={product.requiredTier} />
          {product.rating && (
            <span className="inline-flex items-center gap-1 rounded-full border-[1.5px] border-ink px-2.5 py-1 font-mono text-[10px] tracking-[.08em] text-ink">
              ★ {product.rating.split(" ").pop()}
            </span>
          )}
        </div>

        {/* Footer CTA */}
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
  const [tierFilter, setTierFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
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

  const tierOrder: Tier[] = ["nano", "mini", "standard", "pro", "mega"]
  const categories = [...new Set(products.map((p) => p.category))].sort()

  const filteredProducts = products.filter((p) => {
    const tierOk =
      tierFilter === "all" ||
      tierOrder.indexOf(p.requiredTier) >= tierOrder.indexOf(tierFilter as Tier)
    const catOk = categoryFilter === "all" || p.category === categoryFilter
    return tierOk && catOk
  })

  return (
    <>
      <Nav />

      {/* ── Hero ── */}
      <section className="bg-paper py-4 md:py-6">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
          <div className="overflow-hidden rounded-2xl border-2 border-ink bg-ink p-4 md:rounded-3xl md:p-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Left tile */}
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
                    <span
                      className="inline-block text-brand-orange italic"
                      style={{ transform: "skew(-8deg)" }}
                    >
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

              {/* Right tile — stats */}
              <div className="brick-card brick-card-hover flex min-h-[420px] flex-col justify-around bg-brand-orange p-6 md:p-9 lg:col-span-4">
                {[
                  ["26", "Rinkinių katalogas"],
                  ["7 840", "Detalių iš viso"],
                  ["54", "Minifigūrėlių"],
                ].map(([val, label]) => (
                  <div
                    key={label}
                    className="flex flex-col gap-2 border-b border-paper/20 pb-8 last:border-b-0 last:pb-0"
                  >
                    <b
                      className="heading-display text-d-lg"
                      style={{ color: "#F5F1EB" }}
                    >
                      {val}
                    </b>
                    <small className="label-mono text-paper/70">{label}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Grid ── */}
      <section className="bg-paper pt-4 pb-16">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
          {/* Filters */}
          <div className="mb-8 flex flex-wrap gap-3">
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-[180px] rounded-full border-2 border-ink text-[14px] font-semibold">
                <SelectValue placeholder="Planas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Visi planai</SelectItem>
                <SelectItem value="nano">Starter+</SelectItem>
                <SelectItem value="mini">Advanced+</SelectItem>
                <SelectItem value="standard">Builder+</SelectItem>
                <SelectItem value="pro">Master+</SelectItem>
                <SelectItem value="mega">Tik Legend</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px] rounded-full border-2 border-ink text-[14px] font-semibold">
                <SelectValue placeholder="Kategorija" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Visos kategorijos</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(tierFilter !== "all" || categoryFilter !== "all") && (
              <button
                onClick={() => {
                  setTierFilter("all")
                  setCategoryFilter("all")
                }}
                className="rounded-full border-2 border-ink/30 px-4 py-2 text-[13px] font-semibold text-ink/50 transition-all hover:border-ink hover:text-ink"
              >
                Išvalyti
              </button>
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

          {/* Load more */}
          <div className="py-20 text-center">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full border-2 border-ink bg-paper text-[17px] font-bold text-ink transition-all hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[6px_6px_0_#001B21]"
            >
              Rodyti daugiau ↓
            </Button>
            <p className="label-mono mt-3.5 text-ink/55">
              Rodoma {filteredProducts.length} iš 26 · Naujausi pirmiausia
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
