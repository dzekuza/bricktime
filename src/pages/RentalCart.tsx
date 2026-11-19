import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { Trash2Icon } from "lucide-react"

import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { Seo } from "@/components/Seo"
import { Button } from "@/components/ui/button"
import { ImagePlaceholder } from "@/components/ImagePlaceholder"
import { TerminalPicker } from "@/components/TerminalPicker"
import { useAuth } from "@/hooks/useAuth"
import { useCredits } from "@/hooks/useCredits"
import { useProductAvailability } from "@/hooks/useProductAvailability"
import { useRentalCart } from "@/hooks/useRentalCart"
import { useSavedTerminal } from "@/hooks/useSavedTerminal"
import { toRentalErrorMessage } from "@/lib/rental"
import { supabase } from "@/lib/supabase"

type CartProduct = {
  id: number
  title: string
  image_url: string | null
  value: number | null
  allowed_tiers: string[]
}

type RowProblem = "missing" | "tier" | "taken" | null

export default function RentalCart() {
  const { user, profile } = useAuth()
  const { productIds, remove, clear } = useRentalCart()
  const { remainingCredits } = useCredits()
  const { available } = useProductAvailability()
  const [terminal, setTerminal] = useSavedTerminal()
  const [products, setProducts] = useState<Record<number, CartProduct> | null>(
    null
  )
  const [isDoorInPlan, setIsDoorInPlan] = useState(false)
  const [isDoor, setIsDoor] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimError, setClaimError] = useState<string | null>(null)
  const [placedCount, setPlacedCount] = useState<number | null>(null)

  const plan = profile?.plan ?? null
  const isActive = profile?.status === "active"

  const idsKey = [...productIds].sort((a, b) => a - b).join(",")
  useEffect(() => {
    if (!idsKey) {
      setProducts({})
      return
    }
    let isCancelled = false
    supabase
      .from("products")
      .select("id, title, image_url, value, allowed_tiers")
      .in("id", idsKey.split(",").map(Number))
      .then(({ data, error }) => {
        if (isCancelled) return
        if (error) console.error("Cart sets lookup failed:", error.message)
        setProducts(
          Object.fromEntries(
            ((data ?? []) as CartProduct[]).map((p) => [p.id, p])
          )
        )
      })
    return () => {
      isCancelled = true
    }
  }, [idsKey])

  useEffect(() => {
    if (!user) return
    supabase
      .from("subscribers")
      .select("home_delivery")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setIsDoorInPlan(data?.home_delivery === true))
  }, [user])

  const rows = useMemo(
    () =>
      productIds.map((id) => {
        const product = products?.[id] ?? null
        let problem: RowProblem = null
        if (!product) problem = "missing"
        else if (!plan || !product.allowed_tiers.includes(plan))
          problem = "tier"
        else if (available.get(id) === 0) problem = "taken"
        return { id, product, problem }
      }),
    [productIds, products, plan, available]
  )

  if (products === null) {
    return (
      <Shell>
        <div className="brick-card h-64 animate-pulse bg-ink/10" />
      </Shell>
    )
  }

  if (placedCount !== null) {
    return (
      <Shell>
        <div className="brick-card flex flex-col gap-4 bg-brand-mint p-6 md:p-8">
          <h2 className="heading-display text-d-md text-ink">
            Ačiū! Užsakyta rinkinių: {placedCount}
          </h2>
          <p className="text-[16px] text-ink/75">
            Rinkinius paruošime ir išsiųsime kartu. Užsakymus matysi paskyroje.
          </p>
          <Button asChild size="lg" className="w-fit">
            <Link to="/account">Į paskyrą</Link>
          </Button>
        </div>
      </Shell>
    )
  }

  const totalValue = rows.reduce((sum, r) => sum + (r.product?.value ?? 0), 0)
  const isOverBudget = totalValue > remainingCredits
  const hasProblem = rows.some((r) => r.problem !== null)
  const isDeliveryReady = isDoor || terminal !== null
  const canClaim =
    Boolean(user) &&
    isActive &&
    rows.length > 0 &&
    !hasProblem &&
    !isOverBudget &&
    isDeliveryReady &&
    !isClaiming

  async function handleClaim() {
    if (!canClaim) return
    setClaimError(null)
    setIsClaiming(true)
    const { error } = await supabase.rpc("claim_rentals", {
      p_product_ids: rows.map((r) => r.id),
      p_home_delivery: isDoor,
      ...(!isDoor && terminal
        ? { p_terminal_id: terminal.id, p_terminal_name: terminal.name }
        : {}),
    })
    setIsClaiming(false)
    if (error) {
      console.error("claim_rentals failed:", error.message)
      setClaimError(toRentalErrorMessage(error.message))
      return
    }
    setPlacedCount(rows.length)
    clear()
  }

  return (
    <Shell>
      {rows.length === 0 ? (
        <div className="brick-card flex flex-col items-start gap-4 p-6 md:p-8">
          <p className="text-[16px] text-ink/75">Krepšelis tuščias.</p>
          <Button asChild size="lg">
            <Link to="/archive">Žiūrėti rinkinius</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.4fr_1fr]">
          <ul className="flex flex-col gap-4">
            {rows.map((row) => (
              <li
                key={row.id}
                className="brick-card flex items-center gap-4 bg-paper p-4 md:p-5"
              >
                <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl border-2 border-ink bg-white md:size-24">
                  {row.product?.image_url ? (
                    <img
                      src={row.product.image_url}
                      alt={row.product.title}
                      className="absolute inset-0 h-full w-full object-contain p-2"
                    />
                  ) : (
                    <ImagePlaceholder />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Link
                    to={`/drop/${row.id}`}
                    className="heading-display text-d-xs text-ink hover:underline"
                  >
                    {row.product?.title ?? "Rinkinys nebeprieinamas"}
                  </Link>
                  <p className="label-mono text-ink/50">
                    {row.product?.value ?? 0} Briksių
                  </p>
                  {row.problem && (
                    <p className="font-mono text-[12px] text-red-500">
                      {PROBLEM_TEXT[row.problem]}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => remove(row.id)}
                  aria-label="Pašalinti iš krepšelio"
                  className="shrink-0 text-ink/40 transition-colors hover:text-ink"
                >
                  <Trash2Icon className="size-5" />
                </button>
              </li>
            ))}
          </ul>

          <div className="brick-card bg-paper p-6 md:p-8">
            <h2 className="heading-display text-d-sm text-ink">Suvestinė</h2>

            {!user || !isActive ? (
              <p className="mt-4 text-[15px] text-ink/75">
                Norint nuomotis reikia aktyvios prenumeratos.{" "}
                <Link to="/subscribe" className="font-bold underline">
                  Pasirink planą →
                </Link>
              </p>
            ) : (
              <>
                <dl className="mt-5 flex flex-col gap-2 font-mono text-[13px] text-ink">
                  <Line
                    label="Rinkinių vertė"
                    value={`${totalValue} Briksių`}
                  />
                  <Line
                    label="Liko Briksių"
                    value={`${remainingCredits}`}
                    isWarning={isOverBudget}
                  />
                </dl>
                {isOverBudget && (
                  <p className="mt-2 font-mono text-[12px] text-red-500">
                    Rinkinių vertė viršija likusį biudžetą. Pašalink bent vieną.
                  </p>
                )}

                <p className="label-mono mt-6 mb-2 text-ink/50">
                  Pristatymo būdas
                </p>
                <div className="flex flex-col gap-2">
                  <DeliveryOption
                    label="Paštomatas"
                    note="Nemokamas"
                    isSelected={!isDoor}
                    onSelect={() => setIsDoor(false)}
                  />
                  {isDoorInPlan && (
                    <DeliveryOption
                      label="Pristatymas į duris"
                      note="Įskaičiuota"
                      isSelected={isDoor}
                      onSelect={() => setIsDoor(true)}
                    />
                  )}
                </div>
                {!isDoor && (
                  <div className="mt-4">
                    <TerminalPicker value={terminal} onChange={setTerminal} />
                  </div>
                )}
                {!isDoorInPlan && (
                  <p className="mt-3 text-[13px] text-ink/55">
                    Pristatymą kurjeriu mokant po €3 pasirink rinkinius po
                    vieną.
                  </p>
                )}

                <Button
                  size="lg"
                  disabled={!canClaim}
                  onClick={handleClaim}
                  className="mt-6 w-full justify-center rounded-full border-2 border-ink bg-ink text-[16px] font-bold text-paper transition-all hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[6px_6px_0_rgba(0,27,33,.35)] disabled:opacity-40"
                >
                  {isClaiming
                    ? "Kraunama…"
                    : hasProblem
                      ? "Pašalink neprieinamus rinkinius"
                      : !isDeliveryReady
                        ? "Pasirink paštomatą"
                        : `Nuomotis ${rows.length} →`}
                </Button>
                {claimError && (
                  <p className="mt-2 font-mono text-[12px] text-red-500">
                    {claimError}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </Shell>
  )
}

const PROBLEM_TEXT: Record<Exclude<RowProblem, null>, string> = {
  missing: "Šio rinkinio nebėra.",
  tier: "Tavo prenumerata neapima šio rinkinio.",
  taken: "Šiuo metu išnuomotas kitam nariui.",
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <>
      <Seo title="Rinkinių krepšelis" path="/rinkiniai/krepselis" noindex />
      <Nav />
      <section className="bg-paper py-4 md:py-8">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
          <h1 className="heading-display text-d-lg mb-6 text-ink md:mb-8">
            Rinkinių krepšelis
          </h1>
          {children}
          <Link
            to="/archive"
            className="label-mono mt-6 inline-flex items-center gap-1.5 text-ink/40 transition-colors hover:text-ink"
          >
            ← Visi rinkiniai
          </Link>
        </div>
      </section>
      <Footer />
    </>
  )
}

function Line({
  label,
  value,
  isWarning = false,
}: {
  label: string
  value: string
  isWarning?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink/60">{label}</dt>
      <dd className={isWarning ? "font-bold text-red-500" : "font-bold"}>
        {value}
      </dd>
    </div>
  )
}

type DeliveryOptionProps = {
  label: string
  note: string
  isSelected: boolean
  onSelect: () => void
}

function DeliveryOption({
  label,
  note,
  isSelected,
  onSelect,
}: DeliveryOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={[
        "flex items-center justify-between rounded-2xl border-2 px-4 py-3 text-left transition-all",
        isSelected
          ? "border-ink bg-ink/[.03] shadow-[3px_3px_0_#001B21]"
          : "border-ink/15 hover:border-ink/40",
      ].join(" ")}
    >
      <span className="font-semibold text-ink">{label}</span>
      <span className="font-mono text-[11px] text-ink/55">{note}</span>
    </button>
  )
}
