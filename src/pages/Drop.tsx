import { useState, useEffect } from "react"
import { Link, useParams } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import Nav from "@/components/Nav"
import { useBreadcrumbLabel } from "@/contexts/BreadcrumbContext"
import Footer from "@/components/Footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { StarIcon } from "lucide-react"
import { getPlanDisplayName } from "@/lib/plan-branding"
import { ProductCard, dbToProduct, type Product } from "@/components/ProductCard"

type Review = { stars: number; quote: string; name: string; meta: string; avatarColor: string; initials: string }

function ReviewCard({ review: r }: { review: Review }) {
  return (
    <Card className="brick-card brick-card-hover flex w-[80vw] shrink-0 flex-col gap-3.5 bg-paper p-4 sm:w-[60vw] md:p-6 lg:w-auto">
      <CardContent className="flex h-full flex-col gap-3.5 p-0">
        <div className="flex gap-0.5" style={{ color: "#FB4903" }}>
          {Array.from({ length: r.stars }).map((_, j) => (
            <StarIcon key={j} className="size-4 fill-current" />
          ))}
        </div>
        <p className="font-display text-[20px] leading-[1.05] tracking-[.005em] uppercase">{r.quote}</p>
        <div className="mt-auto flex items-center gap-2.5 border-t border-dashed border-ink/18 pt-3">
          <Avatar className="size-9 border-2 border-ink">
            <AvatarFallback style={{ background: r.avatarColor }} className="text-[12px] font-bold text-ink">
              {r.initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <b className="text-[14px]">{r.name}</b>
            <small className="mt-0.5 block font-mono text-[10px] tracking-[.14em] text-ink/55 uppercase">{r.meta}</small>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const reviews = [
  {
    stars: 5,
    quote:
      '"The hinge crossover with the bus is genuinely clever. My street has a postal route now."',
    name: "Daniel K.",
    meta: "Mega · Subscriber since product 02",
    avatarColor: "#FB4903",
    initials: "DK",
  },
  {
    stars: 5,
    quote:
      "\"Otto's satchel actually flexes. I can't explain how delightful that is until you hold it.\"",
    name: "Priya N.",
    meta: "Standard · 11 months",
    avatarColor: "#5DDB9C",
    initials: "PN",
  },
  {
    stars: 5,
    quote:
      '"Finished it in one evening. The mint+cream colour pairing is the best of the year."',
    name: "Lucia F.",
    meta: "Standard · 6 months",
    avatarColor: "#FFAEE7",
    initials: "LF",
  },
  {
    stars: 4,
    quote:
      '"Build is great. Sticker sheet is generous. Wish there was a third minifig — that\'s my one nit."',
    name: "Theo W.",
    meta: "Mega · 22 months",
    avatarColor: "#4DA2FF",
    initials: "TW",
  },
]

// Drop 26 requires Standard tier or above

const tiers = [
  {
    key: "nano",
    name: getPlanDisplayName("nano"),
    price: 9,
    annualPrice: 7,
    spec: "60–90 bricks",
    bg: "#F5F1EB",
    textColor: "#001B21",
  },
  {
    key: "mini",
    name: getPlanDisplayName("mini"),
    price: 14,
    annualPrice: 11,
    spec: "120–180 bricks",
    bg: "#FFAEE7",
    textColor: "#001B21",
  },
  {
    key: "standard",
    name: getPlanDisplayName("standard"),
    price: 24,
    annualPrice: 19,
    spec: "240–320 bricks",
    bg: "#FFD731",
    textColor: "#001B21",
  },
  {
    key: "pro",
    name: getPlanDisplayName("pro"),
    price: 35,
    annualPrice: 28,
    spec: "340–400 bricks",
    bg: "#4DA2FF",
    textColor: "#001B21",
  },
  {
    key: "mega",
    name: getPlanDisplayName("mega"),
    price: 55,
    annualPrice: 44,
    spec: "420–520 bricks",
    bg: "#FB4903",
    textColor: "#F5F1EB",
  },
]

type FaqItem = { q: string; a: string }
type BagItem = { num: string; label: string; desc: string; bg: string }
type CompatItem = { drop: string; title: string; desc: string; bg: string }
type KitItem = { title: string; body: string }
type StorySection = {
  headline: string
  body: string[]
  image_url: string | null
  author_name: string
  author_role: string
}
type MinifigSection = {
  name: string
  description: string
  image_url: string | null
  edition: string
  kit_headline: string
  kit_items: KitItem[]
}

type DbProduct = {
  id: number
  title: string
  subtitle: string
  description: string | null
  category: string
  bricks: number
  minifigs: string
  build_time: string | null
  image_url: string | null
  gallery: string[]
  tier: string
  year: number | null
  value: number | null
  rating: string | null
  faq: FaqItem[] | null
  bags: BagItem[]
  story: StorySection | null
  minifig: MinifigSection | null
  compatibility: CompatItem[]
  release_date: string | null
}

const LT_MONTHS = [
  "Sausis",
  "Vasaris",
  "Kovas",
  "Balandis",
  "Gegužė",
  "Birželis",
  "Liepa",
  "Rugpjūtis",
  "Rugsėjis",
  "Spalis",
  "Lapkritis",
  "Gruodis",
]

function formatReleaseDate(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  return `${LT_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

const THUMB_BG = ["#5C4ADE", "#5DDB9C", "#FFAEE7", "#FFD731"]

// ── page ───────────────────────────────────────────────────────────────────
export default function Drop() {
  const { id } = useParams<{ id: string }>()
  const { setLabel } = useBreadcrumbLabel()
  const [product, setProduct] = useState<DbProduct | null>(null)
  const [activeThumb, setActiveThumb] = useState(0)
  const [related, setRelated] = useState<Product[]>([])

  useEffect(() => {
    if (!id) return
    supabase
      .from("products")
      .select(
        "id, title, subtitle, description, category, bricks, minifigs, build_time, image_url, gallery, tier, year, value, rating, faq, bags, story, minifig, compatibility, release_date"
      )
      .eq("id", Number(id))
      .single()
      .then(({ data }) => {
        if (data) {
          const p = data as unknown as DbProduct
          setProduct(p)
          setLabel(p.title)
        }
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (!id) return
    supabase
      .from("products")
      .select("*")
      .neq("id", Number(id))
      .limit(8)
      .then(({ data }) => {
        if (data) setRelated(data.map(dbToProduct))
      })
  }, [id])

  const dropRequiredTierIdx = tiers.findIndex(
    (t) => t.key === (product?.tier ?? "standard")
  )
  const DROP_REQUIRED_TIER =
    dropRequiredTierIdx === -1 ? 2 : dropRequiredTierIdx

  const galleryImages: string[] = product
    ? ([product.image_url, ...(product.gallery ?? [])].filter(
        Boolean
      ) as string[])
    : []

  const thumbs =
    galleryImages.length > 0
      ? galleryImages.map((image, i) => ({
          label: `[ View ${i + 1} ]`,
          bg: THUMB_BG[i % THUMB_BG.length],
          image,
        }))
      : [
          {
            label: "[ Front ]",
            bg: "#5C4ADE",
            image: "/images/build-castle.jpg",
          },
          {
            label: "[ Detail ]",
            bg: "#5DDB9C",
            image: "/images/build-cactus.jpg",
          },
          {
            label: "[ Build spread ]",
            bg: "#FFAEE7",
            image: "/images/build-sailboat.jpg",
          },
          {
            label: "[ Scale view ]",
            bg: "#FFD731",
            image: "/images/build-spaceship.jpg",
          },
        ]

  return (
    <>
      <Nav />

      {/* ── Product Hero ── */}
      <section className="bg-paper py-4">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
<div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2">
            {/* Gallery tile */}
            <div className="brick-card p-4">
              <div className="flex flex-col gap-4">
                {/* Main image */}
                <div
                  className="relative h-[520px] overflow-hidden rounded-[24px] border-2 border-ink"
                  style={{ background: thumbs[activeThumb].bg }}
                >
                  <img
                    key={activeThumb}
                    src={thumbs[activeThumb].image}
                    alt={thumbs[activeThumb].label}
                    className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
                    style={{ objectPosition: "center 20%" }}
                  />
                  {/* Overlay badges */}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent" />
                  {product?.release_date && (
                    <div
                      className="absolute top-6 left-6 rotate-[-3deg] rounded-[8px] border-2 border-ink bg-brand-yellow px-4 py-2.5 font-display text-2xl leading-none text-ink"
                      style={{ boxShadow: "4px 4px 0 #001B21" }}
                    >
                      {formatReleaseDate(product.release_date)}
                    </div>
                  )}
                  <div
                    className="absolute top-6 right-6 rounded-[8px] border-2 border-ink bg-brand-orange px-4 py-2.5 font-display text-2xl leading-none text-paper"
                    style={{
                      transform: "rotate(3deg)",
                      boxShadow: "4px 4px 0 #001B21",
                    }}
                  >
                    Product № {product?.id}
                  </div>
                  <div className="absolute bottom-5 left-6 font-mono text-[10px] tracking-[.18em] text-paper/70 uppercase">
                    {thumbs[activeThumb].label}
                  </div>
                </div>

                {/* Thumbnails */}
                <div className="flex gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-4 md:overflow-visible md:pb-0 scrollbar-none">
                  {thumbs.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveThumb(i)}
                      className={[
                        "relative h-[90px] w-[90px] shrink-0 md:w-auto overflow-hidden rounded-lg border-2 border-ink transition-all",
                        activeThumb === i
                          ? "outline outline-[3px] outline-offset-2 outline-brand-yellow"
                          : "hover:opacity-80",
                      ].join(" ")}
                      style={{ background: t.bg }}
                    >
                      <img
                        src={t.image}
                        alt={t.label}
                        className="absolute inset-0 h-full w-full object-cover"
                        style={{ objectPosition: "center 20%" }}
                      />
                      <div className="absolute inset-0 bg-ink/30" />
                      <span className="absolute right-0 bottom-1.5 left-0 text-center font-mono text-[8px] tracking-[.12em] text-paper/80 uppercase">
                        {t.label.replace(/\[|\]/g, "").trim()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Details tile */}
            <div
              className="brick-card bg-paper p-6 md:p-8"
              style={{ boxShadow: "6px 6px 0 rgba(0,0,0,.06)" }}
            >
              <div className="flex flex-wrap items-center gap-3">
                {product?.release_date && (
                  <Badge className="rounded-full border-2 border-ink bg-brand-mint px-3 py-1 font-semibold text-ink">
                    <span className="mr-1.5 inline-block size-2 rounded-full bg-ink" />
                    {formatReleaseDate(product.release_date)}
                  </Badge>
                )}
                {product?.category && (
                  <Badge
                    variant="outline"
                    className="rounded-full border-2 border-ink px-3 py-1 font-semibold text-ink"
                  >
                    {product.category}
                  </Badge>
                )}
              </div>

              <h1 className="heading-display text-d-lg mt-3.5 tracking-[-0.01em] text-ink">
                {product?.title ?? "Mailbox Row"}
                <br />+{" "}
                <span
                  className="inline-block text-brand-indigo italic skew-x-[-8deg]"
                >
                  {product?.subtitle ?? "Postman Otto"}
                </span>
              </h1>

              <p className="mt-6 max-w-[48ch] text-[18px] leading-[1.62] text-ink/80">
                {product?.description ??
                  "A five-storey postwar apartment block in mint and cream, complete with a working mailbox door, three planted balconies, and the universe's first scheduled crossover — Otto's bus is the bus from product №14."}
              </p>

              {/* Spec grid */}
              <div className="mt-8 grid grid-cols-3 gap-x-3 gap-y-4 border-t border-ink/10 pt-5">
                {[
                  { label: "Detalės",   val: String(product?.bricks ?? "—") },
                  { label: "Metai",     val: product?.year ? String(product.year) : "—" },
                  { label: "Amžius",    val: product?.rating ?? "—" },
                  { label: "Kaina",     val: product?.value != null ? `€${product.value}` : "—" },
                  { label: "Kategorija", val: product?.category ?? "—" },
                  { label: "Planas",    val: getPlanDisplayName(product?.tier ?? "standard") + "+" },
                ].map(({ label, val }) => (
                  <div key={label} className="flex flex-col gap-1">
                    <span className="label-mono text-[12px] text-ink/40">{label}</span>
                    <span className="font-mono text-[14px] font-bold text-ink capitalize">{val}</span>
                  </div>
                ))}
              </div>

              {/* Rent box */}
              <div
                id="buy"
                className="brick-card mt-8 p-6 md:p-7"
                style={{ background: "#FB4903" }}
              >
                {/* Required plan */}
                <div className="md:mt-4 flex items-center gap-3">
                  <div
                    className="rounded-full border-2 border-ink px-4 py-2 font-display text-[18px] leading-none"
                    style={{
                      background: tiers[DROP_REQUIRED_TIER].bg,
                      color: tiers[DROP_REQUIRED_TIER].textColor,
                    }}
                  >
                    {tiers[DROP_REQUIRED_TIER].name}+
                  </div>
                  <span className="text-[14px] text-ink/60">
                    reikalingas planas
                  </span>
                </div>

                <p className="mt-4 text-[14px] leading-[1.6] text-ink/70">
                  Šis produktas įskaičiuotas į tavo prenumeratą — jokio
                  papildomo mokesčio. Tiesiog nuomoki, sustatyk ir grąžink.
                </p>

                <Button
                  asChild
                  size="lg"
                  className="mt-6 w-full justify-center rounded-full border-2 border-ink bg-ink text-[16px] font-bold text-paper transition-all hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[6px_6px_0_rgba(0,27,33,.35)]"
                >
                  <Link to={`/checkout?product=${product?.id}`}>
                    Nuomoti nemokamai →
                  </Link>
                </Button>

                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px] tracking-[.16em] text-ink/60 uppercase">
                  {[
                    "Nemokamas pristatymas",
                    "Atšauk bet kada",
                    "30 d. garantija",
                  ].map((s) => (
                    <span key={s} className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-ink/40" />
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <p className="mt-4 text-center font-mono text-[11px] tracking-[.16em] text-ink/55 uppercase">
                Already a subscriber? Product №{product?.id} is included in your
                box.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── What's in the bag ── */}
      {product?.bags &&
        product.bags.length > 0 &&
        (() => {
          const bags = product.bags
          const featured = bags[bags.length - 1]
          const rest = bags.slice(0, bags.length - 1)
          return (
            <section className="bg-paper py-4">
              <div className="mx-auto max-w-[1320px] px-4 md:px-7">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                  <div className="brick-card flex flex-col justify-center bg-paper p-6 md:p-8 lg:col-span-5">
                    <h3 className="label-mono text-ink/50">
                      ⬢ What's in the bag
                    </h3>
                    <h2 className="heading-display text-d-lg mt-3 leading-[.9] tracking-[-0.01em] text-ink">
                      {bags.length} bag{bags.length !== 1 ? "s" : ""}.<br />
                      One build.
                    </h2>
                    <p className="mt-5 max-w-[40ch] text-[16px] leading-[1.65] text-ink/65">
                      Tear the seal, scan the QR, and you'll find these{" "}
                      {bags.length} bagged sub-builds — each one a
                      self-contained section of the model.
                    </p>
                  </div>
                  <div
                    className="brick-card brick-card-hover relative flex min-h-[280px] flex-col justify-end p-6 md:p-8 lg:col-span-7"
                    style={{ background: featured.bg }}
                  >
                    <Badge className="absolute top-6 right-6 rounded-full border-[1.5px] border-ink bg-paper px-2.5 py-1 font-mono text-[10px] tracking-[.14em] text-ink uppercase">
                      Bag {featured.num}
                    </Badge>
                    <div className="absolute top-6 left-8 font-display text-[110px] leading-none text-ink/15 select-none">
                      {featured.num}
                    </div>
                    <h4 className="font-display text-[36px] leading-[.95] text-ink uppercase">
                      {featured.label.split("\n").map((l, i) => (
                        <span key={i}>
                          {l}
                          <br />
                        </span>
                      ))}
                    </h4>
                    <p className="mt-2 max-w-[40ch] text-[14px] leading-[1.5] text-ink/75">
                      {featured.desc}
                    </p>
                  </div>
                  {rest.map((bag) => (
                    <div
                      key={bag.num}
                      className="brick-card brick-card-hover relative flex min-h-[260px] flex-col justify-end p-6 md:p-7 lg:col-span-4"
                      style={{ background: bag.bg }}
                    >
                      <Badge className="absolute top-5 right-5 rounded-full border-[1.5px] border-ink bg-paper px-2.5 py-1 font-mono text-[10px] tracking-[.14em] text-ink uppercase">
                        Bag {bag.num}
                      </Badge>
                      <div className="absolute top-5 left-7 font-display text-[88px] leading-none text-ink/15 select-none">
                        {bag.num}
                      </div>
                      <h4 className="font-display text-[28px] leading-[.95] text-ink uppercase">
                        {bag.label.split("\n").map((l, i) => (
                          <span key={i}>
                            {l}
                            <br />
                          </span>
                        ))}
                      </h4>
                      <p className="mt-2 text-[13px] leading-[1.5] text-ink/75">
                        {bag.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )
        })()}

      {/* ── Story ── */}
      {product?.story?.headline && (
        <section className="bg-paper py-4">
          <div className="mx-auto max-w-[1320px] px-4 md:px-7">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div
                className="brick-card relative min-h-[480px] overflow-hidden lg:col-span-5"
                style={
                  product.story.image_url
                    ? undefined
                    : {
                        background: "#FB4903",
                        backgroundImage:
                          "radial-gradient(circle at 18px 18px, rgba(255,255,255,.14) 5px, transparent 6px)",
                        backgroundSize: "48px 48px",
                      }
                }
              >
                {product.story.image_url ? (
                  <img
                    src={product.story.image_url}
                    alt="Story"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-10 grid place-items-center rounded-xl border-2 border-dashed border-paper/35 text-center font-mono text-[11px] tracking-[.18em] text-paper/55 uppercase">
                    No story image yet
                  </div>
                )}
              </div>
              <div className="brick-card flex flex-col justify-center bg-paper p-6 md:p-10 lg:col-span-7">
                <h3 className="label-mono text-ink/50">⬢ The story</h3>
                <h2 className="heading-display text-d-lg mt-3 leading-[.9] tracking-[-0.01em] text-ink">
                  {product.story.headline}
                </h2>
                {(product.story.body ?? []).map((para, i) => (
                  <p
                    key={i}
                    className="mt-4 text-[17px] leading-[1.6] text-ink/80"
                  >
                    {para}
                  </p>
                ))}
                {product.story.author_name && (
                  <div className="mt-8 flex items-center gap-4 border-t border-dashed border-ink/20 pt-6">
                    <Avatar className="size-[54px] border-2 border-ink">
                      <AvatarFallback className="bg-brand-mint font-bold text-ink">
                        {product.story.author_name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <b className="text-[15px]">{product.story.author_name}</b>
                      {product.story.author_role && (
                        <small className="mt-0.5 block font-mono text-[11px] tracking-[.14em] text-ink/55 uppercase">
                          {product.story.author_role}
                        </small>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Minifig ── */}
      {product?.minifig?.name && (
        <section className="bg-paper py-4">
          <div className="mx-auto max-w-[1320px] px-4 md:px-7">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="brick-card flex flex-col justify-center bg-paper p-6 md:p-8 lg:col-span-5">
                <h3 className="label-mono text-ink/50">⬢ Exclusive minifig</h3>
                <h2 className="heading-display text-d-xl mt-3 leading-[.9] tracking-[-0.01em] text-ink">
                  {product.minifig.name}
                </h2>
                {product.minifig.description && (
                  <p className="mt-5 max-w-[38ch] text-[16px] leading-[1.65] text-ink/75">
                    {product.minifig.description}
                  </p>
                )}
              </div>
              <div
                className="relative grid min-h-[480px] place-items-center overflow-hidden rounded-2xl border-2 bg-ink p-12 shadow-[6px_6px_0_#001B21] md:rounded-3xl lg:col-span-7"
                style={{
                  borderColor: "rgba(245,241,235,.2)",
                  backgroundImage:
                    "linear-gradient(transparent 31px, rgba(245,241,235,.08) 32px), linear-gradient(90deg, transparent 31px, rgba(245,241,235,.08) 32px)",
                  backgroundSize: "32px 32px",
                }}
              >
                {product.minifig.edition && (
                  <div className="absolute top-6 left-6 font-mono text-[11px] tracking-[.18em] text-paper/70 uppercase">
                    № {product.id} / 1<br />
                    <b className="text-brand-yellow">
                      {product.minifig.edition} PRESSED
                    </b>
                  </div>
                )}
                <div
                  className="absolute top-6 right-6 grid size-16 place-items-center rounded-full border-2 border-paper text-center font-mono text-[11px] text-ink"
                  style={{
                    background:
                      "linear-gradient(135deg,#FFAEE7,#FFD731,#5DDB9C,#4DA2FF)",
                    lineHeight: ".95",
                  }}
                >
                  EXCL.
                  <br />
                  MINIFIG
                </div>
                {product.minifig.image_url ? (
                  <img
                    src={product.minifig.image_url}
                    alt={product.minifig.name}
                    className="max-h-[240px] object-contain"
                  />
                ) : (
                  <div className="grid h-[240px] w-[160px] place-items-center rounded-xl border-2 border-dashed border-paper/35 text-center font-mono text-[10px] tracking-[.14em] text-paper/40 uppercase">
                    No minifig
                    <br />
                    image yet
                  </div>
                )}
                <div className="absolute bottom-6 left-6 font-display text-3xl leading-[.95] text-paper uppercase">
                  {product.minifig.name}
                </div>
              </div>
              {product.minifig.kit_items.length > 0 && (
                <div className="brick-card bg-paper p-6 md:p-8 lg:col-span-12">
                  <h3 className="label-mono text-ink/50">
                    ⬢ {product.minifig.name}'s kit
                  </h3>
                  {product.minifig.kit_headline && (
                    <h3 className="heading-display text-d-md mt-3 leading-[.9] tracking-[-0.01em] text-ink">
                      {product.minifig.kit_headline}
                    </h3>
                  )}
                  <ul className="mt-8 grid grid-cols-1 gap-[18px] md:grid-cols-3">
                    {product.minifig.kit_items.map((item) => (
                      <li key={item.title} className="flex items-start gap-3.5">
                        <span className="mt-0.5 grid size-8 flex-none place-items-center rounded-full bg-ink text-sm font-bold text-paper">
                          ✓
                        </span>
                        <div>
                          <b className="block text-[17px]">{item.title}</b>
                          {item.body && (
                            <span className="mt-1 block text-[14px] leading-[1.5] text-ink/70">
                              {item.body}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Compatibility ── */}
      {product?.compatibility && product.compatibility.length > 0 && (
        <section className="bg-paper py-4">
          <div className="mx-auto max-w-[1320px] px-4 md:px-7">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="brick-card flex flex-col justify-center bg-paper p-6 md:p-8 lg:col-span-5">
                <h3 className="label-mono text-ink/50">⬢ Universe map</h3>
                <h2 className="heading-display text-d-lg mt-3 leading-[.9] tracking-[-0.01em] text-ink">
                  Slots into {product.compatibility.length} existing product
                  {product.compatibility.length !== 1 ? "s" : ""}.
                </h2>
              </div>
              <div
                className="brick-card flex flex-col justify-center p-6 md:p-8 lg:col-span-7"
                style={{ background: "#FFD731" }}
              >
                <p className="max-w-[44ch] text-[20px] leading-[1.55] font-medium text-ink">
                  Every BRICKTIME product is part of one growing universe. This
                  one connects directly with these products via shared pins,
                  scale, and color set.
                </p>
              </div>
              {product.compatibility.map((c) => (
                <div
                  key={c.drop}
                  className="brick-card brick-card-hover flex flex-col gap-3.5 p-6 md:p-7 text-ink lg:col-span-4"
                  style={{ background: c.bg }}
                >
                  <h3 className="label-mono text-ink/50">{c.drop}</h3>
                  <h4 className="font-display text-[28px] leading-[.95] uppercase">
                    {c.title}
                  </h4>
                  <p className="text-[14px] leading-[1.5] text-ink/70">
                    {c.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Reviews ── */}
      <section className="bg-paper py-4">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Row 1: Rating tile */}
            <div className="lg:col-span-7 flex flex-col justify-center py-2">
              <h2 className="heading-display text-d-lg tracking-[-0.015em] text-ink">
                Ką sako<br />
                <span className="inline-block rotate-[-1.5deg] border-[3px] border-ink bg-brand-yellow px-[.12em] text-ink shadow-[5px_5px_0_rgba(0,27,33,.12)]" style={{ transformOrigin: "center center" }}>nuomotojai.</span>
              </h2>
            </div>

            {/* Row 2+: review cards — carousel on mobile, 2-col grid on desktop */}
            {/* bleed wrapper — escapes the grid cell horizontally on mobile */}
            <div className="lg:col-span-12">
              {/* Mobile: auto-scrolling marquee */}
              <div className="overflow-hidden lg:hidden">
                <div className="reviews-track flex gap-4 pb-2">
                  {[...reviews, ...reviews].map((r, i) => (
                    <ReviewCard key={i} review={r} />
                  ))}
                </div>
              </div>
              {/* Desktop: 2-col grid */}
              <div className="hidden lg:grid lg:grid-cols-2 lg:gap-4">
                {reviews.map((r, i) => (
                  <ReviewCard key={i} review={r} />
                ))}
              </div>
            </div>
          </div>

          {/* FAQ */}
          {(product?.faq ?? []).length > 0 && (
            <div className="mt-4">
              <div className="brick-card mb-4 bg-ink p-6 md:p-8">
                <h3 className="label-mono text-paper/50">⬢ Common questions</h3>
                <h2 className="heading-display text-d-md mt-3 leading-[.9] tracking-[-0.01em] text-paper">
                  FAQ
                </h2>
              </div>
              <div className="flex flex-col gap-3">
                {(product?.faq ?? []).map((item, i) => (
                  <div key={i} className="brick-card bg-paper p-6 md:p-7">
                    <h4 className="font-display text-[22px] leading-[1] text-ink uppercase">
                      {item.q}
                    </h4>
                    <p className="mt-3 text-[16px] leading-[1.65] text-ink/75">
                      {item.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* You might also like */}
          {related.length > 0 && (
            <div className="mt-10">
              <h2 className="heading-display text-d-md tracking-[-0.015em] text-ink mb-6">
                Gali<br />
                <span className="inline-block rotate-[-1.5deg] border-[3px] border-ink bg-brand-yellow px-[.12em] text-ink shadow-[5px_5px_0_rgba(0,27,33,.12)]" style={{ transformOrigin: "center center" }}>patikti.</span>
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                {related.map((p) => (
                  <div key={p.id} className="w-[300px] shrink-0">
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </section>

      <Footer />
    </>
  )
}
