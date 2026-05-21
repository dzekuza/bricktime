import { useState, useEffect, useMemo } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import type { PlanTier } from "@/lib/database.types"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import {
  ArrowRightIcon,
  ShieldCheckIcon,
  CalendarXIcon,
  RefreshCcwIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useReveal } from "@/hooks/useReveal"
import { usePlans } from "@/hooks/usePlans"

// ── static data ────────────────────────────────────────────────────────────

const HOME_DELIVERY_PLANS = ['pro', 'mega', 'mystery_s', 'mystery_m']
const HOME_DELIVERY_FEE = 3

const trustTiles = [
  {
    label: "Atšauk bet kada",
    body: "Jokių mokesčių, jokio trinties. Vienas paspaudimas tavo paskyros skydelyje.",
    bg: "#5DDB9C",
    num: "01",
  },
  {
    label: "Praleisk bet kurį mėnesį",
    body: "Vyksti atostogų? Per metus galima praleisti iki 3 mėnesių, mokėjimas sustabdomas.",
    bg: "#FFAEE7",
    num: "02",
  },
  {
    label: "30 dienų garantija",
    body: "Nepatiko pirmasis mėnuo — grąžinsime visą sumą, be jokių klausimų.",
    bg: "#4DA2FF",
    num: "03",
  },
  {
    label: "Nemokamas pristatymas visame pasaulyje",
    body: "Standartinis visuose planuose. Skubus Advanced, Master ir Legend planuose.",
    bg: "#FFD731",
    num: "04",
  },
]

const faqs = [
  {
    q: "Kaip veikia mėnesinis biudžetas?",
    a: "Kiekvienas planas suteikia fiksuotą € biudžetą produktams iš katalogo. Galite turėti kelis produktus vienu metu, kol bendra jų vertė neviršija biudžeto. Biudžetas atsinaujina kas mėnesį.",
  },
  {
    q: "Ar galiu keisti planą prenumeratos metu?",
    a: "Taip — paaukštink arba sumažink planą bet kada iš savo skydelio. Pakeitimai įsigalioja nuo kito atsiskaitymo ciklo.",
  },
  {
    q: "Kokius mokėjimo būdus priimate?",
    a: "Priimame visas pagrindines kredito ir debeto korteles (Visa, Mastercard, Amex), PayPal ir Apple Pay.",
  },
  {
    q: "Kaip veikia metinio atsiskaitymo nuolaida?",
    a: "Metinis atsiskaitymas apmokestina už 10 mėnesių iš anksto ir suteikia 12 mėnesių produktų — iš esmės 2 mėnesiai nemokamai. Rodoma kaina yra mėnesio ekvivalentas.",
  },
  {
    q: "Ar miniukai suderinami su standartinėmis kaladėlėmis?",
    a: "Kiekviena BRICKTIME detalė yra 100 % suderinama su visomis pagrindinėmis kaladėlių sistemomis, kurias jau turi.",
  },
  {
    q: "Ar pristatote į užsienį?",
    a: "Pristatome į 42 šalis. Standartinis pristatymas nemokamas visur. Pristatymo laikas: 3–5 dienos (ES), 7–14 dienų (likęs pasaulis).",
  },
]

function FAQItem({
  q,
  a,
  open,
  onToggle,
}: {
  q: string
  a: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <div className="border-b-2 border-dashed border-ink/20 last:border-b-0">
      <button
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 py-5 text-left"
      >
        <span className="text-[16px] leading-[1.4] font-semibold text-ink">
          {q}
        </span>
        <span
          className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border-2 border-ink text-ink"
          style={{
            transition: "transform .2s",
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M6 1v10M1 6h10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </button>
      <div
        className="overflow-hidden"
        style={{
          transition: "max-height .25s, opacity .2s",
          maxHeight: open ? 600 : 0,
          opacity: open ? 1 : 0,
        }}
      >
        <p className="pb-5 text-[15px] leading-[1.65] text-ink/65">{a}</p>
      </div>
    </div>
  )
}

// ── page ───────────────────────────────────────────────────────────────────

export default function Subscribe() {
  const [params] = useSearchParams()
  const { user, profile } = useAuth()
  const { plans, loading: plansLoading } = usePlans()

  const planIndex = useMemo(
    () => Object.fromEntries(plans.map((p, i) => [p.id, i])),
    [plans]
  )

  // Resolve initial plan from URL param; default to index 1 (second plan) if "standard" not found
  const initialPlan =
    planIndex[params.get("plan") ?? "standard"] ??
    planIndex["standard"] ??
    1

  const [selectedPlan, setSelectedPlan] = useState(initialPlan)
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly")
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
    if (!HOME_DELIVERY_PLANS.includes(plan?.id ?? '')) setHomeDelivery(false)
  }, [plan?.id])

  const [purchasing, setPurchasing] = useState(false)
  const [purchaseError, setPurchaseError] = useState("")
  const [openFaq, setOpenFaq] = useState<number | null>(null)
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

  async function handlePurchase() {
    if (!user) {
      setPurchaseError("Prisijunk prie paskyros prieš perkant.")
      return
    }
    if (!plan) return
    setPurchasing(true)
    setPurchaseError("")
    const planKey = plan.id as PlanTier
    const basePrice = billing === "annual" ? (plan.annual_price ?? plan.price) : plan.price
    const discountedPrice = getDiscountedPrice(basePrice)
    const hasDiscount = appliedCoupon != null && discountedPrice < basePrice
    const origin = window.location.origin
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: {
        planKey,
        userId: user.id,
        userEmail: user.email ?? form.email,
        successUrl: `${origin}/subscribe?success=true&plan=${planKey}${homeDelivery ? '&home_delivery=1' : ''}`,
        cancelUrl: `${origin}/subscribe?plan=${planKey}`,
        ...(hasDiscount && { discountedAmount: discountedPrice }),
        ...(appliedCoupon?.giftCardCode && { giftCardCode: appliedCoupon.giftCardCode }),
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
        { onConflict: "id" },
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
        "code, discount_type, discount_value, duration_months, max_uses, uses_count, expires_at, active",
      )
      .eq("code", code)
      .single()
    setCouponLoading(false)
    if (error || !data) {
      // Not a coupon — try as a gift card
      setCouponLoading(true)
      const { data: gcData, error: gcError } = await supabase.functions.invoke('verify-gift-card', {
        body: { code },
      })
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
  const isHomeDeliveryEligible = HOME_DELIVERY_PLANS.includes(plan?.id ?? '') && billing === "monthly"
  const deliveryFee = isHomeDeliveryEligible && homeDelivery ? HOME_DELIVERY_FEE : 0

  const comparisonFeatures = useMemo(
    () => Array.from(new Set(plans.flatMap((p) => Object.keys(p.comparison_data ?? {})))),
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
                className="brick-card flex min-h-[420px] flex-col items-center justify-center p-8 md:p-16 text-center lg:col-span-12"
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
      <section className="bg-paper pt-6 pb-4">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
          <div ref={heroRef} className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div
              className="reveal relative overflow-hidden rounded-2xl border-2 border-[#1e4048] bg-[#001B21] md:rounded-3xl lg:col-span-12"
            >
              <div className="grid min-h-[280px] gap-6 p-6 md:p-9 lg:min-h-[360px] lg:grid-cols-[minmax(0,1.15fr)_420px] lg:items-stretch">
                <div className="relative z-10 flex flex-col justify-between">
                  <div>
                    <h1 className="heading-display text-d-lg mt-4 tracking-[-0.015em] text-paper">
                      {step === "plan" ? "Pasirink planą." : "Užbaik užsakymą."}
                    </h1>
                    <p className="mt-5 max-w-[46ch] text-[16px] leading-[1.65] text-[#8aabb2]">
                      {step === "plan"
                        ? "Penki lygiai. Atšauk bet kurį mėnesį. Išsiunčiama per 5 dienas po registracijos."
                        : `Tik vienas žingsnis iki pirmosios BRICKTIME ${plan?.name ?? ""} dėžutės.`}
                    </p>
                  </div>
                  <div className="mt-8 flex items-center gap-3">
                    {(["Pasirinkti planą", "Mokėjimas"] as const).map(
                      (s, i) => (
                        <div key={s} className="flex items-center gap-3">
                          <div
                            className={[
                              "flex items-center gap-2 rounded-full border-2 px-4 py-1.5 font-mono text-[11px] tracking-[.08em] uppercase transition-all",
                              (step === "plan" ? i === 0 : i === 1)
                                ? "border-brand-yellow bg-brand-yellow text-ink"
                                : "border-[#2d5560] text-[#5a7e87]",
                            ].join(" ")}
                          >
                            <span>{i + 1}</span>
                            <span>{s}</span>
                          </div>
                          {i === 0 && (
                            <ArrowRightIcon className="size-4 text-[#2d5560]" />
                          )}
                        </div>
                      ),
                    )}
                  </div>
                </div>

                <div className="relative min-h-[220px] overflow-hidden rounded-[28px] border-2 border-[#2d5560] bg-[#03262e] shadow-[6px_6px_0_#001B21]">
                  <video
                    className="h-full w-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                  >
                    <source src="/subscribe-hero.mp4" type="video/mp4" />
                  </video>
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,27,33,0.05)_0%,rgba(0,27,33,0.28)_100%)]" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(0,27,33,0)_0%,rgba(0,27,33,0.55)_100%)]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {step === "plan" ? (
        /* ── Plan selection ─────────────────────────────────────────── */
        <section className="bg-paper pt-4 pb-20">
          <div className="mx-auto max-w-[1320px] px-4 md:px-7">
            <div className="mb-6 flex justify-center">
              <div className="inline-flex flex-col items-center gap-2">
                <span className="label-mono text-ink/45">Atsiskaitymas</span>
                <div className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-paper p-1 shadow-[4px_4px_0_#001B21]">
                  {(["monthly", "annual"] as const).map((value) => {
                    const active = billing === value
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setBilling(value)}
                        className="rounded-full px-4 py-2 font-mono text-[11px] tracking-[.08em] uppercase transition-all"
                        style={
                          active && plan
                            ? {
                                background: plan.cta_bg,
                                color: plan.cta_text,
                              }
                            : {
                                color: "#001B2199",
                              }
                        }
                      >
                        {value === "monthly" ? "Mėn." : "Metinis −17%"}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* mobile: horizontal scroll carousel; desktop: overlapping flex row */}
            {plansLoading ? (
              <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-visible pt-5 pb-2 lg:gap-0 lg:-space-x-4 lg:overflow-visible lg:pt-5 lg:pb-0">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="relative flex w-[56vw] shrink-0 snap-center flex-col justify-between rounded-2xl border-2 border-ink/20 bg-ink/10 p-6 lg:w-auto lg:flex-1"
                    style={{ zIndex: i + 1 }}
                  >
                    <div className="animate-pulse space-y-4">
                      <div className="h-7 w-2/3 rounded bg-ink/10" />
                      <div className="h-10 w-1/2 rounded bg-ink/10" />
                      <div className="mt-5 space-y-2">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <div key={j} className="h-4 w-full rounded bg-ink/10" />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-visible pt-5 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] lg:gap-0 lg:-space-x-4 lg:overflow-visible lg:pt-5 lg:pb-0 [&::-webkit-scrollbar]:hidden">
                {plans.map((p, i) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlan(i)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        setSelectedPlan(i)
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedPlan === i}
                    className={[
                      "relative flex w-[56vw] shrink-0 snap-center flex-col justify-between rounded-2xl border-2 p-6 text-left transition-all duration-200 hover:z-10 hover:-translate-y-3 md:rounded-3xl md:p-7 lg:w-auto lg:flex-1",
                      selectedPlan === i
                        ? "z-10 -translate-y-3 border-ink shadow-[6px_6px_0_#001B21]"
                        : "border-ink/40 hover:border-ink hover:shadow-[4px_4px_0_#001B21]",
                    ].join(" ")}
                    style={{ background: p.bg_color, zIndex: i + 1 }}
                  >
                    {p.featured && (
                      <Badge
                        className="absolute -top-3.5 right-5 rotate-1 rounded border-2 border-ink bg-ink px-2.5 py-0.5 font-mono text-[10px] tracking-[.08em] uppercase text-primary-foreground"
                      >
                        Populiarus
                      </Badge>
                    )}
                    {selectedPlan === i && (
                      <span className="absolute top-4 right-4 grid size-6 place-items-center rounded-full border-2 border-ink bg-ink text-[11px] font-bold text-paper">
                        ✓
                      </span>
                    )}
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className="font-display text-3xl leading-[.88]"
                          style={{ color: p.text_color }}
                        >
                          {p.name}
                        </div>
                        {p.brick_image && (
                          <img
                            src={p.brick_image}
                            alt=""
                            className="pointer-events-none h-12 w-auto shrink-0 object-contain select-none md:h-14"
                          />
                        )}
                      </div>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span
                          className="text-d-sm font-display leading-[.9]"
                          style={{ color: p.text_color }}
                        >
                          €
                          {billing === "monthly"
                            ? p.price
                            : (p.annual_price ?? p.price)}
                        </span>
                        <span
                          className="font-mono text-[11px] tracking-[.06em] uppercase"
                          style={{ color: `${p.text_color}70` }}
                        >
                          /mėn.
                        </span>
                      </div>
                    </div>
                    <ul className="mt-5 flex flex-col gap-2">
                      {p.perks
                        .filter((perk) => perk.included)
                        .slice(0, 5)
                        .map((perk) => (
                          <li
                            key={perk.label}
                            className="flex items-start gap-2 text-[13px]"
                          >
                            <span
                              className="mt-[3px] size-2.5 shrink-0 rounded-full border-[1.5px]"
                              style={{
                                background: p.accent_color,
                                borderColor: p.text_color,
                              }}
                            />
                            <span style={{ color: `${p.text_color}cc` }}>
                              {perk.label}
                            </span>
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 flex justify-center">
              <Button
                size="lg"
                className="brick-hover-sm rounded-full border-2 border-ink bg-ink text-[16px] font-bold text-paper"
                onClick={() => setStep("payment")}
                disabled={!plan}
              >
                Tęsti su {plan?.name ?? "…"}{" "}
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </div>
          </div>
        </section>
      ) : (
        /* ── Payment form ───────────────────────────────────────────── */
        <section className="bg-paper pt-4 pb-20">
          <div className="mx-auto max-w-[1320px] px-4 md:px-7">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div
                className="brick-card bg-cream p-6 md:p-10 lg:col-span-7"
              >
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
                  <span className="flex items-center gap-1.5">
                    <RefreshCcwIcon size={13} />
                    30 dienų grąžinimo garantija
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
                      <h3 className="heading-display text-d-xs" style={{ color: plan.text_color }}>
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
                            borderColor: homeDelivery ? plan.text_color : `${plan.text_color}30`,
                            background: homeDelivery ? `${plan.text_color}10` : 'transparent',
                          }}
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[13px] font-semibold" style={{ color: plan.text_color }}>
                              Pristatymas į duris
                            </span>
                            <span className="font-mono text-[11px]" style={{ color: `${plan.text_color}60` }}>
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
                              background: homeDelivery ? plan.text_color : `${plan.text_color}20`,
                            }}
                          >
                            <span
                              className="absolute top-0.5 h-4 w-4 rounded-full border-2 bg-paper transition-transform"
                              style={{
                                borderColor: plan.text_color,
                                transform: homeDelivery ? 'translateX(20px)' : 'translateX(2px)',
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
                            className="flex-1 rounded-xl border-2 border-ink bg-paper px-4 py-2.5 font-mono text-[13px] uppercase placeholder:normal-case placeholder:text-ink/30 focus:outline-none"
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
                          ? (getDiscountedPrice(billing === "annual" ? total : price) + deliveryFee).toFixed(2)
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
                Viskas, greta.
              </h2>
            </div>
            <div
              className="reveal brick-card bg-cream overflow-x-auto lg:col-span-12"
            >
              {plans.length > 0 && (
                <table className="w-full border-collapse" style={{ minWidth: `${120 + plans.length * 110}px` }}>
                  <thead>
                    <tr className="border-b-2 border-ink">
                      <th className="sticky left-0 z-20 w-[120px] min-w-[120px] bg-[#F5F1EB] p-3 text-left font-mono text-[11px] tracking-[.18em] text-ink/40 uppercase md:w-[160px] md:min-w-[160px] md:p-5">
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
                            <span
                              className="mt-0.5 block font-mono text-[9px] tracking-[.1em] uppercase"
                              style={{ color: `${p.text_color}60` }}
                            >
                              Populiarus
                            </span>
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
      <section className="bg-paper py-20">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
          <div
            ref={trustRef}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {trustTiles.map((t, i) => (
              <div
                key={t.num}
                className="reveal brick-card-hover flex min-h-[220px] flex-col justify-between rounded-2xl border-2 border-ink p-6 shadow-[6px_6px_0_#001B21] md:rounded-3xl md:p-8"
                style={{ background: t.bg, transitionDelay: `${i * 70}ms` }}
              >
                <span className="font-display text-[52px] leading-[.85] text-ink/20 select-none">
                  {t.num}
                </span>
                <div>
                  <h3 className="heading-display text-d-xs leading-[.92] text-ink">
                    {t.label}
                  </h3>
                  <p className="mt-3 text-[14px] leading-[1.6] text-ink/65">
                    {t.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section className="bg-paper py-20">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
          <div ref={faqRef} className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div
              className="reveal brick-card relative flex min-h-[280px] flex-col justify-between p-6 md:p-9 lg:col-span-4"
              style={{ background: "#5C4ADE" }}
            >
              <img
                src="/br.svg"
                alt=""
                className="pointer-events-none absolute right-6 bottom-6 w-[200px] select-none"
              />
              <div className="max-w-[50%]">
                <h2 className="heading-display text-d-md tracking-[-0.015em] text-paper">
                  Tai, ko
                  <br />
                  žmonės
                  <br />
                  klausia.
                </h2>
                <p className="mt-5 text-[14px] leading-[1.65] text-paper/65">
                  Vis dar neaišku? Rašyk mums{" "}
                  <a
                    href="mailto:hi@bricktime.co"
                    className="text-brand-yellow underline underline-offset-2"
                  >
                    hi@bricktime.co
                  </a>
                </p>
              </div>
            </div>
            <div
              className="reveal brick-card bg-cream p-6 md:p-9 lg:col-span-8"
            >
              {faqs.map((faq, i) => (
                <FAQItem
                  key={i}
                  q={faq.q}
                  a={faq.a}
                  open={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
