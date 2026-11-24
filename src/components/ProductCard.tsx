import { useRef, useState, type MouseEvent } from "react"
import { Link } from "react-router-dom"
import { ArrowRightIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ImagePlaceholder } from "@/components/ImagePlaceholder"
import { ProductCardCartButton } from "@/components/ProductCardCartButton"
import { RatingBadge } from "@/components/reviews/RatingBadge"
import { useProductRatings } from "@/hooks/useProductRatings"
import {
  getSubscriptionDisplayName,
  getSubscriptionTheme,
  getSubscriptionBrickSvg,
} from "@/lib/subscription-branding"
import { formatReleaseMonth } from "@/lib/vilnius-time"
import { getDisplayPlan } from "@/lib/product-filters"

export type Tier =
  | "nano"
  | "mini"
  | "standard"
  | "pro"
  | "mega"
  | "mystery_s"
  | "mystery_m"

const MAX_HOVER_IMAGES = 6

export interface Product {
  id: number
  slug: string
  title: string
  subtitle: string
  date: string
  category: string
  year: number
  bricks: number
  minifigs: string
  rating?: string
  bg: string
  badge?: "sold-out" | "limited"
  badgeLabel?: string
  isNew: boolean
  featured?: boolean
  brickColors: string[]
  brickHeights: number[]
  requiredTier: Tier
  allowedTiers: Tier[]
  minAge?: number | null
  price?: number | null
  value?: number | null
  image?: string
  gallery: string[]
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

// "su …" takes the instrumental case, so the plan name can't be reused as-is.
const SUBSCRIBE_WITH_LABEL: Partial<Record<Tier, string>> = {
  nano: "Mėgėju",
  mini: "Kūrėju",
  standard: "Meistru",
  mega: "Legenda",
}

const NEW_BADGE_DAYS = 7

// A set counts as new for a week after it drops, so a scheduled coming-soon
// product flips to the "Naujiena" badge on its own when the release date passes.
// Sets added without a release date count from the day they were added.
function isRecentlyReleased(iso: string | null, now: number): boolean {
  if (!iso) return false
  const releaseAt = new Date(iso).getTime()
  return now >= releaseAt && now < releaseAt + NEW_BADGE_DAYS * 24 * 3600 * 1000
}

// eslint-disable-next-line react-refresh/only-export-components
export function dbToProduct(
  row: Record<string, unknown>,
  available?: number
): Product {
  // Every copy already out counts as occupied regardless of the hand-set
  // status, so a fully rented set reads "Užimtas" without an admin edit.
  const isRentedOut = available != null && available <= 0
  const status = isRentedOut ? "sold_out" : (row.status as string)
  const releaseDate = row.release_date as string | null
  const isNew =
    !isRentedOut &&
    (Boolean(row.is_new) ||
      isRecentlyReleased(
        releaseDate ?? (row.created_at as string | null | undefined) ?? null,
        Date.now()
      ))
  let badge: Product["badge"]
  let badgeLabel: string | undefined
  if (status === "sold_out") {
    badge = "sold-out"
    badgeLabel = "Užimtas"
  } else if (status === "limited") {
    badge = "limited"
    badgeLabel = "Ribotas"
  }
  return {
    id: row.id as number,
    slug: row.slug as string,
    title: row.title as string,
    subtitle: row.subtitle as string,
    date: formatReleaseMonth(releaseDate),
    category: row.category as string,
    year: row.year as number,
    bricks: row.bricks as number,
    minifigs: row.minifigs as string,
    rating: row.rating as string | undefined,
    bg: row.bg as string,
    badge,
    badgeLabel,
    isNew,
    featured: row.featured as boolean,
    brickColors: (row.brick_colors as string[]) ?? [],
    brickHeights: (row.brick_heights as number[]) ?? [],
    requiredTier: row.tier as Tier,
    allowedTiers: (row.allowed_tiers as Tier[] | undefined) ?? [],
    minAge: row.min_age as number | null | undefined,
    price: row.price as number | null | undefined,
    value: row.value as number | null | undefined,
    image: row.image_url as string | undefined,
    gallery: (row.gallery as string[] | null) ?? [],
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
  image,
  children,
  className = "",
  containerRef,
}: {
  image?: string
  children: React.ReactNode
  className?: string
  containerRef?: React.Ref<HTMLDivElement>
}) {
  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-white ${className}`}
    >
      {image ? (
        <img
          src={image}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <ImagePlaceholder />
      )}
      {children}
    </div>
  )
}

function NewBadge() {
  return (
    <span className="absolute top-[62px] left-[14px] z-10 -rotate-6 rounded-md border-2 border-ink bg-brand-yellow px-2 py-1 font-display text-[12px] leading-none text-ink uppercase shadow-[3px_3px_0_#001B21]">
      Naujiena
    </span>
  )
}

export function ProductCard({
  product,
  preferredTiers,
}: {
  product: Product
  preferredTiers?: readonly string[]
}) {
  const ratings = useProductRatings()
  const badgeBg = product.badge === "sold-out" ? "#001B21" : "#FB4903"
  const displayTier = getDisplayPlan(
    product.allowedTiers,
    product.requiredTier,
    preferredTiers
  ) as Tier
  const tier = tierConfig[displayTier]

  const images = [
    ...new Set([product.image, ...product.gallery].filter(Boolean)),
  ].slice(0, MAX_HOVER_IMAGES) as string[]
  const imageRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  // Moving across the photo scrubs through the gallery; the rest load on first hover.
  function handleMouseEnter() {
    images.slice(1).forEach((src) => {
      new Image().src = src
    })
  }
  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = imageRef.current?.getBoundingClientRect()
    if (!rect || images.length < 2) return
    const isOverImage =
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom &&
      e.clientX >= rect.left &&
      e.clientX <= rect.right
    if (!isOverImage) return
    const fraction = (e.clientX - rect.left) / rect.width
    setActiveIndex(
      Math.min(images.length - 1, Math.floor(fraction * images.length))
    )
  }

  return (
    <div
      className="group brick-card brick-card-hover relative flex flex-col overflow-hidden bg-paper text-ink"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setActiveIndex(0)}
    >
      {/* Covers the card (above its z-10 badges) so all of it opens the set;
          the cart button comes later in the DOM at the same z-20, so it paints
          above this link as a separate control rather than inside it. */}
      <Link
        to={`/rinkinys/${product.slug}`}
        aria-label={product.title}
        className="absolute inset-0 z-20"
      />
      <StudBg
        containerRef={imageRef}
        image={images[activeIndex] ?? product.image}
        className="relative aspect-square border-b-2 border-ink"
      >
        <img
          src={getSubscriptionBrickSvg(displayTier)}
          alt=""
          className="pointer-events-none absolute top-[14px] left-[14px] z-10 h-10 w-auto select-none"
        />

        {product.isNew && <NewBadge />}

        <RatingBadge
          rating={ratings.get(product.id)}
          className="absolute bottom-[14px] left-[14px] z-10"
        />

        {product.badge && (
          <div
            className="absolute top-[18px] right-[18px] z-10 grid size-[78px] -rotate-12 place-items-center rounded-full border-2 border-ink p-2 text-center font-display text-[13px] leading-none shadow-[3px_3px_0_#001B21]"
            style={{ background: badgeBg, color: "#F5F1EB" }}
          >
            {product.badgeLabel?.split(" ").map((w, i) => (
              <span key={i} className="block">
                {w}
              </span>
            ))}
          </div>
        )}
        <ProductCardCartButton
          productId={product.id}
          title={product.title}
          allowedTiers={product.allowedTiers}
          isRentedOut={product.status === "sold_out"}
        />
        {images.length > 1 && (
          <div className="pointer-events-none absolute bottom-[14px] left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {images.map((src, i) => (
              <span
                key={src}
                className={`size-2 rounded-full border border-ink ${i === activeIndex ? "bg-ink" : "bg-paper"}`}
              />
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
          {product.category && (
            <Badge
              variant="outline"
              className="mb-2 rounded-full border-2 border-ink px-3 py-1 font-semibold text-ink"
            >
              {product.category}
            </Badge>
          )}
          <h3 className="heading-display text-d-xs leading-[.95] text-ink">
            {product.title}
          </h3>
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
            <p className="label-mono text-[9px] text-ink/40">Kaina</p>
            <p className="font-mono text-[12px] font-bold text-ink">
              {product.price != null ? `€${product.price}` : "—"}
            </p>
          </div>
          <div>
            <p className="label-mono text-[9px] text-ink/40">Prenumerata</p>
            <p className="font-mono text-[12px] font-bold text-ink">
              {tier.label}
            </p>
          </div>
          <div>
            <p className="label-mono text-[9px] text-ink/40">Briksių vertė</p>
            <p className="font-mono text-[12px] font-bold text-ink">
              {product.value != null ? product.value : "—"}
            </p>
          </div>
        </div>

        <div
          className="mt-auto flex items-center justify-between rounded-xl border-2 border-ink px-4 py-2.5 text-[13px] font-bold transition-all group-hover:shadow-[4px_4px_0_#001B21]"
          style={{ background: tier.bg, color: tier.textColor }}
        >
          <span>
            Prenumeruok su {SUBSCRIBE_WITH_LABEL[displayTier] ?? tier.label}
          </span>
          <ArrowRightIcon className="size-4" />
        </div>
      </div>
    </div>
  )
}
