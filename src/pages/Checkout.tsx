import { useSearchParams, Link } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { getPlanDisplayName } from "@/lib/plan-branding"

const HOME_DELIVERY_PLANS = ['pro', 'mega', 'mystery_s', 'mystery_m']
const HOME_DELIVERY_FEE = 3

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
  year: number | null
  category: string | null
  rating: string | null
}

export default function Checkout() {
  const [params] = useSearchParams()
  const { user } = useAuth()
  // support both ?product= and legacy ?drop=
  const productId = params.get("product") ?? params.get("drop") ?? ""
  const tierParam = params.get("tier") ?? "standard"

  const [product, setProduct] = useState<DbProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [userSub, setUserSub] = useState<(typeof tiers)[0] | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [homeDelivery, setHomeDelivery] = useState(false)
  const [giftCardInput, setGiftCardInput] = useState("")
  const [appliedGiftCard, setAppliedGiftCard] = useState<{ code: string; amountCents: number } | null>(null)
  const [giftCardError, setGiftCardError] = useState<string | null>(null)
  const [giftCardLoading, setGiftCardLoading] = useState(false)

  useEffect(() => {
    if (!productId) { setLoading(false); return }
    supabase
      .from("products")
      .select("id, title, subtitle, description, bricks, minifigs, build_time, image_url, gallery, tier, value, year, category, rating")
      .eq("id", Number(productId))
      .single()
      .then(({ data }) => { setProduct(data as DbProduct | null); setLoading(false) })
  }, [productId])

  useEffect(() => {
    if (!user) { setUserSub(null); return }
    supabase
      .from("subscribers")
      .select("plan, status, home_delivery")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.status === "active") {
          setUserSub(tierByName[data.plan] ?? null)
          if (HOME_DELIVERY_PLANS.includes(data.plan)) {
            setHomeDelivery(data.home_delivery ?? false)
          }
        } else {
          setUserSub(null)
        }
      })
  }, [user])

  const requiredTier = useMemo(
    () => tierByName[product?.tier ?? tierParam] ?? tiers[2],
    [product?.tier, tierParam]
  )
  const isEligible = useMemo(
    () => userSub !== null && userSub.level >= requiredTier.level,
    [userSub, requiredTier]
  )

  async function applyGiftCard() {
    const code = giftCardInput.trim().toUpperCase()
    if (!code) return
    setGiftCardLoading(true)
    setGiftCardError(null)
    const { data, error } = await supabase.functions.invoke('verify-gift-card', { body: { code } })
    setGiftCardLoading(false)
    if (error || !data?.valid) {
      setGiftCardError(data?.error ?? "Kodas nerastas arba nebegalioja")
      return
    }
    setAppliedGiftCard({ code, amountCents: data.amountCents })
    setGiftCardInput("")
  }

  async function handleConfirm() {
    if (!user || !product) return
    setConfirming(true)
    const today = new Date()
    const due = new Date(today)
    due.setDate(due.getDate() + 30)
    const fmt = (d: Date) => d.toISOString().slice(0, 10)
    const { error } = await supabase.from("orders").insert({
      subscriber_id: user.id,
      product_id: product.id,
      amount: userSub?.price ?? 0,
      start_date: fmt(today),
      due_date: fmt(due),
      status: "processing",
      home_delivery: homeDelivery,
    })
    setConfirming(false)
    if (!error) setConfirmed(true)
    else console.error("Order insert failed:", error.message)
  }

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
  const coverImage = product.image_url ?? product.gallery?.[0] ?? null

  if (confirmed) {
    return (
      <div className="min-h-screen bg-paper">
        <Nav />
        <section className="py-10 md:py-20">
          <div className="mx-auto max-w-[1320px] px-4 md:px-7">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

              {/* Left — product image */}
              <div
                className="brick-card relative overflow-hidden"
                style={{ minHeight: 420, background: requiredTier.bg }}
              >
                {coverImage ? (
                  <img
                    src={coverImage}
                    alt={product.title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 opacity-20 studs-light" />
                )}
                {/* Overlay badge */}
                <div className="absolute top-5 left-5 flex items-center gap-2 rounded-full border-2 border-ink bg-brand-mint px-4 py-2 font-mono text-[13px] font-bold text-ink shadow-[3px_3px_0_#001B21]">
                  <span>✓</span>
                  <span>Pridėta į dėžutę</span>
                </div>
              </div>

              {/* Right — order summary */}
              <div className="brick-card flex flex-col gap-6 bg-paper p-7">
                <div>
                  <p className="label-mono text-ink/40">Užsakymas patvirtintas</p>
                  <h2 className="heading-display text-d-sm mt-2 text-ink">Viskas paruošta!</h2>
                  <p className="mt-3 text-[15px] leading-[1.65] text-ink/60">
                    Produktas pridėtas į eilę. Išsiųsime su kita siunta.
                  </p>
                </div>

                <div className="flex flex-col gap-3 rounded-2xl border-2 border-ink/10 bg-ink/[.03] p-5">
                  {/* Product row */}
                  <div className="flex items-center gap-3">
                    {coverImage && (
                      <img
                        src={coverImage}
                        alt={product.title}
                        className="size-16 shrink-0 rounded-xl border-2 border-ink object-cover"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="label-mono text-ink/40">Produktas</p>
                      <p className="mt-0.5 truncate font-display text-[18px] leading-tight text-ink">
                        {product.title}
                      </p>
                      {product.subtitle && (
                        <p className="truncate text-[12px] text-ink/50">{product.subtitle}</p>
                      )}
                    </div>
                  </div>

                  <div className="border-t-2 border-dashed border-ink/10" />

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-x-3 gap-y-2.5">
                    {[
                      ["Detalės", product.bricks],
                      ["Metai", product.year ?? "—"],
                      ["Amžius", product.rating ?? "—"],
                      ["Kaina", product.value != null ? `€${product.value}` : "—"],
                      ["Kategorija", product.category ?? "—"],
                      ["Planas", requiredTier.name + "+"],
                    ].map(([label, val]) => (
                      <div key={label as string}>
                        <p className="label-mono text-[9px] text-ink/40">{label}</p>
                        <p className="font-mono text-[12px] font-bold text-ink capitalize">{val}</p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t-2 border-dashed border-ink/10" />

                  {/* Delivery */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="label-mono text-ink/40">Pristatymas</p>
                      <p className="mt-0.5 font-display text-[15px] text-ink">
                        {homeDelivery ? "Į duris" : "Paštomatas"}
                      </p>
                    </div>
                    <span className={[
                      "rounded-full border-2 border-ink px-3 py-1.5 font-mono text-[11px] font-bold tracking-[.1em] uppercase",
                      homeDelivery ? "bg-brand-yellow text-ink" : "bg-brand-mint text-ink",
                    ].join(" ")}>
                      {homeDelivery ? `+€${HOME_DELIVERY_FEE}` : "Nemokamas"}
                    </span>
                  </div>
                </div>

                <div className="mt-auto flex flex-col gap-2">
                  <Button
                    asChild
                    size="lg"
                    className="brick-hover-sm h-12 w-full rounded-full border-2 border-ink bg-ink text-[15px] font-bold text-paper"
                  >
                    <Link to="/account">Žiūrėti mano produktus →</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="h-12 w-full rounded-full border-2 border-ink bg-transparent text-[15px] font-bold text-ink transition-all hover:bg-ink/5"
                  >
                    <Link to="/archive">Naršyti daugiau produktų</Link>
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </section>
        <Footer />
      </div>
    )
  }

  // ── main ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-paper">
      <Nav />

      <section className="py-8 pb-32 md:py-14 md:pb-14">
        <div className="mx-auto max-w-[1100px] px-4 md:px-7">

          {/* Back + breadcrumb */}
          <Link
            to={`/drop/${product.id}`}
            className="label-mono mb-8 inline-flex items-center gap-2 text-ink/40 transition-colors hover:text-ink"
          >
            ← Atgal į produktą
          </Link>

          {/* Header */}
          <div className="mb-8 flex items-end justify-between gap-4">
            <h1 className="heading-display text-d-lg text-ink">Užsakymas</h1>
            <div className="label-mono hidden items-center gap-2 text-ink/30 md:flex">
              <span className="text-ink/50">Produktai</span>
              <span>→</span>
              <span className="font-bold text-ink">Patvirtinimas</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.5fr]">

            {/* ── LEFT: Order summary ─────────────────────────────────── */}
            <div className="flex flex-col gap-4">

              {/* Product card */}
              <div className="brick-card overflow-hidden bg-white">
                <div className="relative h-[200px] border-b-2 border-ink bg-[#f8f6f2] md:h-[240px]">
                  {coverImage ? (
                    <img
                      src={coverImage}
                      alt={product.title}
                      className="h-full w-full object-contain p-6"
                    />
                  ) : (
                    <div className="h-full" style={{ background: requiredTier.bg }} />
                  )}
                  <div
                    className="absolute right-4 top-4 rounded-full border-2 border-ink px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[.1em]"
                    style={{ background: requiredTier.bg, color: requiredTier.textColor }}
                  >
                    {requiredTier.name}+
                  </div>
                </div>

                <div className="p-5">
                  <p className="label-mono text-ink/40">Produktas</p>
                  <h2 className="heading-display text-d-xs mt-1 text-ink">{product.title}</h2>
                  {product.subtitle && (
                    <p className="mt-1 text-[13px] text-ink/50">{product.subtitle}</p>
                  )}

                  <div className="mt-4 grid grid-cols-3 gap-3 border-t-2 border-ink/10 pt-4">
                    {[
                      ["Detalės", product.bricks],
                      ["Metai", product.year ?? "—"],
                      ["Vertė", product.value != null ? `€${product.value}` : "—"],
                    ].map(([label, val]) => (
                      <div key={label as string}>
                        <p className="label-mono text-[9px] text-ink/40">{label}</p>
                        <p className="mt-0.5 font-mono text-[13px] font-bold text-ink">{val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Plan status badge */}
              {userSub && (
                <div
                  className="brick-card flex items-center justify-between p-5"
                  style={{ background: userSub.bg }}
                >
                  <div>
                    <p
                      className="label-mono"
                      style={{ color: `${userSub.textColor}60` }}
                    >
                      Tavo planas
                    </p>
                    <p
                      className="mt-1 font-display text-[28px] leading-none"
                      style={{ color: userSub.textColor }}
                    >
                      {userSub.name}
                    </p>
                  </div>
                  <span
                    className={[
                      "rounded-full border-2 border-ink px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[.1em]",
                      isEligible ? "bg-brand-mint text-ink" : "bg-white/60 text-ink/60",
                    ].join(" ")}
                  >
                    {isEligible ? "✓ Tinkamas" : "✗ Netinkamas"}
                  </span>
                </div>
              )}
            </div>

            {/* ── RIGHT: Action panel ─────────────────────────────────── */}
            <div className="brick-card flex flex-col bg-paper p-6 md:p-8">

              {isEligible ? (
                <>
                  {/* Price display */}
                  <div className="border-b-2 border-ink/10 pb-5">
                    <p className="label-mono text-ink/40">Mokėjimas</p>
                    <div className="mt-3 flex items-end gap-4">
                      <span className="heading-display text-d-lg text-ink">€0</span>
                      <div className="mb-1 rounded-full border-2 border-brand-mint bg-brand-mint px-3 py-1 font-mono text-[11px] font-bold text-ink">
                        Įskaičiuota į planą
                      </div>
                    </div>
                    <p className="mt-1 text-[13px] text-ink/50">
                      Šis produktas padengtas tavo{" "}
                      <span className="font-semibold text-ink">{userSub?.name}</span> planu
                    </p>
                  </div>

                  {/* Delivery selector — only for plans that support home delivery */}
                  {userSub && HOME_DELIVERY_PLANS.includes(userSub.key) && (
                    <div className="mt-6">
                      <p className="label-mono mb-3 text-ink/40">Pristatymo būdas</p>
                      <div className="flex flex-col gap-2">
                        {[
                          { value: false, label: "Paštomatas", note: "Nemokamas", accent: "bg-brand-mint" },
                          { value: true, label: "Į duris", note: `+€${HOME_DELIVERY_FEE}`, accent: "bg-brand-yellow" },
                        ].map(({ value, label, note, accent }) => (
                          <button
                            key={String(value)}
                            type="button"
                            onClick={() => setHomeDelivery(value)}
                            className={[
                              "flex items-center justify-between rounded-2xl border-2 px-5 py-4 text-left transition-all",
                              homeDelivery === value
                                ? "border-ink shadow-[3px_3px_0_#001B21]"
                                : "border-ink/20 hover:border-ink/50",
                            ].join(" ")}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={[
                                  "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                                  homeDelivery === value ? "border-ink bg-ink" : "border-ink/30",
                                ].join(" ")}
                              >
                                {homeDelivery === value && (
                                  <span className="size-2 rounded-full bg-paper" />
                                )}
                              </span>
                              <span className="font-mono text-[14px] font-bold text-ink">{label}</span>
                            </div>
                            <span
                              className={`rounded-full border-2 border-ink/20 px-3 py-1 font-mono text-[11px] font-bold text-ink ${accent}`}
                            >
                              {note}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Order row summary */}
                  <div className="mt-6 flex items-center justify-between rounded-2xl border-2 border-ink/10 bg-ink/[.02] px-5 py-4">
                    <div>
                      <p className="label-mono text-[9px] text-ink/40">Šio užsakymo suma</p>
                      <p className="mt-0.5 font-display text-[26px] leading-none text-ink">
                        {homeDelivery && userSub && HOME_DELIVERY_PLANS.includes(userSub.key)
                          ? `€${HOME_DELIVERY_FEE}`
                          : "€0"}
                      </p>
                    </div>
                    <p className="label-mono max-w-[140px] text-right text-ink/40">
                      {homeDelivery ? "Pristatymas į duris" : "Produktas + paštomatas"}
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="mt-auto pt-6">
                    <button
                      onClick={() => setShowModal(true)}
                      className="brick-hover-sm flex w-full items-center justify-between rounded-[28px] border-2 border-ink bg-brand-orange px-6 py-4 text-paper transition-all"
                    >
                      <span className="font-display text-[22px] leading-none">Patvirtinti užsakymą</span>
                      <span className="font-display text-[32px] leading-none">→</span>
                    </button>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
                      {["Atšauk bet kada", "30d. garantija", "Nemokamas pristatymas"].map((s) => (
                        <span
                          key={s}
                          className="label-mono flex items-center gap-1.5 text-ink/35"
                        >
                          <span className="size-1.5 rounded-full bg-brand-mint" />
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Not eligible — upgrade needed */}
                  <div className="border-b-2 border-ink/10 pb-5">
                    <p className="label-mono text-ink/40">Reikalingas planas</p>
                    <div className="mt-3 flex items-end gap-4">
                      <span className="heading-display text-d-lg text-ink">{requiredTier.name}+</span>
                      <div
                        className="mb-1 rounded-full border-2 border-ink px-3 py-1 font-mono text-[11px] font-bold"
                        style={{ background: requiredTier.bg, color: requiredTier.textColor }}
                      >
                        nuo €{requiredTier.price}/mėn
                      </div>
                    </div>
                    <p className="mt-1 text-[13px] text-ink/50">
                      {userSub
                        ? `Tavo dabartinis ${userSub.name} planas neapima šio produkto.`
                        : "Prenumeruok ir gaukite šį produktą su pirma siunta."}
                    </p>
                  </div>

                  {/* Gift card */}
                  <div className="mt-6">
                    <p className="label-mono mb-3 text-ink/40">Dovanų kortelė</p>
                    {appliedGiftCard ? (
                      <div className="flex items-center justify-between rounded-2xl border-2 border-brand-mint bg-brand-mint/10 px-5 py-4">
                        <div>
                          <p className="label-mono text-ink/50">Pritaikyta</p>
                          <p className="mt-0.5 font-mono text-[14px] font-bold text-ink">
                            {appliedGiftCard.code} —{" "}
                            <span className="text-brand-orange">
                              €{(appliedGiftCard.amountCents / 100).toFixed(2)}
                            </span>
                          </p>
                        </div>
                        <button
                          onClick={() => setAppliedGiftCard(null)}
                          className="font-mono text-[18px] text-ink/30 transition-colors hover:text-ink"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={giftCardInput}
                          onChange={(e) => {
                            setGiftCardInput(e.target.value.toUpperCase())
                            setGiftCardError(null)
                          }}
                          onKeyDown={(e) => e.key === "Enter" && applyGiftCard()}
                          placeholder="XXXX-XXXX-XXXX"
                          className="flex-1 rounded-2xl border-2 border-ink/20 bg-ink/[.02] px-5 py-3.5 font-mono text-[13px] uppercase tracking-widest outline-none transition-colors focus:border-ink"
                        />
                        <button
                          onClick={applyGiftCard}
                          disabled={giftCardLoading || !giftCardInput.trim()}
                          className="rounded-2xl border-2 border-ink bg-ink px-5 py-3.5 font-mono text-[12px] font-bold text-paper disabled:opacity-40"
                        >
                          {giftCardLoading ? "…" : "Taikyti"}
                        </button>
                      </div>
                    )}
                    {giftCardError && (
                      <p className="mt-2 font-mono text-[11px] text-red-500">{giftCardError}</p>
                    )}
                  </div>

                  {/* What you get */}
                  <div className="mt-6 rounded-2xl border-2 border-ink/10 bg-ink/[.02] p-5">
                    <p className="label-mono mb-3 text-ink/40">Su {requiredTier.name}+ planu gausi</p>
                    <div className="flex flex-col gap-2.5">
                      {[
                        `€${requiredTier.price === 35 ? "350" : requiredTier.price === 55 ? "600" : requiredTier.price * 10} mėnesinis biudžetas`,
                        "Šio produkto nuoma įskaičiuota",
                        "Nemokamas pristatymas",
                        "Grąžink bet kada",
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-2.5">
                          <span className="size-1.5 shrink-0 rounded-full bg-brand-mint" />
                          <span className="text-[13px] text-ink/70">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto pt-6">
                    <Link
                      to={`/subscribe?plan=${requiredTier.name.toLowerCase()}${appliedGiftCard ? `&code=${appliedGiftCard.code}` : ""}`}
                      className="brick-hover-sm flex w-full items-center justify-between rounded-[28px] border-2 border-ink bg-brand-orange px-6 py-4 text-paper transition-all"
                    >
                      <span className="font-display text-[22px] leading-none">
                        {userSub ? "Paaukštinti planą" : "Prenumeruoti"}
                      </span>
                      <span className="font-display text-[32px] leading-none">→</span>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Mobile sticky CTA */}
      <div className="pb-safe fixed right-0 bottom-0 left-0 z-50 p-3 lg:hidden">
        <div className="mx-auto max-w-[600px]">
          <div className="brick-card bg-paper px-4 py-3">
            {isEligible ? (
              <button
                onClick={() => setShowModal(true)}
                className="flex w-full items-center justify-between rounded-[22px] border-2 border-ink bg-brand-orange px-5 py-3.5 text-paper"
              >
                <span className="font-display text-[18px] leading-none">Patvirtinti užsakymą</span>
                <span className="font-display text-[24px] leading-none">→</span>
              </button>
            ) : (
              <Link
                to={`/subscribe?plan=${requiredTier.name.toLowerCase()}${appliedGiftCard ? `&code=${appliedGiftCard.code}` : ""}`}
                className="flex w-full items-center justify-between rounded-[22px] border-2 border-ink bg-brand-orange px-5 py-3.5 text-paper"
              >
                <span className="font-display text-[18px] leading-none">
                  {userSub ? "Paaukštinti planą" : "Prenumeruoti"}
                </span>
                <span className="font-display text-[24px] leading-none">→</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="brick-card w-[calc(100vw-2rem)] max-w-[380px] gap-0 border-0 bg-paper p-0 shadow-none">
          <div className="p-6">
            <DialogTitle className="heading-display text-d-xs text-ink">
              Patvirtinti užsakymą?
            </DialogTitle>
            <DialogDescription className="mt-2 text-[13px] leading-[1.6] text-ink/50">
              Produktas bus pridėtas į tavo dėžutę ir išsiųstas su kita siunta.
            </DialogDescription>

            <div className="mt-5 flex items-center gap-3 rounded-2xl border-2 border-ink/10 bg-ink/[.02] p-4">
              {coverImage && (
                <img
                  src={coverImage}
                  alt={product.title}
                  className="size-14 shrink-0 rounded-xl border-2 border-ink object-contain"
                />
              )}
              <div className="min-w-0">
                <p className="label-mono text-[9px] text-ink/40">Produktas</p>
                <p className="mt-0.5 truncate font-display text-[17px] leading-tight text-ink">
                  {product.title}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold text-brand-mint">€0</span>
                  <span className="label-mono text-ink/40">·</span>
                  <span className="label-mono text-ink/40">{userSub?.name}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <Button
                size="lg"
                className="brick-hover-sm w-full rounded-full border-2 border-ink bg-brand-orange text-[15px] font-bold text-paper"
                disabled={confirming}
                onClick={async () => {
                  await handleConfirm()
                  setShowModal(false)
                }}
              >
                {confirming ? "Apdorojama…" : "Taip, patvirtinti →"}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full rounded-full border-2 border-ink bg-transparent text-[15px] font-bold text-ink hover:bg-ink/5"
                onClick={() => setShowModal(false)}
                disabled={confirming}
              >
                Atšaukti
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
