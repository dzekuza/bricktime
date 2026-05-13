import { useSearchParams, Link } from "react-router-dom"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { getPlanDisplayName } from "@/lib/plan-branding"

// ── tier config ──────────────────────────────────────────────────────────────
const tiers = [
  {
    key: "nano",
    name: getPlanDisplayName("nano"),
    price: 9,
    bg: "#F5F1EB",
    textColor: "#001B21",
    level: 1,
  },
  {
    key: "mini",
    name: getPlanDisplayName("mini"),
    price: 14,
    bg: "#FFAEE7",
    textColor: "#001B21",
    level: 2,
  },
  {
    key: "standard",
    name: getPlanDisplayName("standard"),
    price: 24,
    bg: "#FFD731",
    textColor: "#001B21",
    level: 3,
  },
  {
    key: "pro",
    name: getPlanDisplayName("pro"),
    price: 35,
    bg: "#4DA2FF",
    textColor: "#001B21",
    level: 4,
  },
  {
    key: "mega",
    name: getPlanDisplayName("mega"),
    price: 55,
    bg: "#FB4903",
    textColor: "#F5F1EB",
    level: 5,
  },
]
const tierByName: Record<string, (typeof tiers)[0]> = Object.fromEntries(
  tiers.map((t) => [t.key, t])
)

type DbProduct = {
  id: number
  title: string
  subtitle: string
  description: string | null
  bricks: number
  minifigs: string
  build_time: string | null
  image_url: string | null
  gallery: string[]
  tier: string
  value: number | null
}

export default function Checkout() {
  const [params] = useSearchParams()
  // support both ?product= and legacy ?drop=
  const productId = params.get("product") ?? params.get("drop") ?? ""
  const tierParam = params.get("tier") ?? "standard"
  const subParam = params.get("sub")

  const [product, setProduct] = useState<DbProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmed, setConfirmed] = useState(false)

  // Mock: user is subscribed to Advanced unless ?sub=none
  const [userSub] = useState(subParam === "none" ? null : tiers[2])

  useEffect(() => {
    if (!productId) {
      setLoading(false)
      return
    }
    supabase
      .from("products")
      .select(
        "id, title, subtitle, description, bricks, minifigs, build_time, image_url, gallery, tier, value"
      )
      .eq("id", Number(productId))
      .single()
      .then(({ data }) => {
        setProduct(data as DbProduct | null)
        setLoading(false)
      })
  }, [productId])

  const requiredTier = tierByName[product?.tier ?? tierParam] ?? tiers[2]
  const isEligible = userSub !== null && userSub.level >= requiredTier.level

  // ── loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-paper">
        <Nav />
        <div className="mx-auto max-w-[1320px] px-4 py-20 text-center md:px-7 md:py-32">
          <p className="label-mono text-ink/40">Kraunama…</p>
        </div>
        <Footer />
      </div>
    )
  }

  // ── not found ────────────────────────────────────────────────────────────
  if (!product) {
    return (
      <div className="min-h-screen bg-paper">
        <Nav />
        <div className="mx-auto max-w-[1320px] px-4 py-20 text-center md:px-7 md:py-32">
          <h1 className="heading-display text-d-sm text-ink">
            Produktas nerastas
          </h1>
          <Link to="/archive" className="mt-6 inline-block text-ink underline">
            ← Grįžti į produktus
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  // ── confirmed ────────────────────────────────────────────────────────────
  if (confirmed) {
    return (
      <div className="min-h-screen bg-paper">
        <Nav />
        <section className="py-10 md:py-20">
          <div className="mx-auto max-w-[1320px] px-4 md:px-7">
            <div
              className="brick-card flex min-h-[420px] flex-col items-center justify-center p-16 text-center"
              style={{ background: "#5DDB9C" }}
            >
              <div
                className="font-display text-[80px] leading-none"
                style={{ color: "#001B21" }}
              >
                ✓
              </div>
              <h2 className="heading-display text-d-lg mt-6 text-ink">
                Produktas № {product.id} pridėtas į tavo dėžutę!
              </h2>
              <p className="mt-5 max-w-[40ch] text-[17px] leading-[1.65] text-ink/70">
                <b>{product.title}</b> eilėje tavo {userSub?.name}{" "}
                prenumeratoje. Įtrauksime į kitą siuntą.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Button
                  asChild
                  className="brick-hover-sm rounded-full border-2 border-ink bg-ink text-[15px] font-bold text-paper"
                >
                  <Link to="/account">Žiūrėti mano produktus →</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-2 border-ink bg-transparent text-[15px] font-bold text-ink transition-all hover:bg-ink/5"
                >
                  <Link to="/archive">Naršyti daugiau produktų</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    )
  }

  // ── main ─────────────────────────────────────────────────────────────────
  const coverImage = product.image_url ?? product.gallery?.[0] ?? null

  return (
    <div className="min-h-screen bg-paper">
      <Nav />

      <section className="py-10 md:py-20">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
          {/* Breadcrumb */}
          <div className="label-mono mb-4 flex items-center gap-2.5 text-ink/50">
            <Link to="/" className="transition-colors hover:text-ink">
              BRICKTIME
            </Link>
            <span className="text-ink/30">/</span>
            <Link to="/archive" className="transition-colors hover:text-ink">
              Produktai
            </Link>
            <span className="text-ink/30">/</span>
            <Link
              to={`/drop/${product.id}`}
              className="transition-colors hover:text-ink"
            >
              Produktas № {product.id}
            </Link>
            <span className="text-ink/30">/</span>
            <span className="font-semibold text-ink/70">Užsakymas</span>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Left: image or decorative fallback */}
            <div className="brick-card overflow-hidden">
              <div
                className="relative flex min-h-[320px] flex-col items-center justify-end lg:h-full lg:min-h-[560px]"
                style={
                  coverImage
                    ? undefined
                    : {
                        background: requiredTier.bg,
                        backgroundImage:
                          "radial-gradient(circle at 16px 16px, rgba(255,255,255,.16) 4px, transparent 5px)",
                        backgroundSize: "40px 40px",
                      }
                }
              >
                {coverImage ? (
                  <img
                    src={coverImage}
                    alt={product.title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="z-10 flex items-end gap-2 pb-4">
                    {[60, 100, 70, 120, 50, 90].map((h, i) => (
                      <div
                        key={i}
                        className="relative rounded border-[2.5px] border-ink"
                        style={{
                          background: [
                            "#FB4903",
                            "#F5F1EB",
                            "#FFD731",
                            "#5DDB9C",
                            "#FFAEE7",
                            "#4DA2FF",
                          ][i],
                          width: 36,
                          height: h,
                          boxShadow: "inset 0 -6px 0 rgba(0,0,0,.18)",
                        }}
                      >
                        <span
                          className="absolute -top-2.5 left-1/2 size-4 -translate-x-1/2 rounded-full border-[2.5px] border-ink"
                          style={{
                            background: [
                              "#FB4903",
                              "#F5F1EB",
                              "#FFD731",
                              "#5DDB9C",
                              "#FFAEE7",
                              "#4DA2FF",
                            ][i],
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Required tier badge */}
                <div
                  className="absolute top-6 right-6 z-10 rounded-full border-2 border-ink px-4 py-2 font-mono text-[11px] font-bold tracking-[.12em] uppercase"
                  style={{
                    background: requiredTier.bg,
                    color: requiredTier.textColor,
                  }}
                >
                  {requiredTier.name}+ reikalingas
                </div>
              </div>
            </div>

            {/* Right: info */}
            <div className="brick-card overflow-hidden">
              <div className="flex h-full flex-col gap-5 bg-paper p-6 md:p-7">
                <div>
                  <h2 className="heading-display text-d-md leading-[.9] text-ink">
                    {product.title}
                    {product.subtitle && (
                      <>
                        <br />
                        {product.subtitle}
                      </>
                    )}
                  </h2>
                  {product.description && (
                    <p className="mt-4 max-w-[48ch] text-[15px] leading-[1.65] text-ink/70">
                      {product.description}
                    </p>
                  )}
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 divide-x-2 divide-ink border-y-2 border-ink">
                  {[
                    ["Kaladėlių", product.bricks],
                    ["Miniukai", product.minifigs],
                    ["Laikas", product.build_time ?? "—"],
                  ].map(([label, val]) => (
                    <div
                      key={label as string}
                      className="px-3 py-3 text-left first:pl-0 last:pr-0"
                    >
                      <div className="label-mono text-ink/40">{label}</div>
                      <div className="mt-1 font-display text-2xl leading-none text-ink">
                        {val}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Value badge if set */}
                {product.value != null && product.value > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="label-mono text-ink/40">Vertė</span>
                    <span className="font-display text-[20px] leading-none text-ink">
                      €{product.value}
                    </span>
                  </div>
                )}

                {/* Subscription status */}
                {userSub && (
                  <div
                    className="brick-card p-5 md:p-6"
                    style={{ background: userSub.bg }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3
                          className="label-mono"
                          style={{ color: `${userSub.textColor}60` }}
                        >
                          Tavo prenumerata
                        </h3>
                        <div
                          className="mt-2 font-display text-[40px] leading-[.9]"
                          style={{ color: userSub.textColor }}
                        >
                          {userSub.name}
                        </div>
                      </div>
                      <span
                        className={[
                          "rounded-full border-2 border-ink px-3 py-1.5 font-mono text-[11px] font-bold tracking-[.12em] uppercase",
                          isEligible
                            ? "bg-brand-mint text-ink"
                            : "bg-paper/60 text-ink/60",
                        ].join(" ")}
                      >
                        {isEligible ? "✓ Tinkamas" : "✗ Netinkamas"}
                      </span>
                    </div>
                    <p
                      className="mt-4 text-[14px] leading-[1.6]"
                      style={{ color: `${userSub.textColor}80` }}
                    >
                      {isEligible ? (
                        <>
                          Produktas № {product.id} — <b>{product.title}</b>{" "}
                          įskaičiuotas į tavo <b>{userSub.name}</b> planą. Jokio
                          papildomo mokesčio.
                        </>
                      ) : (
                        <>
                          Šiam produktui reikalingas <b>{requiredTier.name}+</b>{" "}
                          planas. Tavo dabartinis — <b>{userSub.name}</b>.
                        </>
                      )}
                    </p>
                  </div>
                )}

                {/* Desktop CTA */}
                <div className="mt-auto hidden flex-col items-center gap-2 lg:flex">
                  {isEligible ? (
                    <Button
                      size="lg"
                      className="brick-hover-sm w-full rounded-full border-2 border-ink bg-brand-orange text-[15px] font-bold text-paper"
                      onClick={() => setConfirmed(true)}
                    >
                      Patvirtinti →
                    </Button>
                  ) : (
                    <Button
                      asChild
                      size="lg"
                      className="brick-hover-sm w-full rounded-full border-2 border-ink bg-brand-orange text-[15px] font-bold text-paper"
                    >
                      <Link
                        to={`/subscribe?plan=${requiredTier.name.toLowerCase()}`}
                      >
                        {userSub ? "Paaukštinti →" : "Prenumeruoti →"}
                      </Link>
                    </Button>
                  )}
                  <div className="flex items-center gap-4">
                    {[
                      "Atšauk bet kada",
                      "Nemokamas pristatymas",
                      "30 dienų garantija",
                    ].map((s) => (
                      <span
                        key={s}
                        className="label-mono flex shrink-0 items-center gap-1.5 text-ink/40"
                      >
                        <span className="size-1.5 rounded-full bg-brand-mint" />
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Floating confirm bar — mobile */}
      <div className="pb-safe fixed right-0 bottom-0 left-0 z-50 p-4 lg:hidden">
        <div className="mx-auto max-w-[600px]">
          <div className="brick-card flex flex-col items-center gap-2 bg-paper px-5 py-4">
            {isEligible ? (
              <Button
                size="lg"
                className="brick-hover-sm w-full rounded-full border-2 border-ink bg-brand-orange text-[15px] font-bold text-paper"
                onClick={() => setConfirmed(true)}
              >
                Patvirtinti →
              </Button>
            ) : (
              <Button
                asChild
                size="lg"
                className="brick-hover-sm w-full rounded-full border-2 border-ink bg-brand-orange text-[15px] font-bold text-paper"
              >
                <Link to={`/subscribe?plan=${requiredTier.name.toLowerCase()}`}>
                  {userSub ? "Paaukštinti →" : "Prenumeruoti →"}
                </Link>
              </Button>
            )}
            <div className="flex items-center gap-4">
              {[
                "Atšauk bet kada",
                "Nemokamas pristatymas",
                "30 dienų garantija",
              ].map((s) => (
                <span
                  key={s}
                  className="label-mono flex shrink-0 items-center gap-1.5 text-ink/40"
                >
                  <span className="size-1.5 rounded-full bg-brand-mint" />
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
