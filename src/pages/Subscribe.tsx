import { useState, useEffect, useMemo } from "react"
import { useSearchParams, Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import type { PlanTier } from "@/lib/database.types"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import Plans from "@/components/Plans"
import type { DbPlan } from "@/hooks/usePlans"
import { ArrowRightIcon, ShieldCheckIcon, CalendarXIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useReveal } from "@/hooks/useReveal"
import { usePlans } from "@/hooks/usePlans"
import { HERO_VIDEO_URL } from "@/lib/media"

// ── static data ────────────────────────────────────────────────────────────

const HOME_DELIVERY_PLANS = ["pro", "mega", "mystery_s", "mystery_m"]
const HOME_DELIVERY_FEE = 3

const faqs = [
  {
    q: "Ar visi rinkiniai yra originalūs?",
    a: "Aukštos kokybės ABS plastikas prie pramoninio standarto 1,6 mm tolerancijos. Visiškai suderinamos su bet kokios suderinamos markės kaladėlėmis — užsispaudžia, laiko ir išsiskiria švariai.",
  },
  {
    q: "Kas jei trūksta detalės?",
    a: "Pranešk mums ir mes kuo greičiau išsiųsime trūkstamą detalę nemokamai.",
  },
  {
    q: "Ar galiu pasirinkti konkretų rinkinį?",
    a: "Taip — pasirinkę planą galite naršyti katalogą ir išsirinkti norimą rinkinį pagal savo biudžetą.",
  },
  {
    q: "Kaip veikia grąžinimas?",
    a: "Grąžinimui išsiunčiame iš anksto apmokėtą grąžinimo etiketę. Tiesiog supakuok rinkinį ir nunes į paštomatą.",
  },
  {
    q: "Ar galiu pristabdyti prenumeratą?",
    a: "Taip — per metus galima pristabdyti iki 3 mėnesių. Mokėjimas sustabdomas, rinkiniai laukia tavęs.",
  },
]

// ── page ───────────────────────────────────────────────────────────────────

export default function Subscribe() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { plans } = usePlans()

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

  const [homeDelivery, setHomeDelivery] = useState(false)

  // reset home delivery toggle when switching to an ineligible plan
  useEffect(() => {
    if (!HOME_DELIVERY_PLANS.includes(plan?.id ?? "")) setHomeDelivery(false)
  }, [plan?.id])

  const [purchasing, setPurchasing] = useState(false)
  const [purchaseError, setPurchaseError] = useState("")
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
    selectedP: DbPlan,
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
  const trustRef = useReveal<HTMLDivElement>()
  const faqRef = useReveal<HTMLDivElement>()

  if (submitted && plan) {
    return (
      <div className="min-h-screen bg-paper">
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
                    Pasirink planą
                    <br />
                    <span className="inline-block -rotate-[1.5deg] border-[3px] border-ink bg-brand-yellow px-2 shadow-[5px_5px_0_rgba(0,27,33,0.12)]">
                      Pradėk
                    </span>{" "}
                    statyti
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
                  ? "Pasirink planą pagal savo biudžetą, mėgstamų rinkinių dydį ir konstravimo patirtį — nuo pirmųjų projektų iki didelių kolekcinių modelių bei išskirtinių premium serijų."
                  : `Tik vienas žingsnis iki pirmosios BRICKTIME ${plan?.name ?? ""} dėžutės.`}
              </p>
            </div>

            <div className="hidden lg:block">
              <div className="relative aspect-[2/1] overflow-hidden rounded-2xl border-2 border-ink">
                <video
                  className="h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                >
                  <source src={HERO_VIDEO_URL} type="video/mp4" />
                </video>
              </div>
            </div>
          </div>
        </div>
      </section>

      {step === "plan" ? (
        <Plans onSubscribe={handlePlanSubscribe} />
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
                <div className="mt-8 flex gap-3">
                  <Button
                    size="lg"
                    disabled={purchasing || !plan}
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
                          {plan.name} planas (
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
                  ← Keisti planą
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
                  planus.
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

      {/* ── Trust signals ────────────────────────────────────────────── */}
      <section className="relative bg-paper py-10 md:py-20">
        <div className="relative z-10 mx-auto max-w-[1320px] px-4 md:px-7">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-20">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <div>
                <h2 className="heading-display text-d-lg mt-4 tracking-[-0.015em] text-ink">
                  Prenumerata
                  <br />
                  <span
                    className="inline-block rotate-[-1.5deg] border-[3px] border-ink bg-brand-yellow px-[.12em] text-ink shadow-[5px_5px_0_rgba(0,27,33,.12)]"
                    style={{ transformOrigin: "center center" }}
                  >
                    be rizikos.
                  </span>
                </h2>
                <p className="mt-6 max-w-[40ch] text-[17px] leading-[1.65] text-ink/65">
                  Lanksti LEGO® rinkinių prenumerata su nemokamu pristatymu ir
                  galimybe keisti rinkinius kada tik panorėjus. Statyk daugiau,
                  sutaupyk ir nebeleisk rinkiniams dulkėti lentynose.
                </p>
                <Link
                  to="/subscribe"
                  className="brick-hover-sm mt-8 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-ink px-7 py-3.5 text-[15px] font-bold text-paper"
                >
                  Pradėti prenumeratą
                  <ArrowRightIcon className="size-4" />
                </Link>
                <div className="brick-card mt-8 h-[260px] overflow-hidden">
                  <img
                    src="/images/build-cactus.jpg"
                    alt="Statytojas dedantis paskutinę detalę"
                    className="h-full w-full object-cover"
                    style={{ objectPosition: "center 35%" }}
                  />
                </div>
              </div>
            </div>

            <div ref={trustRef}>
              <div className="flex flex-col gap-4">
                {[
                  {
                    num: "01",
                    title: "Nemokamas pristatymas",
                    body: "Visi LEGO® rinkiniai pristatomi į paštomatą nemokamai visoje Lietuvoje.",
                  },
                  {
                    num: "02",
                    title: "Keisk rinkinius bet kada",
                    body: "Surink, grąžink ir išsirink naują rinkinį kada panorėjęs — be papildomų mokesčių.",
                  },
                  {
                    num: "03",
                    title: "Jokių ilgalaikių įsipareigojimų",
                    body: "Pakeisk planą, pristabdyk prenumeratą arba atšauk ją bet kuriuo metu.",
                  },
                  {
                    num: "04",
                    title: "Nauji rinkiniai kas mėnesį",
                    body: "Atrask naujus LEGO® modelius ir gauk ankstyvą prieigą prie naujų papildymų.",
                  },
                ].map((item, i) => (
                  <div
                    key={item.num}
                    className="reveal brick-card brick-card-hover relative flex gap-6 overflow-hidden bg-paper p-6 md:p-8"
                    style={{ transitionDelay: `${i * 60}ms` }}
                  >
                    <div className="text-d-hero absolute top-2 right-4 font-display leading-[.8] text-ink/10 select-none">
                      {item.num}
                    </div>
                    <div className="max-w-[80%] pt-1">
                      <h3 className="heading-display text-d-xs text-ink">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-[15px] leading-[1.65] text-ink/65">
                        {item.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section id="faq" className="bg-paper py-10 md:py-20">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
          <div ref={faqRef} className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* FAQ accordion card */}
            <div className="reveal brick-card relative bg-paper p-6 md:p-9 lg:col-span-7 lg:row-span-2">
              <img
                src="/faq-mascot.svg"
                alt=""
                aria-hidden
                className="absolute top-6 right-6 w-[100px] md:w-[128px]"
              />
              <h2 className="heading-display text-d-lg mt-3 text-ink">
                <span
                  className="inline-block border-[3px] border-ink bg-brand-yellow px-[.12em] text-ink shadow-[5px_5px_0_rgba(0,27,33,.12)]"
                  style={{ transform: "rotate(-1.5deg)" }}
                >
                  Dažniausi
                </span>
                <br />
                klausimai.
              </h2>
              <Accordion type="single" collapsible className="mt-6 w-full">
                {faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger className="py-4 text-left text-[16px] leading-snug font-bold hover:no-underline">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="max-w-[58ch] pb-4 text-[15px] leading-[1.65] text-ink/70">
                        {faq.a}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Stats card */}
            <div className="reveal grid grid-cols-2 gap-4 rounded-2xl border-2 border-ink bg-ink p-6 shadow-[6px_6px_0_rgba(245,241,235,.1)] md:rounded-3xl md:p-8 lg:col-span-5">
              <div className="flex flex-col justify-between rounded-xl border border-paper/15 p-3 md:min-h-[100px] md:rounded-2xl md:p-5">
                <p className="md:text-d-xs font-display text-[28px] leading-[.9] text-paper">
                  12 400+
                </p>
                <div className="mt-2 font-mono text-[10px] tracking-[.16em] text-paper/50 uppercase">
                  Aktyvūs prenumeratoriai
                </div>
              </div>
              <div className="flex flex-col justify-between rounded-xl border-2 border-paper bg-brand-yellow p-3 md:min-h-[100px] md:rounded-2xl md:p-5">
                <p className="font-display leading-[.9]">
                  <span className="text-[22px] text-ink">★</span>
                  <span className="text-[36px] text-ink md:text-[44px]">
                    4.9
                  </span>
                  <span className="text-[18px] text-ink/50">/5</span>
                </p>
                <div className="mt-2 font-mono text-[10px] tracking-[.16em] text-ink/50 uppercase">
                  Vidutinis įvertinimas
                </div>
              </div>
              <div className="flex flex-col justify-between rounded-xl border border-paper/15 p-3 md:min-h-[100px] md:rounded-2xl md:p-5">
                <p className="md:text-d-xs font-display text-[28px] leading-[.9] text-paper">
                  26
                </p>
                <div className="mt-2 font-mono text-[10px] tracking-[.16em] text-paper/50 uppercase">
                  Išsiųstų rinkinių
                </div>
              </div>
              <div className="flex flex-col justify-between rounded-xl border border-paper/15 p-3 md:min-h-[100px] md:rounded-2xl md:p-5">
                <p className="md:text-d-xs font-display text-[28px] leading-[.9] text-paper">
                  170
                </p>
                <div className="mt-2 font-mono text-[10px] tracking-[.16em] text-paper/50 uppercase">
                  Aktyvių rinkinių
                </div>
              </div>
            </div>

            {/* CTA card */}
            <div
              className="reveal brick-card flex flex-col justify-between p-6 md:p-8 lg:col-span-5"
              style={{ background: "#5C4ADE" }}
            >
              <div>
                <p className="font-mono text-[10px] tracking-[.22em] text-paper/60 uppercase">
                  Vis dar abejoji?
                </p>
                <h3 className="heading-display text-d-sm mt-3 leading-[.9] text-paper">
                  Naujausi
                  <br />
                  <span
                    className="inline-block border-[3px] border-paper/40 bg-brand-yellow px-[.12em] text-ink shadow-[5px_5px_0_rgba(245,241,235,.2)]"
                    style={{
                      transform: "rotate(-1.5deg)",
                      transformOrigin: "center center",
                    }}
                  >
                    Lego Rinkiniai.
                  </span>
                </h3>
                <p className="mt-3 text-[15px] leading-[1.6] text-paper/70">
                  Pasirink planą, išsirink norimus modelius ir keisk juos kada
                  panorėjęs — be ilgalaikių įsipareigojimų.
                </p>
              </div>
              <a
                href="#plans"
                className="mt-6 inline-flex items-center justify-center rounded-full border-2 border-ink bg-brand-yellow px-6 py-3 text-center text-[15px] font-bold text-ink transition-all hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[6px_6px_0_rgba(0,0,0,.2)]"
              >
                Pasirinkti planą →
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
