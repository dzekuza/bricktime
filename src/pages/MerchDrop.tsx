import { useState, useEffect } from "react"
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom"
import Nav from "@/components/Nav"
import { useBreadcrumbLabel } from "@/contexts/BreadcrumbContext"
import Footer from "@/components/Footer"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import type { MerchItem } from "./Merch"
import { Seo } from "@/components/Seo"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExpandableHtml } from "@/components/ExpandableHtml"
import { ImagePlaceholder } from "@/components/ImagePlaceholder"

const TYPE_LABEL: Record<string, string> = {
  hoodie: "Džemperis",
  "t-shirt": "Marškinėliai",
}

export default function MerchDrop() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { setLabel } = useBreadcrumbLabel()
  const [item, setItem] = useState<MerchItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [buying, setBuying] = useState(false)
  const [activeImage, setActiveImage] = useState<string | null>(null)

  // image_url is the hero; image_urls are the extra shots behind it.
  const gallery = item
    ? [item.image_url, ...(item.image_urls ?? [])].filter(
        (url): url is string => Boolean(url)
      )
    : []

  const paymentSuccess = searchParams.get("payment") === "success"

  useEffect(() => {
    if (!slug) return
    supabase
      .from("merch_items")
      .select("*")
      .eq("slug", slug)
      .in("status", ["active", "coming-soon"])
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          navigate("/merch", { replace: true })
          return
        }
        setItem(data as MerchItem)
        setActiveImage(
          (data as MerchItem).image_url ??
            (data as MerchItem).image_urls?.[0] ??
            null
        )
        setLabel((data as MerchItem).name)
        setLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, navigate])

  if (loading) {
    return (
      <>
        <Nav />
        <div className="mx-auto max-w-[1320px] px-4 py-20 md:px-7">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div className="brick-card h-[480px] animate-pulse bg-ink/10" />
            <div className="flex flex-col gap-4">
              <div className="h-8 w-2/3 rounded bg-ink/10" />
              <div className="h-4 w-1/3 rounded bg-ink/10" />
              <div className="h-20 rounded bg-ink/10" />
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (!item) return null

  const isComingSoon =
    item.status === "coming-soon" ||
    Object.values(item.stock).every((qty) => qty <= 0)

  async function handleBuy() {
    if (!selectedSize || !item) return
    setBuying(true)
    const origin = window.location.origin
    const { data, error } = await supabase.functions.invoke(
      "create-merch-checkout",
      {
        body: {
          itemId: item.id,
          size: selectedSize,
          userEmail: user?.email ?? undefined,
          successUrl: `${origin}/merch/${item.slug}?payment=success`,
          cancelUrl: `${origin}/merch/${item.slug}`,
        },
      }
    )
    if (error || !data?.url) {
      setBuying(false)
      return
    }
    window.location.href = data.url
  }

  return (
    <>
      <Seo
        title={item.name}
        description={item.description || "Brick Time apranga LEGO® fanams."}
        path={`/merch/${item.slug}`}
      />
      <Nav />

      <section className="bg-paper py-1 md:py-4">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
          <div className="grid grid-cols-1 items-start gap-6 md:gap-12 lg:grid-cols-2">
            {/* Gallery */}
            <div>
              <div className="flex flex-col gap-4">
                <div className="relative aspect-square overflow-hidden rounded-[24px] border-2 border-ink bg-white md:aspect-auto md:h-[520px]">
                  {activeImage ? (
                    <img
                      src={activeImage}
                      alt={item.name}
                      className="absolute inset-0 h-full w-full object-contain p-6"
                    />
                  ) : (
                    <ImagePlaceholder />
                  )}
                </div>

                {gallery.length > 1 && (
                  <div className="grid grid-cols-4 gap-3">
                    {gallery.map((url) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setActiveImage(url)}
                        aria-label={`${item.name} nuotrauka`}
                        aria-current={url === activeImage}
                        className={[
                          "relative h-[90px] overflow-hidden rounded-lg border-2 border-ink bg-white transition-all",
                          url === activeImage
                            ? "outline outline-[3px] outline-offset-2 outline-brand-yellow"
                            : "hover:opacity-80",
                        ].join(" ")}
                      >
                        <img
                          src={url}
                          alt=""
                          className="absolute inset-0 h-full w-full object-contain p-2"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Details tile */}
            <div className="brick-card bg-paper p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  variant="outline"
                  className="rounded-full border-2 border-ink px-3 py-1 font-semibold text-ink"
                >
                  {TYPE_LABEL[item.type] ?? item.type}
                </Badge>
              </div>

              <h1 className="heading-display text-d-md mt-3 tracking-[-0.01em] text-ink md:mt-7">
                {item.name}
              </h1>

              {item.description && (
                <ExpandableHtml
                  className="mt-4 max-w-[48ch] text-[15px] leading-[1.5] text-ink/80 md:mt-6 md:text-[18px] md:leading-[1.62]"
                  html={item.description}
                />
              )}

              <p className="heading-display text-d-sm mt-4 text-ink md:mt-6">
                €{item.price}
              </p>

              {/* Buy */}
              <div id="buy" className="pt-6">
                {/* Size picker */}
                <div className="flex flex-col gap-3">
                  <span className="label-mono text-ink/50">
                    Dydis{selectedSize ? ` — ${selectedSize}` : ""}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {item.sizes.map((size) => {
                      const sizeOutOfStock = (item.stock[size] ?? 0) <= 0
                      const disabled = isComingSoon || sizeOutOfStock
                      return (
                        <button
                          key={size}
                          disabled={disabled}
                          onClick={() => setSelectedSize(size)}
                          title={sizeOutOfStock ? "Išparduota" : undefined}
                          className={[
                            "rounded-xl border-2 px-4 py-2 font-mono text-[13px] font-bold uppercase transition-all",
                            disabled
                              ? "cursor-not-allowed border-ink/15 text-ink/25 line-through"
                              : selectedSize === size
                                ? "border-ink bg-ink text-paper shadow-[3px_3px_0_#001B21]"
                                : "border-ink/30 text-ink hover:border-ink",
                          ].join(" ")}
                        >
                          {size}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Success banner */}
                {paymentSuccess && (
                  <div className="brick-card mt-5 flex flex-col gap-2 bg-brand-mint p-5">
                    <p className="font-display text-[22px] font-bold text-ink uppercase">
                      ✓ Užsakymas gautas!
                    </p>
                    <p className="text-[14px] leading-relaxed text-ink/70">
                      Ačiū! Patvirtinimą gausite el. paštu. Produktas bus
                      išsiųstas per 3–5 d. d.
                    </p>
                  </div>
                )}

                {/* CTA */}
                {!paymentSuccess &&
                  (isComingSoon ? (
                    <div className="mt-5 flex flex-col gap-3 rounded-2xl border-2 border-ink/15 bg-ink/[.02] px-4 py-3.5">
                      <p className="label-mono text-ink/40">
                        Dar ne parduotuvėje
                      </p>
                      <p className="text-[14px] leading-[1.6] text-ink/55">
                        Šis produktas kol kas ruošiamas. Seki BRICKTIME
                        naujienoms ir sužinok pirmasis, kai merch atsiras
                        parduotuvėje.
                      </p>
                    </div>
                  ) : (
                    <Button
                      size="lg"
                      disabled={!selectedSize || buying}
                      onClick={handleBuy}
                      className="mt-5 w-full justify-center rounded-full border-2 border-ink bg-ink text-[16px] font-bold text-paper transition-all hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[6px_6px_0_rgba(0,27,33,.35)] disabled:opacity-40"
                    >
                      {buying
                        ? "Kraunama…"
                        : selectedSize
                          ? `Pirkti — ${selectedSize} →`
                          : "Pasirink dydį"}
                    </Button>
                  ))}

                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px] tracking-[.16em] text-ink/40 uppercase">
                  {["Saugus mokėjimas", "Pristatymas per 3–5 d. d."].map(
                    (t) => (
                      <span key={t} className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-ink/30" />
                        {t}
                      </span>
                    )
                  )}
                </div>

                <Link
                  to="/merch"
                  className="label-mono mt-5 inline-flex items-center gap-1.5 text-ink/40 transition-colors hover:text-ink"
                >
                  ← Visi merch produktai
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
