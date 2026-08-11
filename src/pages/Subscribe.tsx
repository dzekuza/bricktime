import { useState, useEffect, useMemo } from "react"
import { useSearchParams, Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import type { PlanTier } from "@/lib/database.types"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import FAQ from "@/components/FAQ"
import Subscriptions from "@/components/Subscriptions"
import type { DbSubscription } from "@/hooks/useSubscriptions"
import { ArrowRightIcon, ShieldCheckIcon, CalendarXIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useReveal } from "@/hooks/useReveal"
import { useSubscriptions } from "@/hooks/useSubscriptions"
import { HERO_VIDEO_URL } from "@/lib/media"
import { Seo } from "@/components/Seo"
import { TermsAgreement } from "@/components/TermsAgreement"

// ── static data ────────────────────────────────────────────────────────────

const HOME_DELIVERY_PLANS = ["mega"]
const HOME_DELIVERY_FEE = 3

// ── page ───────────────────────────────────────────────────────────────────

export default function Subscribe() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { subscriptions: plans } = useSubscriptions()

  const planIndex = useMemo(
    () => Object.fromEntries(plans.map((p, i) => [p.id, i])),
    [plans]
  )

  // Resolve initial plan from URL param; default to index 1 (second plan) if "standard" not found
  const initialPlan =
    planIndex[params.get("plan") ?? "standard"] ?? planIndex["standard"] ?? 1

  const [selectedPlan, setSelectedPlan] = useState(initialPlan)
  const [billing] = useState<"monthly" | "annual">("monthly")
  const [step, setStep] = useState<"plan" | "payment">("plan")
  const [form, setForm] = useState({ email: "", name: "" })
  const [submitted, setSubmitted] = useState(false)

  const plan = plans[selectedPlan] ?? plans[0]

  // Sync selectedPlan when plans load (URL param resolution)
  useEffect(() => {
    if (plans.length === 0) return
    const paramPlan = params.get("plan")
    if (paramPlan && planIndex[paramPlan] !== undefined) {
      setSelectedPlan(planIndex[paramPlan])
    }
  }, [plans]) // eslint-disable-line react-hooks/exhaustive-deps

  // pre-fill form from auth profile
  useEffect(() => {
    setForm((f) => ({
      ...f,
      email: user?.email ?? f.email,
      name: profile?.name || user?.email?.split("@")[0] || f.name,
    }))
  }, [user, profile])

  const [heroVideoUrl, setHeroVideoUrl] = useState(HERO_VIDEO_URL)

  useEffect(() => {
    supabase
      .from("home_content")
      .select("hero_video_url")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (data?.hero_video_url) setHeroVideoUrl(data.hero_video_url)
      })
  }, [])

  const [homeDelivery, setHomeDelivery] = useState(false)

  // reset home delivery toggle when switching to an ineligible plan
  useEffect(() => {
    if (!HOME_DELIVERY_PLANS.includes(plan?.id ?? "")) setHomeDelivery(false)
  }, [plan?.id])

  const [purchasing, setPurchasing] = useState(false)
  const [purchaseError, setPurchaseError] = useState("")
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [couponInput, setCouponInput] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    discount_type: "percentage" | "fixed"
    discount_value: number
    duration_months: number | null
    giftCardCode?: string
  } | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)

  // Auto-apply gift card or coupon passed from checkout via ?code= / ?coupon=
  useEffect(() => {
    if (appliedCoupon) return
    const giftCode = params.get("code")
    if (giftCode) {
      supabase.functions
        .invoke("verify-gift-card", { body: { code: giftCode.toUpperCase() } })
        .then(({ data }) => {
          if (data?.valid) {
            setAppliedCoupon({
              code: giftCode.toUpperCase(),
              discount_type: "fixed",
              discount_value: data.amountCents / 100,
              duration_months: null,
              giftCardCode: giftCode.toUpperCase(),
            })
          }
        })
      return
    }
    const couponCode = params.get("coupon")
    if (couponCode) {
      supabase
        .from("coupons")
        .select(
          "code, discount_type, discount_value, duration_months, max_uses, uses_count, expires_at, active"
        )
        .eq("code", couponCode.toUpperCase())
        .single()
        .then(({ data }) => {
          if (data?.active) {
            setAppliedCoupon({
              code: data.code,
              discount_type: data.discount_type as "percentage" | "fixed",
              discount_value: Number(data.discount_value),
              duration_months: data.duration_months,
            })
          }
        })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handlePlanSubscribe(
    selectedP: DbSubscription,
    planBilling: "monthly" | "yearly"
  ) {
    navigate(`/checkout?plan=${selectedP.id}&billing=${planBilling}`)
  }

  async function handlePurchase() {
    if (!user) {
      setPurchaseError("Prisijunk prie paskyros prieš perkant.")
      return
    }
    if (!plan) return
    setPurchasing(true)
    setPurchaseError("")
    const planKey = plan.id as PlanTier
    const basePrice =
      billing === "annual" ? (plan.annual_price ?? plan.price) : plan.price
    const discountedPrice = getDiscountedPrice(basePrice)
    const hasDiscount = appliedCoupon != null && discountedPrice < basePrice
    const origin = window.location.origin
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: {
        planKey,
        billing,
        userId: user.id,
        userEmail: user.email ?? form.email,
        successUrl: `${origin}/subscribe?success=true&plan=${planKey}${homeDelivery ? "&home_delivery=1" : ""}`,
        cancelUrl: `${origin}/subscribe?plan=${planKey}`,
        ...(hasDiscount && { discountedAmount: discountedPrice }),
        ...(appliedCoupon?.giftCardCode && {
          giftCardCode: appliedCoupon.giftCardCode,
        }),
        homeDelivery,
      },
    })
    setPurchasing(false)
    if (error || !data?.url) {
      setPurchaseError(error?.message ?? "Checkout nepavyko. Bandyk dar kartą.")
      return
    }
    window.location.assign(data.url)
  }

  // handle Stripe success redirect: ?success=true&plan=xxx
  useEffect(() => {
    if (params.get("success") !== "true") return
    const planKey = params.get("plan") as PlanTier | null
    if (!planKey || !user) return
    const hasHomeDelivery = params.get("home_delivery") === "1"
    supabase
      .from("subscribers")
      .upsert(
        {
          id: user.id,
          email: user.email ?? "",
          name: user.email?.split("@")[0] ?? "Subscriber",
          plan: planKey,
          status: "active",
          home_delivery: hasHomeDelivery,
        },
        { onConflict: "id" }
      )
      .then(() => setSubmitted(true))
  }, [user, params])

  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase()
    if (!code) return
    setCouponLoading(true)
    setCouponError(null)
    const { data, error } = await supabase
      .from("coupons")
      .select(
        "code, discount_type, discount_value, duration_months, max_uses, uses_count, expires_at, active"
      )
      .eq("code", code)
      .single()
    setCouponLoading(false)
    if (error || !data) {
      // Not a coupon — try as a gift card
      setCouponLoading(true)
      const { data: gcData, error: gcError } = await supabase.functions.invoke(
        "verify-gift-card",
        {
          body: { code },
        }
      )
      setCouponLoading(false)
      if (gcError || !gcData?.valid) {
        setCouponError(gcData?.error ?? "Kodas nerastas")
        return
      }
      setAppliedCoupon({
        code,
        discount_type: "fixed",
        discount_value: gcData.amountCents / 100,
        duration_months: null,
        giftCardCode: code,
      })
      setCouponInput("")
      return
    }
    if (!data.active) {
      setCouponError("This code is inactive")
      return
    }
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      setCouponError("This code has expired")
      return
    }
    if (data.max_uses != null && data.uses_count >= data.max_uses) {
      setCouponError("This code has reached its usage limit")
      return
    }
    setAppliedCoupon({
      code: data.code,
      discount_type: data.discount_type as "percentage" | "fixed",
      duration_months: data.duration_months,
      discount_value: Number(data.discount_value),
    })
    setCouponInput("")
  }

  function getDiscountedPrice(basePrice: number): number {
    if (!appliedCoupon) return basePrice
    if (appliedCoupon.discount_type === "percentage") {
      return Math.max(0, basePrice * (1 - appliedCoupon.discount_value / 100))
    }
    return Math.max(0, basePrice - appliedCoupon.discount_value)
  }

  const monthlyPrice = plan?.price ?? 0
  const annualPrice = plan?.annual_price ?? monthlyPrice
  const price = billing === "monthly" ? monthlyPrice : annualPrice
  const total = billing === "monthly" ? price : price * 10
  const isHomeDeliveryEligible =
    HOME_DELIVERY_PLANS.includes(plan?.id ?? "") && billing === "monthly"
  const deliveryFee =
    isHomeDeliveryEligible && homeDelivery ? HOME_DELIVERY_FEE : 0

  const comparisonFeatures = useMemo(
    () =>
      Array.from(
        new Set(plans.flatMap((p) => Object.keys(p.comparison_data ?? {})))
      ),
    [plans]
  )

  const heroRef = useReveal<HTMLDivElement>()
  const compareRef = useReveal<HTMLDivElement>()

  if (submitted && plan) {
    return (
      <div className="min-h-screen bg-paper">
        <Seo title="Prenumeratos planai" path="/subscribe" noindex />
        <Nav />
        <section className="py-20">
          <div className="mx-auto max-w-[1320px] px-4 md:px-7">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div
                className="brick-card flex min-h-[420px] flex-col items-center justify-center p-8 text-center md:p-16 lg:col-span-12"
                style={{ background: "#5DDB9C" }}
              >
                <div
                  className="font-display text-[80px] leading-none"
                  style={{ color: "#001B21" }}
                >
                  ✓
                </div>
                <h1 className="heading-display text-d-lg mt-6 text-ink">
                  Tu klube.
                </h1>
                <p className="mt-5 max-w-[42ch] text-[17px] leading-[1.65] text-ink/70">
                  Sveiki BRICKTIME {plan.name}. Katalogas atidarytas — naršyk
                  produktus ir pasirink pagal savo {plan.name} biudžetą.
                  Patvirtinimas išsiųstas į{" "}
                  <b>{form.email || "jūsų el. paštą"}</b>.
                </p>
                <div className="mt-10 flex flex-wrap justify-center gap-4">
                  <Button
                    asChild
                    className="brick-hover-sm rounded-full border-2 border-ink bg-ink text-[15px] font-bold text-paper"
                  >
                    <Link to="/account">
                      Eiti į paskyrą <ArrowRightIcon data-icon="inline-end" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="rounded-full border-2 border-ink bg-transparent text-[15px] font-bold text-ink transition-colors hover:bg-ink/5"
                  >
                    <Link to="/drop/26">Peržiūrėti produktą № 26</Link>
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

  return (
    <div className="min-h-screen bg-paper">
      <Seo
        title="Prenumeratos planai"
        description="Pasirink Brick Time prenumeratos planą pagal savo biudžetą – nuo Nano iki Mega – ir pradėk rinktis LEGO® rinkinius."
        path="/subscribe"
      />
      <Nav />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="bg-paper">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
          <div
            ref={heroRef}
            className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2"
          >
            <div>
              <h1 className="heading-display text-d-xl tracking-[-0.015em] text-ink">
                {step === "plan" ? (
                  <>
                    Pasirink prenumeratą
                    <br />
                    <span className="inline-block -rotate-[1.5deg] border-[3px] border-ink bg-brand-yellow px-2 shadow-[5px_5px_0_rgba(0,27,33,0.12)]">
                      Pradėk
                    </span>{" "}
                    konstruoti.
                  </>
                ) : (
                  <>
                    Užbaik{" "}
                    <span className="inline-block -rotate-[1.5deg] border-[3px] border-ink bg-brand-yellow px-2 shadow-[5px_5px_0_rgba(0,27,33,0.12)]">
                      užsakymą.
                    </span>
                  </>
                )}
              </h1>
              <p className="mt-6 max-w-[46ch] text-[17px] leading-[1.65] text-ink/65">
                {step === "plan"
                  ? "Pasirink prenumeratą pagal savo poreikius, mėgstamų rinkinių dydį ir konstravimo patirtį – nuo pirmųjų projektų iki didžiausių Premium LEGO® rinkinių."
                  : `Tik vienas žingsnis iki pirmosios BRICKTIME ${plan?.name ?? ""} dėžutės.`}
              </p>
            </div>

            <div className="hidden lg:block">
              <div className="relative aspect-[2/1] overflow-hidden rounded-2xl border-2 border-ink">
                <video
                  key={heroVideoUrl}
                  className="h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                >
                  <source src={heroVideoUrl} type="video/mp4" />
                </video>
              </div>
            </div>
          </div>
        </div>
      </section>

      {step === "plan" ? (
        <Subscriptions onSubscribe={handlePlanSubscribe} />
      ) : (
        /* ── Payment form ───────────────────────────────────────────── */
        <section className="bg-paper pt-4 pb-20">
          <div className="mx-auto max-w-[1320px] px-4 md:px-7">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="brick-card bg-cream p-6 md:p-10 lg:col-span-7">
                <h3 className="label-mono mb-7 text-ink/50">
                  Mokėjimo duomenys
                </h3>
                <div className="flex flex-col gap-5">
                  <div>
                    <label className="label-mono mb-2 block text-ink/60">
                      El. pašto adresas
                    </label>
                    <input
                      type="email"
                      placeholder="jusu@pastas.lt"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      className="w-full rounded-2xl border-2 border-ink bg-paper px-5 py-3.5 text-[15px] text-ink transition-shadow placeholder:text-ink/30 focus:shadow-[4px_4px_0_#001B21] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="label-mono mb-2 block text-ink/60">
                      Vardas ant kortelės
                    </label>
                    <input
                      type="text"
                      placeholder="Jonas Jonaitis"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      className="w-full rounded-2xl border-2 border-ink bg-paper px-5 py-3.5 text-[15px] text-ink transition-shadow placeholder:text-ink/30 focus:shadow-[4px_4px_0_#001B21] focus:outline-none"
                    />
                  </div>
                </div>

                {purchaseError && (
                  <p className="mt-4 font-mono text-[12px] text-red-500">
                    {purchaseError}
                  </p>
                )}
                <TermsAgreement
                  id="terms-subscribe-plan"
                  checked={agreedToTerms}
                  onCheckedChange={setAgreedToTerms}
                  className="mt-6"
                />
                <div className="mt-4 flex gap-3">
                  <Button
                    size="lg"
                    disabled={purchasing || !plan || !agreedToTerms}
                    className="brick-hover-sm flex-1 rounded-full border-2 border-ink bg-ink text-[16px] font-bold text-paper disabled:opacity-50"
                    onClick={handlePurchase}
                  >
                    {purchasing ? (
                      "Apdorojama…"
                    ) : (
                      <>
                        <span className="sm:hidden">
                          {`Pradėti — €${billing === "annual" ? `${total} šiandien` : `${price + deliveryFee}/mėn.`} →`}
                        </span>
                        <span className="hidden sm:inline">
                          {`Pradėti ${plan?.name ?? ""} — €${billing === "annual" ? `${total} šiandien` : `${price + deliveryFee}/mėn.`} →`}
                        </span>
                      </>
                    )}
                  </Button>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-[11px] tracking-[.08em] text-ink/40 uppercase">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheckIcon size={13} />
                    SSL šifravimas
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CalendarXIcon size={13} />
                    Atšauk bet kada
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-4 lg:col-span-5">
                {plan && (
                  <div
                    className="brick-card p-6 md:p-8"
                    style={{ background: plan.bg_color }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h3
                        className="heading-display text-d-xs"
                        style={{ color: plan.text_color }}
                      >
                        Užsakymo suvestinė
                      </h3>
                      {plan.brick_image && (
                        <img
                          src={plan.brick_image}
                          alt=""
                          className="pointer-events-none h-14 w-auto shrink-0 object-contain select-none"
                        />
                      )}
                    </div>
                    <div className="mt-5 flex flex-col gap-3 border-b border-dashed border-ink/30 pb-5">
                      <div
                        className="flex justify-between text-[15px]"
                        style={{ color: plan.text_color }}
                      >
                        <span>
                          {plan.name} prenumerata (
                          {billing === "monthly" ? "mėnesinis" : "metinis"})
                        </span>
                        <span className="font-display text-xl">
                          {appliedCoupon ? (
                            <>
                              <span className="line-through opacity-40">
                                €{price}
                              </span>{" "}
                              <span className="text-green-600">
                                €{getDiscountedPrice(price).toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <>€{price}</>
                          )}
                          /mėn.
                        </span>
                      </div>
                      {billing === "annual" && (
                        <div
                          className="flex justify-between text-[13px]"
                          style={{ color: `${plan.text_color}70` }}
                        >
                          <span>Mokama metiškai (10 mėnesių)</span>
                          <span>
                            −€{(monthlyPrice - annualPrice) * 12} taupoma
                          </span>
                        </div>
                      )}
                      <div
                        className="flex justify-between text-[13px]"
                        style={{ color: `${plan.text_color}70` }}
                      >
                        <span>Produktas № 26 (šis mėnuo)</span>
                        <span>Įskaičiuota</span>
                      </div>
                      <div
                        className="flex justify-between text-[13px]"
                        style={{ color: `${plan.text_color}70` }}
                      >
                        <span>Standartinis pristatymas</span>
                        <span>Nemokamas</span>
                      </div>
                      {isHomeDeliveryEligible && (
                        <div
                          className="flex items-center justify-between rounded-xl border-2 px-3 py-2.5 transition-colors"
                          style={{
                            borderColor: homeDelivery
                              ? plan.text_color
                              : `${plan.text_color}30`,
                            background: homeDelivery
                              ? `${plan.text_color}10`
                              : "transparent",
                          }}
                        >
                          <div className="flex flex-col gap-0.5">
                            <span
                              className="text-[13px] font-semibold"
                              style={{ color: plan.text_color }}
                            >
                              Pristatymas į duris
                            </span>
                            <span
                              className="font-mono text-[11px]"
                              style={{ color: `${plan.text_color}60` }}
                            >
                              +€{HOME_DELIVERY_FEE}/mėn.
                            </span>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={homeDelivery}
                            onClick={() => setHomeDelivery((v) => !v)}
                            className="relative h-6 w-11 shrink-0 rounded-full border-2 transition-colors"
                            style={{
                              borderColor: plan.text_color,
                              background: homeDelivery
                                ? plan.text_color
                                : `${plan.text_color}20`,
                            }}
                          >
                            <span
                              className="absolute top-0.5 h-4 w-4 rounded-full border-2 bg-paper transition-transform"
                              style={{
                                borderColor: plan.text_color,
                                transform: homeDelivery
                                  ? "translateX(20px)"
                                  : "translateX(2px)",
                              }}
                            />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex flex-col gap-2">
                      {appliedCoupon ? (
                        <div className="flex items-center gap-2 rounded-xl border-2 border-ink bg-green-50 px-4 py-3 text-sm font-semibold text-ink">
                          <span className="flex-1">
                            ✓ {appliedCoupon.code} —{" "}
                            {appliedCoupon.discount_type === "percentage"
                              ? `${appliedCoupon.discount_value}% off`
                              : `€${appliedCoupon.discount_value} off`}
                            {appliedCoupon.duration_months != null
                              ? ` for ${appliedCoupon.duration_months} month${appliedCoupon.duration_months > 1 ? "s" : ""}`
                              : " forever"}
                          </span>
                          <button
                            className="label-mono text-ink/50 hover:text-ink"
                            onClick={() => setAppliedCoupon(null)}
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            className="flex-1 rounded-xl border-2 border-ink bg-paper px-4 py-2.5 font-mono text-[13px] uppercase placeholder:text-ink/30 placeholder:normal-case focus:outline-none"
                            placeholder="Coupon code"
                            value={couponInput}
                            onChange={(e) => {
                              setCouponInput(e.target.value)
                              setCouponError(null)
                            }}
                            onKeyDown={(e) =>
                              e.key === "Enter" && applyCoupon()
                            }
                          />
                          <Button
                            variant="outline"
                            className="rounded-xl border-2 border-ink font-semibold"
                            onClick={applyCoupon}
                            disabled={couponLoading || !couponInput.trim()}
                          >
                            {couponLoading ? "…" : "Apply"}
                          </Button>
                        </div>
                      )}
                      {couponError && (
                        <p className="label-mono text-[11px] text-red-500">
                          {couponError}
                        </p>
                      )}
                    </div>
                    <div
                      className="mt-4 flex items-baseline justify-between"
                      style={{ color: plan.text_color }}
                    >
                      <span className="text-[15px] font-bold">
                        Mokėti šiandien
                      </span>
                      <span className="font-display text-[40px] leading-none">
                        €
                        {appliedCoupon
                          ? (
                              getDiscountedPrice(
                                billing === "annual" ? total : price
                              ) + deliveryFee
                            ).toFixed(2)
                          : billing === "annual"
                            ? total
                            : price + deliveryFee}
                      </span>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setStep("plan")}
                  className="text-center font-mono text-[12px] tracking-[.14em] text-ink/50 uppercase transition-colors hover:text-ink"
                >
                  ← Keisti prenumeratą
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Comparison table ─────────────────────────────────────────── */}
      <section className="bg-paper py-20">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
          <div
            ref={compareRef}
            className="grid grid-cols-1 gap-4 lg:grid-cols-12"
          >
            <div className="reveal lg:col-span-12">
              <h2 className="heading-display text-d-lg tracking-[-0.015em] text-ink">
                Palygink
                <br />
                <span
                  className="inline-block rotate-[-1.5deg] border-[3px] border-ink bg-brand-yellow px-[.12em] text-ink shadow-[5px_5px_0_rgba(0,27,33,.12)]"
                  style={{ transformOrigin: "center center" }}
                >
                  prenumeratas.
                </span>
              </h2>
            </div>
            <div className="reveal brick-card overflow-x-auto bg-cream lg:col-span-12">
              {plans.length > 0 && (
                <table
                  className="w-full table-fixed border-collapse"
                  style={{ minWidth: `${plans.length * 120}px` }}
                >
                  <thead>
                    <tr className="border-b-2 border-ink">
                      <th className="sticky left-0 z-20 bg-[#F5F1EB] p-3 text-left font-mono text-[11px] tracking-[.18em] text-ink/40 uppercase md:p-5">
                        Savybė
                      </th>
                      {plans.map((p) => (
                        <th
                          key={p.id}
                          className="border-l-2 border-ink p-3 text-left align-top md:p-4"
                          style={{ background: p.bg_color }}
                        >
                          <span
                            className="font-display text-[15px] leading-tight uppercase md:text-[18px]"
                            style={{ color: p.text_color }}
                          >
                            {p.name}
                          </span>
                          {p.featured && (
                            <div className="mt-3 h-7">
                              <span className="inline-flex rotate-2 items-center rounded border-2 border-ink bg-ink px-3 py-1 font-mono text-[11px] tracking-[.08em] text-paper uppercase">
                                Populiariausias
                              </span>
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonFeatures.map((feature) => (
                      <tr
                        key={feature}
                        className="border-b-2 border-dashed border-ink/20 transition-colors last:border-b-0 hover:bg-ink/[.03]"
                      >
                        <td className="sticky left-0 z-10 bg-[#F5F1EB] p-3 text-[12px] font-semibold text-ink/70 md:p-4 md:text-[13px]">
                          {feature}
                        </td>
                        {plans.map((p) => {
                          const val = p.comparison_data?.[feature] ?? "—"
                          return (
                            <td
                              key={p.id}
                              className="border-l-2 border-dashed border-ink/20 p-3 text-[12px] text-ink md:p-4 md:text-[13px]"
                            >
                              {val === "—" ? (
                                <span className="text-ink/25">—</span>
                              ) : val === "✓" ? (
                                <span className="grid size-5 place-items-center rounded-full border-2 border-ink bg-brand-mint text-[11px] font-bold text-ink">
                                  ✓
                                </span>
                              ) : (
                                val
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </section>

      <FAQ
        ctaEyebrow="Pasiruošęs pradėti?"
        ctaHeading={"Atrask savo\n==LEGO® rinkinius.=="}
        ctaBody="Peržiūrėk visus mūsų turimus LEGO® rinkinius ir išsirink, kurį konstruosi pirmiausia."
        ctaLabel="Peržiūrėti rinkinius"
        ctaHref="/archive"
      />

      <Footer />
    </div>
  )
}
