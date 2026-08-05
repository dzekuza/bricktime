import { Link } from "react-router-dom"
import { ArrowRightIcon } from "lucide-react"
import {
  getSubscriptionDisplayName,
  getSubscriptionTheme,
  getSubscriptionBrickSvg,
} from "@/lib/subscription-branding"

export type Tier =
  | "nano"
  | "mini"
  | "standard"
  | "pro"
  | "mega"
  | "mystery_s"
  | "mystery_m"

export interface Product {
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
  status: "available" | "limited" | "sold_out"
}

function planTier(plan: string, level: number) {
  const theme = getSubscriptionTheme(plan)
  return {
    label: getSubscriptionDisplayName(plan),
    bg: theme?.bg ?? "#1C1C2E",
    textColor: theme?.textColor ?? "#F5F1EB",
    level,
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export const tierConfig: Record<
  Tier,
  { label: string; bg: string; textColor: string; level: number }
> = {
  nano: planTier("nano", 1),
  mini: planTier("mini", 2),
  standard: planTier("standard", 3),
  pro: planTier("pro", 4),
  mega: planTier("mega", 5),
  mystery_s: planTier("mystery_s", 0),
  mystery_m: planTier("mystery_m", 0),
}

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

// eslint-disable-next-line react-refresh/only-export-components
export function dbToProduct(row: Record<string, unknown>): Product {
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
    brickColors: (row.brick_colors as string[]) ?? [],
    brickHeights: (row.brick_heights as number[]) ?? [],
    requiredTier: row.tier as Tier,
    minAge: row.min_age as number | null | undefined,
    price: row.value as number | null | undefined,
    image: row.image_url as string | undefined,
    status: (status as Product["status"]) ?? "available",
  }
}

function MockModel({
  colors,
  heights,
}: {
  colors: string[]
  heights: number[]
}) {
  return (
    <div className="relative z-10 flex h-[180px] items-end gap-1.5 px-5 pb-0">
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
          ? { background: "#f8f6f2" }
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

export function ProductCard({ product }: { product: Product }) {
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
        <img
          src={getSubscriptionBrickSvg(product.requiredTier)}
          alt=""
          className="pointer-events-none absolute top-[14px] left-[14px] z-10 h-10 w-auto select-none"
        />

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
          <h3 className="heading-display text-d-xs leading-[.95] text-ink">
            {product.title}
          </h3>
          <p className="mt-1 font-mono text-[11px] tracking-[.12em] text-ink/50 uppercase">
            {product.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-x-3 gap-y-2.5 border-t border-ink/10 pt-3">
          <div>
            <p className="label-mono text-[9px] text-ink/40">Detalės</p>
            <p className="font-mono text-[12px] font-bold text-ink">
              {product.bricks}
            </p>
          </div>
          <div>
            <p className="label-mono text-[9px] text-ink/40">Metai</p>
            <p className="font-mono text-[12px] font-bold text-ink">
              {product.year}
            </p>
          </div>
          <div>
            <p className="label-mono text-[9px] text-ink/40">Amžius</p>
            <p className="font-mono text-[12px] font-bold text-ink">
              {product.minAge ? `${product.minAge}+` : "—"}
            </p>
          </div>
          <div>
            <p className="label-mono text-[9px] text-ink/40">Briksių vertė</p>
            <p className="font-mono text-[12px] font-bold text-ink">
              {product.price != null ? `${product.price} Kr.` : "—"}
            </p>
          </div>
          <div>
            <p className="label-mono text-[9px] text-ink/40">Kategorija</p>
            <p className="font-mono text-[12px] font-bold text-ink capitalize">
              {product.category || "—"}
            </p>
          </div>
          <div>
            <p className="label-mono text-[9px] text-ink/40">Prenumerata</p>
            <p className="font-mono text-[12px] font-bold text-ink">
              {tier.label}
            </p>
          </div>
        </div>

        <div
          className="mt-auto flex items-center justify-between rounded-xl border-2 border-ink px-4 py-2.5 text-[13px] font-bold transition-all group-hover:shadow-[4px_4px_0_#001B21]"
          style={{ background: tier.bg, color: tier.textColor }}
        >
          <span>Prenumeruok su {tier.label}</span>
          <ArrowRightIcon className="size-4" />
        </div>
      </div>
    </Link>
  )
}
