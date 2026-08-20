import { useState, useEffect, useMemo } from "react"
import { calculatePoints, type AchievementDef } from "@/data/community"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import type { PlanTier } from "@/lib/database.types"

import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { useSubscriptions } from "@/hooks/useSubscriptions"
import { useAchievements } from "@/hooks/useAchievements"
import { useCredits } from "@/hooks/useCredits"
import { MissingPartDialog } from "@/components/MissingPartDialog"
import { OrderTracking } from "@/components/OrderTracking"
import { ReturnDialog } from "@/components/ReturnDialog"
import { ProfileEditDialog } from "@/components/ProfileEditDialog"
import { fetchLabelPdf, downloadPdf } from "@/lib/lpexpress"
import { Seo } from "@/components/Seo"
import { TermsAgreement } from "@/components/TermsAgreement"

const SUBSCRIBER_STATUS_LABELS: Record<string, string> = {
  active: "Aktyvi",
  paused: "Pristabdyta",
  cancelled: "Atšaukta",
}
const HOME_DELIVERY_FEE = 3

// ── predefined avatars ──────────────────────────────────────────────────────
const avatarOptions = [
  {
    id: 0,
    src: "/avatars/avatar-classic.png",
    label: "Klasikinis",
    bg: "#FFD731",
  },
  {
    id: 1,
    src: "/avatars/avatar-beanie.png",
    label: "Kepurėtas",
    bg: "#FB4903",
  },
  { id: 2, src: "/avatars/avatar-ninja.png", label: "Nindzė", bg: "#001B21" },
  { id: 3, src: "/avatars/avatar-robot.png", label: "Robotas", bg: "#4DA2FF" },
  {
    id: 4,
    src: "/avatars/avatar-wizard.png",
    label: "Burtininkas",
    bg: "#5C4ADE",
  },
]

interface SubscriberData {
  plan: string
  status: string
  email: string
  joined_at: string
  penalty_amount: number | null
  penalty_reason: string | null
  name?: string | null
  last_name?: string | null
  phone?: string | null
  street?: string | null
  house_no?: string | null
  flat?: string | null
  city?: string | null
  postal_code?: string | null
  home_delivery?: boolean
}

interface AchievementRecord {
  achievement_id: string
}

interface RentedOrder {
  id: string
  productId: number
  productTitle: string
  productImage: string | null
  status: string
  startDate: string
  dueDate: string
  amount: number
  returnNote?: string
  homeDelivery: boolean
  terminalName?: string | null
  barcode?: string | null
  returnBarcode?: string | null
}

// ── Achievements section ────────────────────────────────────────────────────
function AchievementsSection({
  unlockedIds,
  totalPoints,
  achievements,
  userId,
}: {
  unlockedIds: Set<string>
  totalPoints: number
  achievements: AchievementDef[]
  userId: string
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <section className="bg-paper pb-10 md:pb-20">
      <div className="mx-auto max-w-[1320px] px-4 md:px-7">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Points summary */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border-2 border-ink bg-ink p-3 shadow-[6px_6px_0_#FFD731] md:rounded-3xl md:p-8">
              <p className="font-display text-[72px] leading-none text-paper">
                {totalPoints}
              </p>
              <p className="mt-1 font-mono text-[11px] tracking-widest text-paper/40 uppercase">
                Taškai iš viso
              </p>
              <div className="mt-6 rounded-2xl border border-paper/15 px-4 py-3">
                <p className="font-mono text-[11px] tracking-widest text-paper/40 uppercase">
                  Lyderių lentelė
                </p>
                <p className="mt-1 text-[22px] font-bold text-paper"># –</p>
              </div>
              <a
                href="/community"
                className="mt-3 block text-center font-mono text-[11px] tracking-widest text-paper/40 uppercase transition-colors hover:text-paper/70"
              >
                Žiūrėti lyderių lentelę →
              </a>
              <a
                href={`/profile/${userId}`}
                className="mt-2 block text-center font-mono text-[11px] tracking-widest text-paper/40 uppercase transition-colors hover:text-paper/70"
              >
                Peržiūrėti savo profilį →
              </a>
            </div>
          </div>

          {/* Badge grid */}
          <div className="lg:col-span-9">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
              {achievements.map((def) => {
                const unlocked = unlockedIds.has(def.id)
                const hovered = hoveredId === def.id
                return (
                  <div
                    key={def.id}
                    className="relative cursor-default overflow-visible rounded-2xl border-2 p-3 transition-all md:p-4"
                    style={{
                      background: unlocked ? def.color : "transparent",
                      borderStyle: unlocked ? "solid" : "dashed",
                      borderColor: unlocked ? "#001B21" : "rgba(0,27,33,.25)",
                      boxShadow: unlocked
                        ? hovered
                          ? "6px 6px 0 #001B21"
                          : "4px 4px 0 #001B21"
                        : "none",
                      transform:
                        hovered && unlocked ? "translateY(-3px)" : "none",
                    }}
                    onMouseEnter={() => setHoveredId(def.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div
                      style={{
                        opacity: unlocked ? 1 : 0.4,
                        filter: unlocked ? "none" : "grayscale(1)",
                      }}
                    >
                      {def.image ? (
                        <img
                          src={def.image}
                          alt={def.label}
                          className="h-10 w-10 object-contain"
                        />
                      ) : (
                        <p className="text-2xl">{def.icon}</p>
                      )}
                      <p className="mt-2 text-[12px] leading-tight font-bold text-ink">
                        {def.label}
                      </p>
                      <p className="mt-1 font-mono text-[10px] text-ink/50">
                        +{def.points} taškai
                      </p>
                    </div>
                    {hovered && (
                      <div className="absolute bottom-full left-1/2 z-50 mb-2 w-48 -translate-x-1/2 rounded-xl border-2 border-ink bg-paper px-3 py-2 shadow-[4px_4px_0_#001B21]">
                        <p className="text-[12px] font-bold text-ink">
                          {def.label}
                        </p>
                        <p className="mt-0.5 text-[11px] text-ink/60">
                          {def.description}
                        </p>
                        <p className="mt-1 font-mono text-[10px] text-ink/40">
                          +{def.points} taškai
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── page ───────────────────────────────────────────────────────────────────
export default function Account() {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const { subscriptions: dbPlans } = useSubscriptions()
  const { totalCredits, remainingCredits } = useCredits()
  const { achievements } = useAchievements()
  const tierOptions = useMemo(
    () =>
      dbPlans.map((p, i) => ({
        key: p.id as PlanTier,
        name: p.name,
        price: p.price,
        bg: p.bg_color,
        textColor: p.text_color,
        level: i + 1,
      })),
    [dbPlans]
  )
  const [subscriber, setSubscriber] = useState<SubscriberData | null>(null)
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set())
  const [postCount, setPostCount] = useState(0)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [planChanging, setPlanChanging] = useState(false)
  const [planChangeError, setPlanChangeError] = useState("")
  const [agreedToPlanChangeTerms, setAgreedToPlanChangeTerms] = useState(false)
  const [rentedOrders, setRentedOrders] = useState<RentedOrder[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [returnDialogOrder, setReturnDialogOrder] =
    useState<RentedOrder | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [penaltyHistory, setPenaltyHistory] = useState<
    Array<{
      id: string
      amount: number
      reason: string | null
      status: string
      created_at: string | null
      resolved_at: string | null
    }>
  >([])
  const [stripeInvoices, setStripeInvoices] = useState<
    Array<{
      id: string
      amount: number
      currency: string
      description: string
      date: number
      status: string | null
      pdf: string | null
    }>
  >([])
  const [billingLoading, setBillingLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState("")
  const [selectedTier, setSelectedTier] = useState(2)
  const [upgradeHomeDelivery, setUpgradeHomeDelivery] = useState(false)
  const [missingPartOrder, setMissingPartOrder] = useState<RentedOrder | null>(
    null
  )
  const [selectedAvatarId, setSelectedAvatarId] = useState(
    profile?.avatarId ?? 0
  )
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [giftCards, setGiftCards] = useState<
    Array<{
      id: string
      code: string
      amount_cents: number
      recipient_email: string
      buyer_email: string
      message: string | null
      status: string
      expires_at: string
      created_at: string
    }>
  >([])
  const [giftCardsLoading, setGiftCardsLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  async function payPenalty() {
    if (!user?.email || !subscriber?.penalty_amount) return
    const origin = window.location.origin
    const { data, error } = await supabase.functions.invoke(
      "create-penalty-checkout",
      {
        body: {
          userId: user.id,
          userEmail: user.email,
          amount: subscriber.penalty_amount,
          reason: subscriber.penalty_reason ?? undefined,
          successUrl: `${origin}/account?penalty_paid=true`,
          cancelUrl: `${origin}/account`,
        },
      }
    )
    if (error || !data?.url) {
      console.error("Penalty checkout failed:", error?.message)
      return
    }
    window.location.href = data.url
  }

  // handle Stripe penalty-paid redirect: ?penalty_paid=true
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    if (q.get("penalty_paid") !== "true" || !user?.email) return
    Promise.all([
      supabase
        .from("subscribers")
        .update({ penalty_amount: null, penalty_reason: null })
        .eq("id", user.id),
      supabase
        .from("subscriber_penalties")
        .update({ status: "paid", resolved_at: new Date().toISOString() })
        .eq("subscriber_email", user.email)
        .eq("status", "pending"),
    ]).then(() => {
      setSubscriber((s) =>
        s ? { ...s, penalty_amount: null, penalty_reason: null } : s
      )
      window.history.replaceState({}, "", "/account")
    })
  }, [user])

  // handle Stripe plan-change redirect: ?plan_changed=true&plan=xxx
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    if (q.get("plan_changed") !== "true" || !user) return
    const planKey = q.get("plan") as PlanTier | null
    if (!planKey) return
    const hasHomeDelivery = q.get("home_delivery") === "1"
    supabase
      .from("subscribers")
      .update({
        plan: planKey,
        status: "active",
        home_delivery: hasHomeDelivery,
      })
      .eq("id", user.id)
      .then(() => {
        setSubscriber((s) =>
          s ? { ...s, plan: planKey, home_delivery: hasHomeDelivery } : s
        )
        setShowUpgrade(false)
        window.history.replaceState({}, "", "/account")
      })
  }, [user])

  useEffect(() => {
    if (profile) setSelectedAvatarId(profile.avatarId)
  }, [profile])

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase
        .from("subscribers")
        .select(
          "plan, status, email, joined_at, penalty_amount, penalty_reason, name, last_name, phone, street, house_no, flat, city, postal_code, home_delivery"
        )
        .eq("id", user.id)
        .single(),
      supabase
        .from("user_achievements")
        .select("achievement_id")
        .eq("subscriber_id", user.id),
      supabase
        .from("feed_items")
        .select("id", { count: "exact" })
        .eq("subscriber_id", user.id)
        .is("parent_id", null),
    ]).then(([{ data: sub }, { data: ach }, { count }]) => {
      if (sub) {
        setSubscriber(sub as SubscriberData)
        const tierIdx = tierOptions.findIndex((t) => t.key === sub.plan)
        if (tierIdx >= 0) setSelectedTier(tierIdx)
      }
      if (ach)
        setUnlockedIds(
          new Set((ach as AchievementRecord[]).map((a) => a.achievement_id))
        )
      setPostCount(count ?? 0)
    })
  }, [user])

  useEffect(() => {
    const selected = tierOptions[selectedTier]

    if (selected?.key === subscriber?.plan) {
      setUpgradeHomeDelivery(subscriber?.home_delivery ?? false)
      return
    }

    setUpgradeHomeDelivery(false)
  }, [selectedTier, subscriber])

  useEffect(() => {
    if (!user?.email) return
    supabase
      .from("subscriber_penalties")
      .select("id, amount, reason, status, created_at, resolved_at")
      .eq("subscriber_email", user.email)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setPenaltyHistory(data)
      })

    setBillingLoading(true)
    supabase.functions
      .invoke("get-billing-history", {
        body: { userId: user.id, userEmail: user.email },
      })
      .then(({ data }) => {
        if (data?.invoices) setStripeInvoices(data.invoices)
        setBillingLoading(false)
      })
  }, [user])

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase
        .from("orders")
        .select("*")
        .eq("subscriber_id", user.id)
        .not("status", "eq", "returned"),
      supabase.from("products").select("id, title, image_url"),
    ]).then(([{ data: orders }, { data: products }]) => {
      const productMap = Object.fromEntries(
        (products ?? []).map((p) => [p.id, p])
      )
      setRentedOrders(
        (orders ?? []).map((o) => ({
          id: o.id,
          productId: o.product_id,
          productTitle:
            productMap[o.product_id]?.title ?? `Produktas #${o.product_id}`,
          productImage: productMap[o.product_id]?.image_url ?? null,
          status: o.status,
          startDate: o.start_date,
          dueDate: o.due_date,
          amount: o.amount,
          returnNote: (o as Record<string, unknown>).return_note as
            | string
            | undefined,
          homeDelivery: o.home_delivery ?? false,
          terminalName: o.lp_terminal_name,
          barcode: o.lp_barcode,
          returnBarcode: o.lp_return_barcode,
        }))
      )
      setOrdersLoading(false)
    })
  }, [user])

  useEffect(() => {
    if (!user?.email) return
    supabase
      .from("gift_cards")
      .select(
        "id, code, amount_cents, recipient_email, buyer_email, message, status, expires_at, created_at"
      )
      .or(`recipient_email.eq.${user.email},buyer_email.eq.${user.email}`)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setGiftCards((data as typeof giftCards) ?? [])
        setGiftCardsLoading(false)
      })
  }, [user])

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    })
  }

  const FALLBACK_TIER = {
    key: "" as PlanTier,
    name: "–",
    price: 0,
    bg: "#F5F1EB",
    textColor: "#001B21",
    level: 0,
  }
  const activeTier = subscriber
    ? (tierOptions.find((t) => t.key === subscriber.plan) ??
      tierOptions[0] ??
      FALLBACK_TIER)
    : (tierOptions[0] ?? FALLBACK_TIER)
  const activeAvatar = avatarOptions[selectedAvatarId] ?? avatarOptions[0]
  const totalPoints = calculatePoints(
    [...unlockedIds].map((id) => ({ achievementId: id, unlockedAt: "" })),
    achievements
  )
  const memberSince = subscriber?.joined_at
    ? new Date(subscriber.joined_at).toLocaleDateString("lt-LT", {
        year: "numeric",
        month: "long",
      })
    : "–"

  async function saveAvatar(id: number) {
    setSelectedAvatarId(id)
    setShowAvatarPicker(false)
    if (!user) return
    await supabase
      .from("subscribers")
      .update({ avatar_id: id, avatar_bg: avatarOptions[id].bg })
      .eq("id", user.id)
  }

  async function handlePlanChange() {
    if (!user) return
    const newTier = tierOptions[selectedTier] ?? FALLBACK_TIER
    const nextHomeDelivery = upgradeHomeDelivery
    if (newTier.key === subscriber?.plan) {
      setPlanChangeError("Jau esi šiame plane.")
      return
    }
    setPlanChanging(true)
    setPlanChangeError("")
    const origin = window.location.origin
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: {
        planKey: newTier.key,
        userId: user.id,
        userEmail: user.email ?? "",
        successUrl: `${origin}/account?plan_changed=true&plan=${newTier.key}${nextHomeDelivery ? "&home_delivery=1" : ""}`,
        cancelUrl: `${origin}/account`,
        homeDelivery: nextHomeDelivery,
      },
    })
    setPlanChanging(false)
    if (error || !data?.url) {
      setPlanChangeError(error?.message ?? "Nepavyko. Bandyk dar kartą.")
      return
    }
    window.location.href = data.url
  }

  async function openBillingPortal() {
    if (!user?.email) return
    setPortalLoading(true)
    setPortalError("")
    const { data, error } = await supabase.functions.invoke(
      "create-billing-portal",
      {
        body: {
          userId: user.id,
          userEmail: user.email,
          returnUrl: window.location.href,
        },
      }
    )
    setPortalLoading(false)
    if (error || !data?.url) {
      setPortalError(
        data?.error ?? error?.message ?? "Nepavyko atidaryti. Bandyk dar kartą."
      )
      return
    }
    window.location.href = data.url
  }

  // The return label + status change is handled server-side by the lpexpress
  // `create-return-label` action (via ReturnDialog). This just syncs local state.
  function onReturnComplete(orderId: string, barcode: string | null) {
    setRentedOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, status: "return_requested", returnBarcode: barcode }
          : o
      )
    )
  }

  const [downloadingLabel, setDownloadingLabel] = useState<string | null>(null)
  async function downloadReturnLabel(orderId: string) {
    setDownloadingLabel(orderId)
    try {
      const base64 = await fetchLabelPdf(orderId, "return")
      downloadPdf(base64, `grazinimo-etikete-${orderId.slice(0, 8)}.pdf`)
    } catch (e) {
      console.error("Return label download failed:", (e as Error).message)
    } finally {
      setDownloadingLabel(null)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-paper">
        <Nav />
        <div className="flex flex-col items-center justify-center gap-4 py-32">
          <p className="font-mono text-[14px] text-ink/50">
            Prisijunk norėdamas peržiūrėti paskyrą.
          </p>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper">
      <Seo title="Paskyra" path="/account" noindex />
      <Nav />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="bg-paper pt-6 pb-4">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* User tile */}
            <div className="flex min-h-[340px] flex-col rounded-2xl border-2 border-ink bg-paper p-6 shadow-[6px_6px_0_#001B21] md:rounded-3xl md:p-9 lg:col-span-7">
              <div className="flex items-start gap-5">
                <div className="shrink-0">
                  <button
                    onClick={() => setShowAvatarPicker((v) => !v)}
                    className="group relative size-[72px] overflow-hidden rounded-full border-2 border-ink/30 transition-all hover:scale-105 hover:border-ink/70"
                    style={{ background: activeAvatar.bg }}
                    aria-label="Keisti avataras"
                  >
                    <img
                      src={activeAvatar.src}
                      alt={activeAvatar.label}
                      className="h-full w-full object-cover object-top"
                    />
                    <span className="absolute inset-0 flex items-end justify-center rounded-full bg-ink/0 pb-1.5 transition-colors group-hover:bg-ink/40">
                      <span className="font-mono text-[8px] font-bold tracking-[.1em] text-ink uppercase opacity-0 transition-opacity group-hover:opacity-100">
                        Keisti
                      </span>
                    </span>
                  </button>
                </div>
                <div className="flex-1">
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <h1 className="heading-display text-d-lg leading-[.9] text-ink">
                      {[profile?.name, subscriber?.last_name]
                        .filter(Boolean)
                        .join(" ") || user.email?.split("@")[0]}
                    </h1>
                    <button
                      onClick={() => setProfileOpen(true)}
                      className="brick-hover-sm inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-paper px-4 py-1.5 font-mono text-[12px] font-bold text-ink transition-all"
                    >
                      Redaguoti profilį →
                    </button>
                  </div>
                  <p className="mt-1.5 text-[15px] text-ink/60">
                    {subscriber?.email ?? user.email}
                  </p>
                </div>
              </div>

              {showAvatarPicker && (
                <div className="mt-5 rounded-2xl border border-ink/15 bg-ink/5 p-4">
                  <p className="mb-3 font-mono text-[10px] tracking-[.18em] text-ink/40 uppercase">
                    Pasirink avataras
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {avatarOptions.map((av) => (
                      <button
                        key={av.id}
                        onClick={() => saveAvatar(av.id)}
                        className="flex flex-col items-center gap-1.5 transition-all"
                      >
                        <span
                          className={[
                            "size-14 overflow-hidden rounded-full border-2 transition-all",
                            selectedAvatarId === av.id
                              ? "scale-110 border-ink shadow-[0_0_0_3px_rgba(0,27,33,.2)]"
                              : "border-ink/20 hover:scale-105 hover:border-ink/60",
                          ].join(" ")}
                          style={{ background: av.bg, display: "block" }}
                        >
                          <img
                            src={av.src}
                            alt={av.label}
                            className="h-full w-full object-cover object-top"
                          />
                        </span>
                        <span className="font-mono text-[9px] tracking-[.1em] text-ink/50 uppercase">
                          {av.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                {[
                  { val: postCount, label: "Įrašai" },
                  {
                    val: `${activeTier.level}/${tierOptions.length || 5}`,
                    label: "Prenumeratos lygis",
                  },
                  { val: memberSince, label: "Narys nuo" },
                  { val: totalPoints, label: "Taškai" },
                  {
                    val: `${remainingCredits}/${totalCredits}`,
                    label: "Kreditai",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-3xl border border-ink/20 bg-paper p-4"
                  >
                    <div className="font-display text-[18px] leading-tight text-ink uppercase">
                      {s.val}
                    </div>
                    <div className="mt-1 font-mono text-[10px] tracking-[.14em] text-ink/50 uppercase">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={signOut}
                className="mt-4 self-start rounded-full border-2 border-ink bg-red-600 px-3 py-2 text-[14px] font-bold text-paper transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0_#001B21]"
              >
                Atsijungti →
              </button>
            </div>

            {/* Subscription tile */}
            <div
              className="brick-card flex flex-col p-6 md:min-h-[340px] md:p-9 lg:col-span-5"
              style={{ background: activeTier.bg }}
            >
              <div>
                <h2
                  className="text-d-xl mt-3 font-display leading-[.88] uppercase"
                  style={{ color: activeTier.textColor }}
                >
                  {activeTier.name}
                </h2>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span
                    className="text-d-sm font-display leading-none"
                    style={{ color: activeTier.textColor }}
                  >
                    €{activeTier.price}
                  </span>
                  <span
                    className="font-mono text-[12px] tracking-[.06em] uppercase"
                    style={{ color: `${activeTier.textColor}70` }}
                  >
                    /mėn.
                  </span>
                </div>
                <p
                  className="mt-3 text-[14px]"
                  style={{ color: `${activeTier.textColor}80` }}
                >
                  Statusas:{" "}
                  <b style={{ color: activeTier.textColor }}>
                    {subscriber?.status
                      ? (SUBSCRIBER_STATUS_LABELS[subscriber.status] ??
                        subscriber.status)
                      : "–"}
                  </b>
                </p>
              </div>

              <div className="mt-auto flex gap-3 pt-6 md:hidden">
                <button
                  className="flex-1 rounded-full border-2 border-ink bg-ink px-3 py-2 text-[14px] font-bold text-paper transition-all hover:opacity-80"
                  onClick={openBillingPortal}
                  disabled={portalLoading}
                >
                  Atšaukti
                </button>
                <button
                  className="flex-1 rounded-full border-2 border-ink bg-paper px-3 py-2 text-[14px] font-bold text-ink transition-all hover:bg-ink/5"
                  onClick={() => setShowUpgrade(!showUpgrade)}
                >
                  Keisti
                </button>
              </div>
              <div className="mt-auto hidden gap-2.5 md:flex">
                <button
                  className="flex-1 rounded-full border-2 border-ink bg-ink px-3 py-2 text-[14px] font-bold text-paper transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0_#001B21]"
                  onClick={() => setShowUpgrade(!showUpgrade)}
                >
                  Keisti prenumeratą
                </button>
                <button
                  className="flex-1 rounded-full border-2 border-ink bg-paper px-3 py-2 text-[14px] font-bold text-ink transition-all hover:bg-ink/5"
                  onClick={openBillingPortal}
                  disabled={portalLoading}
                >
                  Atšaukti
                </button>
              </div>
            </div>

            {/* Upgrade plan picker */}
            {showUpgrade && (
              <div className="brick-card bg-paper p-3 md:p-8 lg:col-span-12">
                <h3 className="label-mono mb-5 text-ink">Keisti prenumeratą</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {tierOptions.map((t, i) => (
                    <button
                      key={t.name}
                      onClick={() => setSelectedTier(i)}
                      className={[
                        "relative rounded-2xl border-2 p-3 text-left transition-all md:p-5",
                        selectedTier === i
                          ? "scale-[1.02] border-ink shadow-[4px_4px_0_#001B21]"
                          : "border-ink/30 hover:border-ink",
                      ].join(" ")}
                      style={{
                        background: selectedTier === i ? t.bg : "transparent",
                      }}
                    >
                      {t.key === subscriber?.plan && (
                        <span className="absolute -top-3 left-3 rounded-full border border-ink bg-ink px-2 py-0.5 font-mono text-[9px] tracking-[.1em] text-paper uppercase">
                          Dabartinis
                        </span>
                      )}
                      <div
                        className="font-display text-[16px] leading-tight sm:text-[18px] lg:text-[22px] lg:leading-none"
                        style={{
                          color: selectedTier === i ? t.textColor : "#001B21",
                        }}
                      >
                        {t.name}
                      </div>
                      <div
                        className="mt-1.5 font-mono text-[10px] tracking-[.06em] uppercase sm:text-[11px]"
                        style={{
                          color:
                            selectedTier === i
                              ? `${t.textColor}80`
                              : "#001B2180",
                        }}
                      >
                        €{t.price}/mėn.
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-5 flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    {[
                      {
                        value: false,
                        label: "Paštomatas",
                        note: "Nemokamas",
                      },
                      {
                        value: true,
                        label: "Pristatymas kurjeriu",
                        note:
                          tierOptions[selectedTier]?.key === "mega"
                            ? "Nemokamas"
                            : `+€${HOME_DELIVERY_FEE}/mėn.`,
                      },
                    ].map(({ value, label, note }) => (
                      <button
                        key={String(value)}
                        type="button"
                        onClick={() => setUpgradeHomeDelivery(value)}
                        className={[
                          "flex items-center justify-between rounded-2xl border-2 px-4 py-3 text-left transition-all",
                          upgradeHomeDelivery === value
                            ? "border-ink bg-ink/[.03] shadow-[3px_3px_0_#001B21]"
                            : "border-ink/15 hover:border-ink/40",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={[
                              "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                              upgradeHomeDelivery === value
                                ? "border-ink bg-ink"
                                : "border-ink/30",
                            ].join(" ")}
                          >
                            {upgradeHomeDelivery === value && (
                              <span className="size-2 rounded-full bg-paper" />
                            )}
                          </span>
                          <span className="font-semibold text-ink">
                            {label}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-ink/55">
                          {note}
                        </span>
                      </button>
                    ))}
                  </div>
                  {planChangeError && (
                    <p className="font-mono text-[11px] text-red-500">
                      {planChangeError}
                    </p>
                  )}
                  <TermsAgreement
                    id="terms-plan-change"
                    checked={agreedToPlanChangeTerms}
                    onCheckedChange={setAgreedToPlanChangeTerms}
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handlePlanChange}
                      disabled={planChanging || !agreedToPlanChangeTerms}
                      className="flex-1 rounded-full border-2 border-ink bg-ink px-5 py-2.5 text-[14px] font-bold text-paper transition-[transform,box-shadow] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0_#001B21] disabled:pointer-events-none disabled:opacity-50"
                    >
                      {planChanging
                        ? "Kraunama…"
                        : `Patvirtinti keitimą į ${tierOptions[selectedTier]?.name ?? "…"} →`}
                    </button>
                    <button
                      onClick={() => {
                        setShowUpgrade(false)
                        setPlanChangeError("")
                      }}
                      className="rounded-full border-2 border-ink px-5 py-2.5 text-[14px] font-semibold text-ink transition-colors hover:bg-ink/5"
                    >
                      Atšaukti
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Achievements ─────────────────────────────────────────────── */}
      <AchievementsSection
        unlockedIds={unlockedIds}
        totalPoints={totalPoints}
        achievements={achievements}
        userId={user?.id ?? ""}
      />

      {/* ── Penalty banner ───────────────────────────────────────────── */}
      {subscriber?.penalty_amount != null && (
        <section className="bg-paper py-10 md:py-20">
          <div className="mx-auto max-w-[1320px] px-4 md:px-7">
            <div className="brick-card flex flex-col gap-4 border-red-500 bg-red-50 p-5 shadow-[6px_6px_0_#ef4444] md:flex-row md:items-center md:justify-between md:p-7">
              <div className="flex flex-col gap-1">
                <p className="label-mono text-red-600">Nesumokėta bauda</p>
                <p className="text-d-sm font-display text-red-700">
                  €{subscriber.penalty_amount.toFixed(2)}
                </p>
                {subscriber.penalty_reason && (
                  <p className="mt-1 text-[14px] text-red-600/80">
                    {subscriber.penalty_reason}
                  </p>
                )}
              </div>
              <button
                onClick={payPenalty}
                className="brick-hover-sm self-start rounded-xl border-2 border-red-500 bg-red-500 px-6 py-3 font-semibold text-white transition-all hover:bg-red-600 md:self-auto"
              >
                Sumokėti baudą
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── Mano produktai ───────────────────────────────────────────── */}
      <section className="bg-paper py-10 md:py-20">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
          <h2 className="heading-display text-d-lg leading-[.9] tracking-[-0.02em] text-ink">
            Užsakymų
            <br />
            <span
              className="inline-block rotate-[-1.5deg] border-[3px] border-ink bg-brand-yellow px-[.12em] text-ink shadow-[5px_5px_0_rgba(0,27,33,.12)]"
              style={{ transformOrigin: "center center" }}
            >
              istorija.
            </span>
          </h2>

          {ordersLoading ? (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="brick-card min-h-[200px] animate-pulse bg-ink/5 p-5 md:p-6"
                />
              ))}
            </div>
          ) : rentedOrders.length === 0 ? (
            <div className="brick-card mt-6 flex flex-col items-center gap-3 bg-paper p-8 text-center md:p-12">
              <p className="font-display text-[18px] text-ink/40 uppercase">
                Neturi aktyvaus rinkinio
              </p>
              <p className="font-mono text-[12px] text-ink/30">
                Pasirink LEGO® rinkinį iš katalogo ir pradėk konstruoti.
              </p>
              <a
                href="/archive"
                className="mt-2 rounded-full border-2 border-ink bg-ink px-5 py-2.5 text-[13px] font-bold text-paper transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0_#001B21]"
              >
                Naršyti rinkinius →
              </a>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rentedOrders.map((order) => (
                <div
                  key={order.id}
                  className="brick-card flex flex-col bg-paper p-5 md:p-6"
                >
                  {order.productImage && (
                    <img
                      src={order.productImage}
                      alt={order.productTitle}
                      className="mb-4 h-28 w-full rounded-xl object-contain"
                    />
                  )}
                  <div className="font-display text-[20px] leading-tight text-ink uppercase">
                    {order.productTitle}
                  </div>
                  <div className="mt-2.5">
                    {order.status === "active" && (
                      <span className="inline-block rounded-full bg-green-100 px-2.5 py-1 font-mono text-[10px] tracking-[.16em] text-green-800 uppercase">
                        Prenumeruojama
                      </span>
                    )}
                    {order.status === "processing" && (
                      <span className="inline-block rounded-full bg-blue-100 px-2.5 py-1 font-mono text-[10px] tracking-[.16em] text-blue-800 uppercase">
                        Ruošiama
                      </span>
                    )}
                    {order.status === "overdue" && (
                      <span className="inline-block rounded-full bg-red-100 px-2.5 py-1 font-mono text-[10px] tracking-[.16em] text-red-800 uppercase">
                        Vėluoja
                      </span>
                    )}
                    {order.status === "return_requested" && (
                      <span className="inline-block rounded-full bg-amber-100 px-2.5 py-1 font-mono text-[10px] tracking-[.16em] text-amber-800 uppercase">
                        Grąžinimas prašomas
                      </span>
                    )}
                    {order.status === "return_declined" && (
                      <span className="inline-block rounded-full bg-rose-100 px-2.5 py-1 font-mono text-[10px] tracking-[.16em] text-rose-800 uppercase">
                        Grąžinimas atsisakytas
                      </span>
                    )}
                  </div>
                  {order.returnNote && order.status === "return_declined" && (
                    <div className="mt-3 rounded-xl border-l-2 border-rose-300 bg-rose-50 px-3 py-2">
                      <p className="font-mono text-[10px] tracking-[.14em] text-rose-500 uppercase">
                        Priežastis
                      </p>
                      <p className="mt-0.5 text-[13px] text-rose-700">
                        {order.returnNote}
                      </p>
                    </div>
                  )}
                  {/* Delivery method */}
                  <div className="mt-3 flex items-center gap-1.5 font-mono text-[11px] text-ink/50">
                    <span className="text-ink/30">↳</span>
                    {order.homeDelivery
                      ? "Pristatymas į duris"
                      : order.terminalName
                        ? `Paštomatas: ${order.terminalName}`
                        : "Paštomatas"}
                  </div>

                  {/* Live LP EXPRESS tracking — outbound, then return */}
                  {order.barcode && <OrderTracking barcode={order.barcode} />}
                  {order.returnBarcode && (
                    <div className="mt-2">
                      <p className="label-mono mb-1 text-ink/40">
                        Grąžinimo siunta
                      </p>
                      <OrderTracking barcode={order.returnBarcode} />
                    </div>
                  )}

                  <div className="mt-3 font-mono text-[11px] text-ink/40">
                    iki {order.dueDate} · €{order.amount}/mėn.
                  </div>
                  <div className="mt-auto pt-4">
                    {(order.status === "active" ||
                      order.status === "overdue" ||
                      order.status === "return_declined") && (
                      <button
                        onClick={() => setReturnDialogOrder(order)}
                        className="w-full rounded-full border-2 border-ink bg-ink px-4 py-2.5 text-[13px] font-bold text-paper transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0_#001B21]"
                      >
                        {order.status === "return_declined"
                          ? "Prašyti dar kartą"
                          : "Prašyti grąžinimo"}
                      </button>
                    )}
                    {(order.status === "active" ||
                      order.status === "overdue") && (
                      <button
                        onClick={() => setMissingPartOrder(order)}
                        className="mt-2 w-full rounded-full border-2 border-ink/30 bg-transparent px-4 py-2.5 text-[13px] font-bold text-ink/60 transition-all hover:border-ink hover:text-ink"
                      >
                        Pranešti apie trūkstamą detalę
                      </button>
                    )}
                    {order.status === "return_requested" &&
                      (order.returnBarcode ? (
                        <button
                          onClick={() => downloadReturnLabel(order.id)}
                          disabled={downloadingLabel === order.id}
                          className="w-full rounded-full border-2 border-ink bg-brand-orange px-4 py-2.5 text-[13px] font-bold text-paper transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0_#001B21] disabled:opacity-50"
                        >
                          {downloadingLabel === order.id
                            ? "Ruošiama…"
                            : "Atsisiųsti grąžinimo etiketę"}
                        </button>
                      ) : (
                        <div className="w-full rounded-full border-2 border-amber-300 bg-amber-50 px-4 py-2.5 text-center text-[13px] font-bold text-amber-700">
                          Grąžinimas prašomas
                        </div>
                      ))}
                    {order.status === "processing" && (
                      <div className="w-full rounded-full border-2 border-blue-200 bg-blue-50 px-4 py-2.5 text-center text-[13px] font-bold text-blue-700">
                        Ruošiama siuntai
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Mokėjimai ────────────────────────────────────────────────── */}
      <section className="bg-paper py-10 md:py-20">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
          <h2 className="heading-display text-d-lg leading-[.9] tracking-[-0.02em] text-ink">
            Mano
            <br />
            <span
              className="inline-block rotate-[-1.5deg] border-[3px] border-ink bg-brand-yellow px-[.12em] text-ink shadow-[5px_5px_0_rgba(0,27,33,.12)]"
              style={{ transformOrigin: "center center" }}
            >
              mokėjimai.
            </span>
          </h2>

          <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Current subscription card */}
            <div className="brick-card p-6 md:p-8 lg:col-span-5">
              <p className="label-mono text-ink/40">Aktyvi prenumerata</p>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-d-md font-display leading-none text-ink uppercase">
                    {activeTier.name}
                  </p>
                  <p className="mt-1 font-mono text-[13px] text-ink/60">
                    €{activeTier.price}/mėn. · kasmet atnaujinama
                  </p>
                </div>
                <span className="rounded-full border-2 border-ink bg-green-400 px-3 py-1 font-mono text-[10px] tracking-[.14em] text-ink uppercase">
                  {subscriber?.status ?? "–"}
                </span>
              </div>
              <div className="mt-6 flex flex-col gap-2 border-t border-ink/10 pt-5">
                {portalError && (
                  <p className="font-mono text-[11px] text-red-500">
                    {portalError}
                  </p>
                )}
                <button
                  onClick={openBillingPortal}
                  disabled={portalLoading}
                  className="brick-hover-sm w-full rounded-xl border-2 border-ink bg-ink px-4 py-3 font-mono text-[11px] tracking-[.14em] text-paper uppercase transition-all disabled:pointer-events-none disabled:opacity-50"
                >
                  {portalLoading ? "Kraunama…" : "Tvarkyti prenumeratą →"}
                </button>
                <p className="text-center font-mono text-[10px] text-ink/30">
                  Kortelė · istorija · atšaukimas
                </p>
              </div>
            </div>

            {/* Payment history */}
            <div className="brick-card p-6 md:p-8 lg:col-span-7">
              <p className="label-mono text-ink/40">Mokėjimų istorija</p>
              {billingLoading ? (
                <div className="mt-6 py-8 text-center">
                  <p className="font-mono text-[11px] text-ink/30">Kraunama…</p>
                </div>
              ) : stripeInvoices.length === 0 && penaltyHistory.length === 0 ? (
                <div className="mt-6 flex flex-col items-center justify-center py-8 text-center">
                  <p className="font-display text-[32px] leading-none text-ink/10 uppercase">
                    Tuščia
                  </p>
                  <p className="mt-2 font-mono text-[11px] text-ink/30">
                    Mokėjimų istorija bus rodoma čia
                  </p>
                </div>
              ) : (
                <div className="mt-4 flex flex-col divide-y divide-ink/8">
                  {stripeInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between py-3.5"
                    >
                      <div className="flex flex-col gap-0.5">
                        <p className="text-[14px] font-medium text-ink">
                          {inv.description}
                        </p>
                        <p className="font-mono text-[11px] text-ink/40">
                          {new Date(inv.date * 1000).toLocaleDateString(
                            "lt-LT",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-display text-[20px] leading-none text-ink">
                          {inv.currency.toUpperCase() === "EUR"
                            ? "€"
                            : inv.currency.toUpperCase()}
                          {inv.amount.toFixed(2)}
                        </span>
                        {inv.pdf ? (
                          <a
                            href={inv.pdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full border border-ink/20 px-2.5 py-0.5 font-mono text-[9px] tracking-[.12em] text-ink/50 uppercase transition-colors hover:border-ink hover:text-ink"
                          >
                            PDF
                          </a>
                        ) : (
                          <span className="rounded-full border border-green-400 bg-green-50 px-2.5 py-0.5 font-mono text-[9px] tracking-[.12em] text-green-600 uppercase">
                            Sumokėta
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {penaltyHistory.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between py-3.5"
                    >
                      <div className="flex flex-col gap-0.5">
                        <p className="text-[14px] font-medium text-ink">
                          {p.reason ?? "Bauda"}
                        </p>
                        <p className="font-mono text-[11px] text-ink/40">
                          {new Date(p.created_at ?? "").toLocaleDateString(
                            "lt-LT",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-display text-[20px] leading-none text-ink">
                          €{p.amount.toFixed(2)}
                        </span>
                        <span
                          className={[
                            "rounded-full border px-2.5 py-0.5 font-mono text-[9px] tracking-[.12em] uppercase",
                            p.status === "paid"
                              ? "border-green-400 bg-green-50 text-green-600"
                              : p.status === "forgiven"
                                ? "border-ink/20 bg-ink/5 text-ink/40"
                                : "border-red-400 bg-red-50 text-red-500",
                          ].join(" ")}
                        >
                          {p.status === "paid"
                            ? "Bauda sumokėta"
                            : p.status === "forgiven"
                              ? "Atleista"
                              : "Laukiama"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Gift Cards ───────────────────────────────────────────────── */}
      {(giftCardsLoading || giftCards.length > 0) && (
        <section className="bg-paper py-10 md:py-20">
          <div className="mx-auto max-w-[1320px] px-4 md:px-7">
            <h2 className="heading-display text-d-lg leading-[.9] tracking-[-0.02em] text-ink">
              Dovanų
              <br />
              <span
                className="inline-block rotate-[-1.5deg] border-[3px] border-ink bg-brand-yellow px-[.12em] text-ink shadow-[5px_5px_0_rgba(0,27,33,.12)]"
                style={{ transformOrigin: "center center" }}
              >
                kuponas.
              </span>
            </h2>

            <div className="mt-8">
              {giftCardsLoading ? (
                <div className="brick-card flex items-center justify-center py-10">
                  <p className="font-mono text-[11px] text-ink/30">Kraunama…</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {giftCards.map((gc) => {
                    const isBuyer = gc.buyer_email === user?.email
                    const isRecipient = gc.recipient_email === user?.email
                    const role =
                      isBuyer && isRecipient
                        ? "Nupirkta sau"
                        : isBuyer
                          ? "Nupirkta"
                          : "Gauta"
                    const isActive = gc.status === "active"
                    const isUsed = gc.status === "used"
                    const expires = new Date(gc.expires_at).toLocaleDateString(
                      "lt-LT",
                      { year: "numeric", month: "short", day: "numeric" }
                    )

                    return (
                      <div
                        key={gc.id}
                        className="brick-card flex flex-col gap-4 bg-paper p-5 sm:flex-row sm:items-center sm:justify-between md:p-6"
                      >
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2.5">
                            <span className="label-mono text-ink/40">
                              {role}
                            </span>
                            <span
                              className={[
                                "rounded-full border px-2.5 py-0.5 font-mono text-[9px] tracking-[.12em] uppercase",
                                isActive
                                  ? "border-green-400 bg-green-50 text-green-600"
                                  : isUsed
                                    ? "border-ink/20 bg-ink/5 text-ink/40"
                                    : "border-red-300 bg-red-50 text-red-400",
                              ].join(" ")}
                            >
                              {isActive
                                ? "Aktyvus"
                                : isUsed
                                  ? "Panaudotas"
                                  : "Pasibaigęs"}
                            </span>
                          </div>
                          <span className="font-mono text-[22px] font-bold tracking-[.1em] text-ink">
                            {gc.code}
                          </span>
                          <p className="font-mono text-[11px] text-ink/40">
                            €{gc.amount_cents / 100} · Galioja iki {expires}
                          </p>
                          {gc.message && (
                            <p className="mt-1 max-w-[40ch] text-[13px] text-ink/55 italic">
                              "{gc.message}"
                            </p>
                          )}
                        </div>

                        {isActive && (
                          <button
                            onClick={() => copyCode(gc.code)}
                            className="brick-hover-sm self-start rounded-xl border-2 border-ink px-4 py-2.5 font-mono text-[11px] font-bold tracking-[.1em] text-ink uppercase transition-all sm:self-auto"
                          >
                            {copiedCode === gc.code
                              ? "✓ Nukopijuota"
                              : "Kopijuoti kodą"}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <Footer />

      {missingPartOrder && user && (
        <MissingPartDialog
          open={missingPartOrder !== null}
          onOpenChange={(open) => {
            if (!open) setMissingPartOrder(null)
          }}
          orderId={missingPartOrder.id}
          productId={missingPartOrder.productId}
          productTitle={missingPartOrder.productTitle}
          subscriberId={user.id}
        />
      )}

      <ReturnDialog
        orderId={returnDialogOrder?.id ?? null}
        productTitle={returnDialogOrder?.productTitle}
        defaultName={
          [profile?.name, subscriber?.last_name].filter(Boolean).join(" ") ||
          user?.email?.split("@")[0] ||
          "Klientas"
        }
        defaultPhone={subscriber?.phone ?? ""}
        open={returnDialogOrder !== null}
        onOpenChange={(open) => {
          if (!open) setReturnDialogOrder(null)
        }}
        onComplete={onReturnComplete}
      />

      {user && (
        <ProfileEditDialog
          userId={user.id}
          email={subscriber?.email ?? user.email ?? ""}
          open={profileOpen}
          onOpenChange={setProfileOpen}
          initial={{
            name: profile?.name ?? "",
            last_name: subscriber?.last_name ?? "",
            phone: subscriber?.phone ?? "",
            street: subscriber?.street ?? "",
            house_no: subscriber?.house_no ?? "",
            flat: subscriber?.flat ?? "",
            city: subscriber?.city ?? "",
            postal_code: subscriber?.postal_code ?? "",
          }}
          onSaved={(vals) => {
            setSubscriber((s) => (s ? { ...s, ...vals } : s))
            refreshProfile()
          }}
        />
      )}
    </div>
  )
}
