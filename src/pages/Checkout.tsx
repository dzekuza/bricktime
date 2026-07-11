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
import { AuthForm } from "@/components/AuthForm"
import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { getSubscriptionDisplayName } from "@/lib/subscription-branding"
import { useSubscriptions } from "@/hooks/useSubscriptions"
import { TerminalPicker } from "@/components/TerminalPicker"
import {
  ProfileEditDialog,
  type ProfileValues,
} from "@/components/ProfileEditDialog"
import type { LpTerminal } from "@/lib/lpexpress"

const HOME_DELIVERY_PLANS = ["pro", "mega", "mystery_s", "mystery_m"]
const HOME_DELIVERY_FEE = 3

// ── tier config ──────────────────────────────────────────────────────────────
const tiers = [
  {
    key: "nano",
    name: getSubscriptionDisplayName("nano"),
    price: 9,
    bg: "#55DB9C",
    textColor: "#001B21",
    level: 1,
  },
  {
    key: "mini",
    name: getSubscriptionDisplayName("mini"),
    price: 14,
    bg: "#FB4903",
    textColor: "#F5F1EB",
    level: 2,
  },
  {
    key: "standard",
    name: getSubscriptionDisplayName("standard"),
    price: 24,
    bg: "#4DA2FF",
    textColor: "#001B21",
    level: 3,
  },
  {
    key: "pro",
    name: getSubscriptionDisplayName("pro"),
    price: 35,
    bg: "#FFAEE7",
    textColor: "#001B21",
    level: 4,
  },
  {
    key: "mega",
    name: getSubscriptionDisplayName("mega"),
    price: 55,
    bg: "#5C4ADE",
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
  const tierParam = params.get("plan") ?? params.get("tier") ?? "standard"
  const billingParam = params.get("billing") === "yearly" ? "annual" : "monthly"
  // gift card mode
  const isGiftCard = params.get("type") === "giftcard"
  const gcAmount = Number(params.get("amount") ?? 0)
  const gcRecipient = params.get("recipient") ?? ""
  const gcBuyer = params.get("buyer") ?? ""
  const gcMessage = params.get("message") ?? ""

  const [product, setProduct] = useState<DbProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [userSub, setUserSub] = useState<(typeof tiers)[0] | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [homeDelivery, setHomeDelivery] = useState(false)
  const [terminal, setTerminal] = useState<LpTerminal | null>(null)
  const [profileData, setProfileData] = useState<Partial<
    Record<keyof ProfileValues, string | null>
  > | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [giftCardInput, setGiftCardInput] = useState("")
  const [appliedGiftCard, setAppliedGiftCard] = useState<{
    code: string
    amountCents: number
  } | null>(null)
  const [giftCardError, setGiftCardError] = useState<string | null>(null)
  const [giftCardLoading, setGiftCardLoading] = useState(false)
  const [couponInput, setCouponInput] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    discount_type: "percentage" | "fixed"
    discount_value: number
  } | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [billing, setBilling] = useState<"monthly" | "annual">(billingParam)
  const [purchasing, setPurchasing] = useState(false)
  const [purchaseError, setPurchaseError] = useState("")
  const { subscriptions: plans } = useSubscriptions()

  useEffect(() => {
    if (!productId) {
      setLoading(false)
      return
    }
    supabase
      .from("products")
      .select(
        "id, title, subtitle, description, bricks, minifigs, build_time, image_url, gallery, tier, value, year, category, rating"
      )
      .eq("id", Number(productId))
      .single()
      .then(({ data }) => {
        setProduct(data as DbProduct | null)
        setLoading(false)
      })
  }, [productId])

  useEffect(() => {
    if (!user) {
      setUserSub(null)
      return
    }
    supabase
      .from("subscribers")
      .select(
        "plan, status, home_delivery, name, last_name, phone, street, house_no, flat, city, postal_code"
      )
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
        if (data) {
          setProfileData({
            name: data.name,
            last_name: data.last_name,
            phone: data.phone,
            street: data.street,
            house_no: data.house_no,
            flat: data.flat,
            city: data.city,
            postal_code: data.postal_code,
          })
        }
      })
  }, [user])

  const requiredTier = useMemo(
    () => tierByName[product?.tier ?? tierParam] ?? tiers[2],
    [product?.tier, tierParam]
  )
  const isEligible = useMemo(
    () =>
      !!productId && userSub !== null && userSub.level >= requiredTier.level,
    [productId, userSub, requiredTier]
  )

  // ── contact / delivery readiness ─────────────────────────────────────────
  const hasPhone = !!profileData?.phone?.trim()
  const hasAddress = !!(
    profileData?.street?.trim() &&
    profileData?.house_no?.trim() &&
    profileData?.city?.trim() &&
    profileData?.postal_code?.trim()
  )
  // Phone is always needed (LP terminal SMS / courier); an address is needed
  // only for to-door delivery; a terminal only for paštomatas.
  const canConfirm = hasPhone && (homeDelivery ? hasAddress : !!terminal)

  // ── gift card purchase handler ───────────────────────────────────────────
  const [gcLoading, setGcLoading] = useState(false)
  const [gcError, setGcError] = useState("")

  async function handleGiftCardPurchase() {
    setGcLoading(true)
    setGcError("")
    const origin = window.location.origin
    const { data, error } = await supabase.functions.invoke(
      "create-gift-card-checkout",
      {
        body: {
          amountCents: gcAmount,
          recipientEmail: gcRecipient,
          buyerEmail: gcBuyer,
          message: gcMessage || null,
          successUrl: `${origin}/gift-cards?payment=success&code={CODE}&session={SESSION_ID}&recipient=${encodeURIComponent(gcRecipient)}`,
          cancelUrl: `${origin}/gift-cards`,
        },
      }
    )
    setGcLoading(false)
    if (error || !data?.url) {
      setGcError("Klaida kuriant mokėjimą. Bandyk dar kartą.")
      return
    }
    window.location.assign(data.url)
  }

  async function applyGiftCard() {
    const code = giftCardInput.trim().toUpperCase()
    if (!code) return
    setGiftCardLoading(true)
    setGiftCardError(null)
    const { data, error } = await supabase.functions.invoke(
      "verify-gift-card",
      { body: { code } }
    )
    setGiftCardLoading(false)
    if (error || !data?.valid) {
      setGiftCardError(data?.error ?? "Kodas nerastas arba nebegalioja")
      return
    }
    setAppliedGiftCard({ code, amountCents: data.amountCents })
    setGiftCardInput("")
  }

  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase()
    if (!code) return
    setCouponLoading(true)
    setCouponError(null)
    const { data, error } = await supabase
      .from("coupons")
      .select(
        "code, discount_type, discount_value, max_uses, uses_count, expires_at, active"
      )
      .eq("code", code)
      .single()
    setCouponLoading(false)
    if (error || !data) {
      setCouponError("Kodas nerastas")
      return
    }
    if (!data.active) {
      setCouponError("Kodas neaktyvus")
      return
    }
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      setCouponError("Kodas nebegalioja")
      return
    }
    if (data.max_uses != null && data.uses_count >= data.max_uses) {
      setCouponError("Kodas jau panaudotas")
      return
    }
    setAppliedCoupon({
      code: data.code,
      discount_type: data.discount_type as "fixed" | "percentage",
      discount_value: Number(data.discount_value),
    })
    setCouponInput("")
  }

  const requiredPlan = useMemo(
    () => plans.find((p) => p.id === requiredTier.key) ?? null,
    [plans, requiredTier.key]
  )

  const basePrice =
    billing === "annual"
      ? (requiredPlan?.annual_price ??
        requiredPlan?.price ??
        requiredTier.price)
      : (requiredPlan?.price ?? requiredTier.price)

  const discountedPrice = useMemo(() => {
    if (!appliedCoupon) return basePrice
    if (appliedCoupon.discount_type === "percentage")
      return Math.max(0, basePrice * (1 - appliedCoupon.discount_value / 100))
    return Math.max(0, basePrice - appliedCoupon.discount_value)
  }, [appliedCoupon, basePrice])

  async function handleSubscribe() {
    if (!user) {
      setPurchaseError("Prisijunk prie paskyros prieš perkant.")
      return
    }
    setPurchasing(true)
    setPurchaseError("")
    const origin = window.location.origin
    const hasDiscount = appliedCoupon != null && discountedPrice < basePrice
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: {
        planKey: requiredTier.key,
        userId: user.id,
        userEmail: user.email ?? "",
        successUrl: productId
          ? `${origin}/checkout?product=${productId}&success=true&plan=${requiredTier.key}`
          : `${origin}/checkout?plan=${requiredTier.key}&success=true`,
        cancelUrl: productId
          ? `${origin}/checkout?product=${productId}`
          : `${origin}/subscribe`,
        ...(hasDiscount && { discountedAmount: discountedPrice }),
        ...(appliedGiftCard && { giftCardCode: appliedGiftCard.code }),
      },
    })
    setPurchasing(false)
    if (error || !data?.url) {
      setPurchaseError(error?.message ?? "Checkout nepavyko. Bandyk dar kartą.")
      return
    }
    window.location.assign(data.url)
  }

  // Handle Stripe success redirect back to checkout
  useEffect(() => {
    if (params.get("success") !== "true") return
    const planKey = params.get("plan")
    if (!planKey || !user) return
    supabase
      .from("subscribers")
      .upsert(
        {
          id: user.id,
          email: user.email ?? "",
          name: user.email?.split("@")[0] ?? "Subscriber",
          plan: planKey as
            | "nano"
            | "mini"
            | "standard"
            | "pro"
            | "mega"
            | "mystery_s"
            | "mystery_m",
          status: "active",
        },
        { onConflict: "id" }
      )
      .then(() => {
        // refresh subscription state so isEligible recalculates
        setUserSub(tierByName[planKey] ?? null)
      })
  }, [user, params]) // eslint-disable-line react-hooks/exhaustive-deps

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
      lp_terminal_id: homeDelivery ? null : (terminal?.id ?? null),
      lp_terminal_name: homeDelivery ? null : (terminal?.name ?? null),
    })
    setConfirming(false)
    if (!error) setConfirmed(true)
    else console.error("Order insert failed:", error.message)
  }

  // ── loading ──────────────────────────────────────────────────────────────
  // ── gift card checkout ───────────────────────────────────────────────────
  if (isGiftCard) {
    const gcDenomLabel = `€${(gcAmount / 100).toFixed(0)}`
    return (
      <div className="min-h-screen bg-paper">
        <Nav />
        <section className="pt-6 pb-16">
          <div className="mx-auto max-w-[1320px] px-4 md:px-7">
            <div className="mb-8 flex items-end justify-between gap-4">
              <h1 className="heading-display text-d-lg text-ink">Užsakymas</h1>
              <div className="label-mono hidden items-center gap-2 text-ink/30 md:flex">
                <span className="text-ink/50">Dovanų kortelės</span>
                <span>→</span>
                <span className="font-bold text-ink">Patvirtinimas</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.5fr]">
              {/* Left summary */}
              <div className="brick-card flex flex-col gap-5 bg-brand-yellow p-8">
                <div>
                  <p className="label-mono text-ink/50">Dovanų kortelė</p>
                  <h2 className="heading-display text-d-xl mt-1 text-ink">
                    {gcDenomLabel}
                  </h2>
                </div>
                <div className="flex flex-col gap-2 border-t-2 border-ink/15 pt-5">
                  <div>
                    <p className="label-mono text-[9px] text-ink/40">Gavėjas</p>
                    <p className="mt-0.5 font-mono text-[13px] font-bold text-ink">
                      {gcRecipient}
                    </p>
                  </div>
                  {gcMessage && (
                    <div>
                      <p className="label-mono text-[9px] text-ink/40">
                        Sveikinimas
                      </p>
                      <p className="mt-0.5 text-[13px] text-ink/70">
                        "{gcMessage}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
              {/* Right payment */}
              <div className="brick-card flex flex-col bg-paper p-6 md:p-8">
                <h2 className="heading-display text-d-md text-ink">
                  Užsakymo suvestinė
                </h2>
                <div className="mt-5 flex items-end gap-2 border-b-2 border-ink/10 pb-5">
                  <span className="heading-display text-d-lg text-ink">
                    {gcDenomLabel}
                  </span>
                  <span className="mb-1.5 font-mono text-[13px] text-ink/50">
                    vienkartinis mokėjimas
                  </span>
                </div>
                <div className="mt-5 flex flex-col gap-2 text-[13px] text-ink/60">
                  <div className="flex justify-between">
                    <span>Suma</span>
                    <span className="font-bold text-ink">{gcDenomLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gavėjas</span>
                    <span className="font-bold text-ink">{gcRecipient}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kvitas</span>
                    <span className="font-bold text-ink">{gcBuyer}</span>
                  </div>
                </div>
                {gcError && (
                  <p className="mt-3 font-mono text-[12px] text-red-500">
                    {gcError}
                  </p>
                )}
                <button
                  onClick={handleGiftCardPurchase}
                  disabled={gcLoading}
                  className="brick-hover-sm mt-8 flex w-full items-center justify-between rounded-[28px] border-2 border-ink bg-brand-orange px-6 py-4 text-paper transition-all disabled:opacity-60"
                >
                  <span className="font-display text-[22px] leading-none">
                    {gcLoading ? "Kraunama…" : `Mokėti ${gcDenomLabel} →`}
                  </span>
                  <span className="font-display text-[32px] leading-none">
                    →
                  </span>
                </button>
                <p className="mt-3 text-center font-mono text-[11px] text-ink/30">
                  Mokėjimas saugiai apdorojamas per Stripe · Kortelė galioja 1
                  metus
                </p>
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    )
  }

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
  if (!product && productId) {
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
  const coverImage = product?.image_url ?? product?.gallery?.[0] ?? null

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
                    alt={product?.title ?? ""}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="studs-light absolute inset-0 opacity-20" />
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
                  <p className="label-mono text-ink/40">
                    Užsakymas patvirtintas
                  </p>
                  <h2 className="heading-display text-d-sm mt-2 text-ink">
                    Viskas paruošta!
                  </h2>
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
                        alt={product?.title ?? ""}
                        className="size-16 shrink-0 rounded-xl border-2 border-ink object-cover"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="label-mono text-ink/40">Produktas</p>
                      <p className="mt-0.5 truncate font-display text-[18px] leading-tight text-ink">
                        {product?.title}
                      </p>
                      {product?.subtitle && (
                        <p className="truncate text-[12px] text-ink/50">
                          {product?.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="border-t-2 border-dashed border-ink/10" />

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-x-3 gap-y-2.5">
                    {[
                      ["Detalės", product?.bricks],
                      ["Metai", product?.year ?? "—"],
                      ["Amžius", product?.rating ?? "—"],
                      [
                        "Kaina",
                        product?.value != null ? `€${product?.value}` : "—",
                      ],
                      ["Kategorija", product?.category ?? "—"],
                      ["Prenumerata", requiredTier.name + "+"],
                    ].map(([label, val]) => (
                      <div key={label as string}>
                        <p className="label-mono text-[9px] text-ink/40">
                          {label}
                        </p>
                        <p className="font-mono text-[12px] font-bold text-ink capitalize">
                          {val}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t-2 border-dashed border-ink/10" />

                  {/* Delivery */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="label-mono text-ink/40">Pristatymas</p>
                      <p className="mt-0.5 font-display text-[15px] text-ink">
                        {homeDelivery ? "Kurjeris į duris" : "Paštomatas"}
                      </p>
                    </div>
                    <span
                      className={[
                        "rounded-full border-2 border-ink px-3 py-1.5 font-mono text-[11px] font-bold tracking-[.1em] uppercase",
                        homeDelivery
                          ? "bg-brand-yellow text-ink"
                          : "bg-brand-mint text-ink",
                      ].join(" ")}
                    >
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

      <section className="pt-6 pb-4">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
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
              {/* Product card — only when product exists */}
              {product ? (
                <div className="brick-card overflow-hidden bg-white">
                  <div className="relative h-[200px] border-b-2 border-ink bg-[#f8f6f2] md:h-[240px]">
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt={product?.title ?? ""}
                        className="h-full w-full object-contain p-6"
                      />
                    ) : (
                      <div
                        className="h-full"
                        style={{ background: requiredTier.bg }}
                      />
                    )}
                    <div
                      className="absolute top-4 right-4 rounded-full border-2 border-ink px-3 py-1.5 font-mono text-[11px] font-bold tracking-[.1em] uppercase"
                      style={{
                        background: requiredTier.bg,
                        color: requiredTier.textColor,
                      }}
                    >
                      {requiredTier.name}
                    </div>
                  </div>

                  <div className="p-5">
                    <p className="label-mono text-ink/40">Produktas</p>
                    <h2 className="heading-display text-d-xs mt-1 text-ink">
                      {product?.title}
                    </h2>
                    {product?.subtitle && (
                      <p className="mt-1 text-[13px] text-ink/50">
                        {product?.subtitle}
                      </p>
                    )}

                    <div className="mt-4 grid grid-cols-3 gap-x-3 gap-y-2.5 border-t-2 border-ink/10 pt-4">
                      {[
                        ["Detalės", product?.bricks],
                        ["Metai", product?.year ?? "—"],
                        ["Amžius", product?.rating ?? "—"],
                        [
                          "Kaina",
                          product?.value != null ? `€${product?.value}` : "—",
                        ],
                        ["Kategorija", product?.category ?? "—"],
                        ["Prenumerata", requiredTier.name + "+"],
                      ].map(([label, val]) => (
                        <div key={label as string}>
                          <p className="label-mono text-[9px] text-ink/40">
                            {label}
                          </p>
                          <p className="mt-0.5 font-mono text-[12px] font-bold text-ink capitalize">
                            {val}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Plan-only card */
                <div
                  className="brick-card overflow-hidden"
                  style={{ background: requiredTier.bg }}
                >
                  <div className="p-8 md:p-10">
                    <p
                      className="label-mono"
                      style={{ color: `${requiredTier.textColor}60` }}
                    >
                      Prenumerata
                    </p>
                    <h2
                      className="heading-display text-d-md mt-2"
                      style={{ color: requiredTier.textColor }}
                    >
                      {requiredTier.name}
                    </h2>
                    <p
                      className="mt-3 font-mono text-[13px]"
                      style={{ color: `${requiredTier.textColor}80` }}
                    >
                      Gauk pirmą rinkinį su pirma siunta ir naršyk visą
                      katalogą.
                    </p>
                  </div>
                </div>
              )}

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
                      Tavo prenumerata
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
                      "rounded-full border-2 border-ink px-3 py-1.5 font-mono text-[11px] font-bold tracking-[.1em] uppercase",
                      isEligible
                        ? "bg-brand-mint text-ink"
                        : "bg-white/60 text-ink/60",
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
                      <span className="heading-display text-d-lg text-ink">
                        €0
                      </span>
                      <div className="mb-1 rounded-full border-2 border-brand-mint bg-brand-mint px-3 py-1 font-mono text-[11px] font-bold text-ink">
                        Įskaičiuota į prenumeratą
                      </div>
                    </div>
                    <p className="mt-1 text-[13px] text-ink/50">
                      Šis produktas padengtas tavo{" "}
                      <span className="font-semibold text-ink">
                        {userSub?.name}
                      </span>{" "}
                      prenumerata
                    </p>
                  </div>

                  {/* Delivery selector — only for plans that support home delivery */}
                  {userSub && HOME_DELIVERY_PLANS.includes(userSub.key) && (
                    <div className="mt-6">
                      <p className="label-mono mb-3 text-ink/40">
                        Pristatymo būdas
                      </p>
                      <div className="flex flex-col gap-2">
                        {[
                          {
                            value: false,
                            label: "Paštomatas",
                            note: "Nemokamas",
                            accent: "bg-brand-mint",
                          },
                          {
                            value: true,
                            label: "Kurjeris į duris",
                            note: `+€${HOME_DELIVERY_FEE}`,
                            accent: "bg-brand-yellow",
                          },
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
                                  homeDelivery === value
                                    ? "border-ink bg-ink"
                                    : "border-ink/30",
                                ].join(" ")}
                              >
                                {homeDelivery === value && (
                                  <span className="size-2 rounded-full bg-paper" />
                                )}
                              </span>
                              <span className="font-mono text-[14px] font-bold text-ink">
                                {label}
                              </span>
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

                  {/* Terminal picker — shown when paštomatas delivery is active */}
                  {!homeDelivery && (
                    <div className="mt-6">
                      <p className="label-mono mb-1 text-ink/40">
                        Pasirink paštomatą
                      </p>
                      <TerminalPicker value={terminal} onChange={setTerminal} />
                    </div>
                  )}

                  {/* Contact + delivery address */}
                  <div className="mt-6">
                    <p className="label-mono mb-2 text-ink/40">
                      Kontaktai{homeDelivery ? " ir adresas" : ""}
                    </p>
                    <div
                      className={[
                        "flex items-start justify-between gap-3 rounded-2xl border-2 px-5 py-4",
                        hasPhone && (!homeDelivery || hasAddress)
                          ? "border-ink/15 bg-ink/[.02]"
                          : "border-brand-orange bg-brand-orange/5",
                      ].join(" ")}
                    >
                      <div className="min-w-0 space-y-1">
                        <p className="font-mono text-[13px] text-ink">
                          <span className="text-ink/40">Tel.:</span>{" "}
                          {hasPhone ? (
                            profileData?.phone
                          ) : (
                            <span className="font-bold text-brand-orange">
                              Įvesk telefono nr.
                            </span>
                          )}
                        </p>
                        {homeDelivery && (
                          <p className="font-mono text-[13px] text-ink">
                            <span className="text-ink/40">Adresas:</span>{" "}
                            {hasAddress ? (
                              `${profileData?.street} ${profileData?.house_no}${profileData?.flat ? `-${profileData.flat}` : ""}, ${profileData?.city} ${profileData?.postal_code}`
                            ) : (
                              <span className="font-bold text-brand-orange">
                                Užpildyk pristatymo adresą
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setProfileOpen(true)}
                        className="brick-hover-sm shrink-0 rounded-full border-2 border-ink bg-paper px-4 py-1.5 font-mono text-[11px] font-bold text-ink transition-all"
                      >
                        Redaguoti
                      </button>
                    </div>
                  </div>

                  {/* Order row summary */}
                  <div className="mt-6 flex items-center justify-between rounded-2xl border-2 border-ink/10 bg-ink/[.02] px-5 py-4">
                    <div>
                      <p className="label-mono text-[9px] text-ink/40">
                        Šio užsakymo suma
                      </p>
                      <p className="mt-0.5 font-display text-[26px] leading-none text-ink">
                        {homeDelivery &&
                        userSub &&
                        HOME_DELIVERY_PLANS.includes(userSub.key)
                          ? `€${HOME_DELIVERY_FEE}`
                          : "€0"}
                      </p>
                    </div>
                    <p className="label-mono max-w-[140px] text-right text-ink/40">
                      {homeDelivery
                        ? "Pristatymas į duris"
                        : "Produktas + paštomatas"}
                    </p>
                  </div>

                  {/* Missing-part notice */}
                  <div className="mt-6 rounded-2xl border-2 border-ink/15 bg-ink/[.02] px-5 py-4">
                    <p className="text-[13px] leading-[1.55] text-ink/60">
                      Jeigu konstruodamas pastebėsi, kad rinkinyje trūksta
                      detalės, prieš grąžindamas rinkinį būtinai pranešk apie
                      tai savo Brick Time paskyroje. Taip užtikrinsime, kad už
                      anksčiau trūkusias detales nebūsi laikomas atsakingu.
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="mt-auto pt-6">
                    <button
                      onClick={() => setShowModal(true)}
                      disabled={!canConfirm}
                      className="brick-hover-sm flex w-full items-center justify-between rounded-[28px] border-2 border-ink bg-brand-orange px-6 py-4 text-paper transition-all disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                    >
                      <span className="font-display text-[22px] leading-none">
                        Patvirtinti užsakymą
                      </span>
                      <span className="font-display text-[32px] leading-none">
                        →
                      </span>
                    </button>
                    {!canConfirm && (
                      <p className="mt-2 text-center font-mono text-[12px] text-ink/50">
                        {!hasPhone
                          ? "Įvesk telefono numerį, kad galėtum tęsti"
                          : homeDelivery
                            ? "Užpildyk pristatymo adresą, kad galėtum tęsti"
                            : "Pasirink paštomatą, kad galėtum tęsti"}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
                      {["Atšauk bet kada", "Nemokamas pristatymas"].map((s) => (
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
                  {/* Plan header */}
                  <div className="border-b-2 border-ink/10 pb-5">
                    <h2 className="heading-display text-d-md text-ink">
                      Užsakymo suvestinė
                    </h2>
                    {userSub && (
                      <p className="mt-1 text-[13px] text-ink/50">
                        Tavo dabartinė {userSub.name} prenumerata neapima šio
                        produkto.
                      </p>
                    )}
                  </div>

                  {/* Billing toggle */}
                  <div className="mt-5 flex items-center gap-2 self-start rounded-full border-2 border-ink/15 bg-ink/[.03] p-1">
                    {(["monthly", "annual"] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => setBilling(v)}
                        className={[
                          "rounded-full px-4 py-1.5 font-mono text-[12px] font-bold transition-all",
                          billing === v
                            ? "bg-ink text-paper"
                            : "text-ink/50 hover:text-ink",
                        ].join(" ")}
                      >
                        {v === "monthly" ? "Mėnesinis" : "Metinis −20%"}
                      </button>
                    ))}
                  </div>

                  {/* Price display */}
                  <div className="mt-4 flex items-end gap-3">
                    <span className="heading-display text-d-lg text-ink">
                      €
                      {discountedPrice < basePrice
                        ? discountedPrice.toFixed(2)
                        : basePrice}
                    </span>
                    <div className="mb-1 flex flex-col">
                      {discountedPrice < basePrice && (
                        <span className="font-mono text-[12px] text-ink/40 line-through">
                          €{basePrice}
                        </span>
                      )}
                      <span className="font-mono text-[13px] text-ink/50">
                        /
                        {billing === "monthly"
                          ? "mėn"
                          : "mėn · Mokama kas metus"}
                      </span>
                    </div>
                  </div>

                  {/* Coupon + Gift card */}
                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <p className="label-mono mb-2 text-ink/40">
                        Nuolaidos kodas
                      </p>
                      {appliedCoupon ? (
                        <div className="flex items-center justify-between rounded-2xl border-2 border-brand-yellow bg-brand-yellow/20 px-4 py-3">
                          <div>
                            <p className="label-mono text-[9px] text-ink/50">
                              Pritaikyta
                            </p>
                            <p className="font-mono text-[13px] font-bold text-ink">
                              {appliedCoupon.code} —{" "}
                              <span className="text-brand-orange">
                                {appliedCoupon.discount_type === "percentage"
                                  ? `${appliedCoupon.discount_value}% off`
                                  : `€${appliedCoupon.discount_value} off`}
                              </span>
                            </p>
                          </div>
                          <button
                            onClick={() => setAppliedCoupon(null)}
                            className="font-mono text-[16px] text-ink/30 hover:text-ink"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={couponInput}
                              onChange={(e) => {
                                setCouponInput(e.target.value.toUpperCase())
                                setCouponError(null)
                              }}
                              onKeyDown={(e) =>
                                e.key === "Enter" && applyCoupon()
                              }
                              placeholder="KODAS"
                              className="flex-1 rounded-2xl border-2 border-ink/20 bg-ink/[.02] px-4 py-3 font-mono text-[13px] tracking-widest uppercase transition-colors outline-none focus:border-ink"
                            />
                            <button
                              onClick={applyCoupon}
                              disabled={couponLoading || !couponInput.trim()}
                              className="rounded-2xl border-2 border-ink bg-ink px-4 py-3 font-mono text-[12px] font-bold text-paper disabled:opacity-40"
                            >
                              {couponLoading ? "…" : "Taikyti"}
                            </button>
                          </div>
                          {couponError && (
                            <p className="mt-1.5 font-mono text-[11px] text-red-500">
                              {couponError}
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    <div>
                      <p className="label-mono mb-2 text-ink/40">
                        Dovanų kortelė
                      </p>
                      {appliedGiftCard ? (
                        <div className="flex items-center justify-between rounded-2xl border-2 border-brand-mint bg-brand-mint/10 px-4 py-3">
                          <div>
                            <p className="label-mono text-[9px] text-ink/50">
                              Pritaikyta
                            </p>
                            <p className="font-mono text-[13px] font-bold text-ink">
                              {appliedGiftCard.code} —{" "}
                              <span className="text-brand-orange">
                                €
                                {(appliedGiftCard.amountCents / 100).toFixed(2)}
                              </span>
                            </p>
                          </div>
                          <button
                            onClick={() => setAppliedGiftCard(null)}
                            className="font-mono text-[16px] text-ink/30 hover:text-ink"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={giftCardInput}
                              onChange={(e) => {
                                setGiftCardInput(e.target.value.toUpperCase())
                                setGiftCardError(null)
                              }}
                              onKeyDown={(e) =>
                                e.key === "Enter" && applyGiftCard()
                              }
                              placeholder="XXXX-XXXX"
                              className="flex-1 rounded-2xl border-2 border-ink/20 bg-ink/[.02] px-4 py-3 font-mono text-[13px] tracking-widest uppercase transition-colors outline-none focus:border-ink"
                            />
                            <button
                              onClick={applyGiftCard}
                              disabled={
                                giftCardLoading || !giftCardInput.trim()
                              }
                              className="rounded-2xl border-2 border-ink bg-ink px-4 py-3 font-mono text-[12px] font-bold text-paper disabled:opacity-40"
                            >
                              {giftCardLoading ? "…" : "Taikyti"}
                            </button>
                          </div>
                          {giftCardError && (
                            <p className="mt-1.5 font-mono text-[11px] text-red-500">
                              {giftCardError}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Perks */}
                  <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1.5">
                    {[
                      "Šio produkto nuoma įskaičiuota",
                      "Nemokamas pristatymas",
                      "Atšauk bet kada",
                    ].map((item) => (
                      <span
                        key={item}
                        className="label-mono flex items-center gap-1.5 text-ink/40"
                      >
                        <span className="size-1.5 rounded-full bg-brand-mint" />
                        {item}
                      </span>
                    ))}
                  </div>

                  {/* Safety notice */}
                  <div className="mt-5 flex gap-3 rounded-2xl border-2 border-ink/15 bg-ink/[.02] px-4 py-3.5">
                    <img
                      src="/en71-badge.svg"
                      alt="EN 71 saugos ženklas"
                      className="mt-0.5 h-8 w-8 shrink-0"
                    />
                    <p className="text-[12px] leading-[1.6] text-ink/55">
                      Svarbu: LEGO® rinkinyje yra smulkių detalių, todėl jis
                      netinka vaikams iki 3 metų. Rekomenduojame rinkinį naudoti
                      pagal gamintojo nurodytą amžiaus rekomendaciją.
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="mt-auto pt-6">
                    {purchaseError && (
                      <p className="mb-3 font-mono text-[12px] text-red-500">
                        {purchaseError}
                      </p>
                    )}
                    <button
                      onClick={
                        !user ? () => setShowAuthModal(true) : handleSubscribe
                      }
                      disabled={purchasing}
                      className="brick-hover-sm flex w-full items-center justify-between rounded-[28px] border-2 border-ink bg-brand-orange px-6 py-4 text-paper transition-all disabled:opacity-60"
                    >
                      <span className="font-display text-[22px] leading-none">
                        {purchasing
                          ? "Kraunama…"
                          : !user
                            ? "Prisijungti"
                            : userSub
                              ? "Paaukštinti prenumeratą"
                              : "Prenumeruoti dabar"}
                      </span>
                      <span className="font-display text-[32px] leading-none">
                        →
                      </span>
                    </button>
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
                <span className="font-display text-[18px] leading-none">
                  Patvirtinti užsakymą
                </span>
                <span className="font-display text-[24px] leading-none">→</span>
              </button>
            ) : (
              <button
                onClick={!user ? () => setShowAuthModal(true) : handleSubscribe}
                disabled={purchasing}
                className="flex w-full items-center justify-between rounded-[22px] border-2 border-ink bg-brand-orange px-5 py-3.5 text-paper disabled:opacity-60"
              >
                <span className="font-display text-[18px] leading-none">
                  {purchasing
                    ? "Kraunama…"
                    : !user
                      ? "Prisijungti"
                      : userSub
                        ? "Paaukštinti prenumeratą"
                        : "Prenumeruoti dabar"}
                </span>
                <span className="font-display text-[24px] leading-none">→</span>
              </button>
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
                  alt={product?.title ?? ""}
                  className="size-14 shrink-0 rounded-xl border-2 border-ink object-contain"
                />
              )}
              <div className="min-w-0">
                <p className="label-mono text-[9px] text-ink/40">Produktas</p>
                <p className="mt-0.5 truncate font-display text-[17px] leading-tight text-ink">
                  {product?.title}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold text-brand-mint">
                    €0
                  </span>
                  <span className="label-mono text-ink/40">·</span>
                  <span className="label-mono text-ink/40">
                    {userSub?.name}
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-3 text-[11px] leading-[1.5] text-ink/45">
              Svarbu: LEGO® rinkinyje yra smulkių detalių, todėl jis netinka
              vaikams iki 3 metų. Rekomenduojame rinkinį naudoti pagal gamintojo
              nurodytą amžiaus rekomendaciją.
            </p>

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

      {/* Auth dialog */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="brick-card w-[calc(100vw-2rem)] max-w-[380px] gap-0 border-0 bg-paper p-6 shadow-none">
          <DialogTitle className="heading-display text-d-xs mb-1 text-ink">
            Prisijungti
          </DialogTitle>
          <DialogDescription className="mb-4 text-[13px] leading-[1.6] text-ink/50">
            Prisijunk arba sukurk paskyrą, kad galėtum tęsti.
          </DialogDescription>
          <AuthForm onClose={() => setShowAuthModal(false)} />
        </DialogContent>
      </Dialog>

      {user && (
        <ProfileEditDialog
          userId={user.id}
          email={user.email ?? ""}
          open={profileOpen}
          onOpenChange={setProfileOpen}
          initial={profileData ?? {}}
          onSaved={(vals) => setProfileData(vals)}
        />
      )}
    </div>
  )
}
