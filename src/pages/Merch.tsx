import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { supabase } from "@/lib/supabase"

export interface MerchItem {
  id: string
  name: string
  slug: string
  type: "hoodie" | "t-shirt"
  description: string
  price: number
  sizes: string[]
  stock: number
  bg: string
  image_url: string | null
  status: "draft" | "coming-soon" | "active"
  sort_order: number
}

const TYPE_LABEL: Record<string, string> = {
  hoodie: "Džemperis",
  "t-shirt": "Marškinėliai",
}

function ClothingIcon({ type }: { type: string }) {
  if (type === "hoodie") {
    return (
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        className="text-current"
      >
        <path
          d="M28 12 L12 28 L20 32 L20 68 L60 68 L60 32 L68 28 L52 12 C52 12 48 20 40 20 C32 20 28 12 28 12Z"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M28 12 C28 12 32 20 40 20 C48 20 52 12 52 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    )
  }
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      className="text-current"
    >
      <path
        d="M28 10 L10 28 L20 33 L20 70 L60 70 L60 33 L70 28 L52 10 Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M28 10 C28 10 33 22 52 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

function MerchCard({ item }: { item: MerchItem }) {
  const isComingSoon = item.status === "coming-soon" || item.stock === 0

  const isDark = item.bg === "#001B21" || item.bg.toLowerCase() === "#001b21"
  const contentColor = isDark ? "text-paper/40" : "text-ink/40"
  const labelColor = isDark ? "text-paper/70" : "text-ink/70"
  const chipBorder = isDark ? "border-paper/30" : "border-ink/30"

  return (
    <Link
      to={`/merch/${item.slug}`}
      className="brick-card brick-card-hover group flex flex-col overflow-hidden bg-paper"
    >
      {/* Visual */}
      <div
        className="relative flex min-h-[300px] items-center justify-center p-6 md:p-10"
        style={{ background: item.bg }}
      >
        <span
          className={`label-mono absolute top-4 left-4 rounded-full border-2 ${chipBorder} px-3 py-1 ${labelColor}`}
        >
          {TYPE_LABEL[item.type]}
        </span>

        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="h-full w-full object-contain"
          />
        ) : (
          <div
            className={`flex flex-col items-center gap-3 opacity-30 ${contentColor}`}
          >
            <ClothingIcon type={item.type} />
            <span className="font-mono text-[11px] tracking-[.22em] uppercase">
              Iliustracija netrukus
            </span>
          </div>
        )}

        {isComingSoon && (
          <span
            className={`label-mono absolute top-4 right-4 rounded-full border-2 ${chipBorder} bg-black/10 px-3 py-1 ${labelColor} backdrop-blur-sm`}
          >
            Greitai
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-3 p-5 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="heading-display text-d-xs text-ink">{item.name}</h3>
          <span className="shrink-0 font-mono text-[18px] font-bold text-ink">
            €{item.price}
          </span>
        </div>

        <p className="text-[14px] leading-relaxed text-ink/60">
          {item.description}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {item.sizes.map((size) => (
            <span
              key={size}
              className="rounded-lg border-2 border-ink/20 px-2.5 py-0.5 font-mono text-[11px] font-bold text-ink/50 uppercase"
            >
              {size}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-3">
          {isComingSoon ? (
            <div className="flex items-center justify-center rounded-xl border-2 border-ink/20 bg-ink/5 py-3 font-mono text-[12px] font-bold tracking-[.1em] text-ink/40 uppercase">
              Netrukus parduotuvėje
            </div>
          ) : (
            <div className="w-full rounded-xl border-2 border-ink bg-ink py-3 text-center font-mono text-[12px] font-bold tracking-[.1em] text-paper uppercase transition-all group-hover:-translate-x-[2px] group-hover:-translate-y-[2px] group-hover:shadow-[4px_4px_0_#001B21]">
              Pirkti →
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

function MerchCardSkeleton() {
  return (
    <div className="brick-card animate-pulse overflow-hidden">
      <div className="h-[300px] bg-ink/10" />
      <div className="flex flex-col gap-3 p-5">
        <div className="h-5 w-2/3 rounded bg-ink/10" />
        <div className="h-3 w-full rounded bg-ink/10" />
        <div className="h-3 w-1/2 rounded bg-ink/10" />
        <div className="mt-2 h-9 rounded-xl bg-ink/10" />
      </div>
    </div>
  )
}

export default function MerchPage() {
  const [items, setItems] = useState<MerchItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from("merch_items")
      .select("*")
      .in("status", ["active", "coming-soon"])
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data) setItems(data as MerchItem[])
        setLoading(false)
      })
  }, [])

  const activeItems = items.filter((i) => i.status === "active")
  const comingItems = items.filter((i) => i.status === "coming-soon")

  return (
    <>
      <Nav />

      {/* Hero */}
      <section className="bg-paper">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
            <div>
              <h1 className="heading-display text-d-xl tracking-[-0.015em] text-ink">
                BRICKTIME{" "}
                <span className="inline-block -rotate-[1.5deg] border-[3px] border-ink bg-brand-yellow px-2 shadow-[5px_5px_0_rgba(0,27,33,0.12)]">
                  merch.
                </span>
              </h1>
              <p className="mt-6 max-w-[48ch] text-[17px] leading-[1.65] text-ink/65">
                Kokybiški drabužiai ir aksesuarai žmonėms, kuriuos vienija
                kūryba, konstravimas ir Brick Time bendruomenė.
              </p>
            </div>
            <div className="hidden lg:block">
              <img
                src="/images/build-sailboat.jpg"
                alt="LEGO statyba"
                className="aspect-[2/1] w-full rounded-2xl border-2 border-ink object-cover shadow-[6px_6px_0_#001B21]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="bg-paper pt-4 pb-20">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
          {loading ? (
            <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2].map((i) => (
                <MerchCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              {activeItems.length > 0 && (
                <>
                  <div className="mb-6">
                    <span className="label-mono text-ink/50">
                      Parduodama dabar
                    </span>
                  </div>
                  <div className="mb-10 grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
                    {activeItems.map((item) => (
                      <MerchCard key={item.id} item={item} />
                    ))}
                  </div>
                </>
              )}

              {comingItems.length > 0 && (
                <>
                  <div className="mt-4 mb-6">
                    <span className="label-mono text-ink/50">Netrukus</span>
                  </div>
                  <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
                    {comingItems.map((item) => (
                      <MerchCard key={item.id} item={item} />
                    ))}
                  </div>
                </>
              )}

              {items.length === 0 && (
                <div className="brick-card flex min-h-[300px] flex-col items-center justify-center gap-4 bg-ink/5 text-center">
                  <span className="text-4xl">🧱</span>
                  <p className="heading-display text-d-xs text-ink/40">
                    Netrukus čia bus merch
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </>
  )
}
