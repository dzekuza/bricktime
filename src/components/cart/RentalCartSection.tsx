import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ImagePlaceholder } from "@/components/ImagePlaceholder"
import { BricksBudgetBar } from "@/components/rental/BricksBudgetBar"
import { TerminalPicker } from "@/components/TerminalPicker"
import { useAuth } from "@/hooks/useAuth"
import { CreditsResetNotice } from "@/components/CreditsResetNotice"
import { useCredits } from "@/hooks/useCredits"
import { usePaidCourierReturn } from "@/hooks/usePaidCourierReturn"
import { useProductAvailability } from "@/hooks/useProductAvailability"
import { useRentalCart } from "@/hooks/useRentalCart"
import { useSavedTerminal } from "@/hooks/useSavedTerminal"
import { readFunctionError } from "@/lib/function-error"
import { RENTAL_COURIER_FEE, toRentalErrorMessage } from "@/lib/rental"
import { supabase } from "@/lib/supabase"

type CartProduct = {
  id: number
  title: string
  image_url: string | null
  value: number | null
  allowed_tiers: string[]
  status: string
}

type RowProblem = "missing" | "tier" | "taken" | null

/** The sets half of the cart page: claims sets within the Briksiai budget. */
export function RentalCartSection() {
  const { user, profile } = useAuth()
  const { productIds, remove, clear } = useRentalCart()
  const { remainingCredits, usedCredits } = useCredits()
  const { available } = useProductAvailability()
  const [terminal, setTerminal] = useSavedTerminal()
  const [products, setProducts] = useState<Record<number, CartProduct> | null>(
    null
  )
  // The door-delivery add-on on the subscription; Legenda includes door
  // delivery without it (see isDoorInPlan below).
  const [hasDoorAddon, setHasDoorAddon] = useState(false)
  const [isDoor, setIsDoor] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimError, setClaimError] = useState<string | null>(null)
  const [placedCount, setPlacedCount] = useState<number | null>(null)

  const plan = profile?.plan ?? null
  const isActive = profile?.status === "active"
  const isDoorInPlan = plan === "mega" || hasDoorAddon

  // Back from Stripe after the courier fee: the webhook creates the rentals,
  // so wait for the first order to appear (see usePaidCourierReturn).
  const [params] = useSearchParams()
  const returnSessionId =
    params.get("courier_paid") === "true" ? params.get("session_id") : null
  const paidReturn = usePaidCourierReturn(user?.id, returnSessionId)
  // The sets this payment covered travel in the return URL, so only those are
  // taken out of the cart: a refreshed or old success link can't empty sets
  // added since.
  const paidSets = params.get("sets")
  useEffect(() => {
    if (paidReturn !== "placed" || placedCount !== null) return
    const ids = (paidSets ?? "")
      .split(",")
      .map(Number)
      .filter(Number.isSafeInteger)
    ids.forEach(remove)
    setPlacedCount(ids.length)
  }, [paidReturn, placedCount, paidSets, remove])

  const idsKey = [...productIds].sort((a, b) => a - b).join(",")
  useEffect(() => {
    if (!idsKey) {
      setProducts({})
      return
    }
    let isCancelled = false
    supabase
      .from("products")
      .select("id, title, image_url, value, allowed_tiers, status")
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
      .then(({ data }) => setHasDoorAddon(data?.home_delivery === true))
  }, [user])

  const rows = useMemo(
    () =>
      productIds.map((id) => {
        const product = products?.[id] ?? null
        let problem: RowProblem = null
        if (!product) problem = "missing"
        else if (!plan || !product.allowed_tiers.includes(plan))
          problem = "tier"
        else if (product.status === "sold_out" || available.get(id) === 0)
          problem = "taken"
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

  if (paidReturn === "waiting") {
    return (
      <Shell>
        <div className="brick-card flex flex-col gap-3 p-6 md:p-8">
          <h2 className="heading-display text-d-md text-ink">
            Tvirtiname mokėjimą…
          </h2>
          <p className="text-[16px] text-ink/75">
            Kuriame tavo užsakymus, tai užtrunka kelias sekundes.
          </p>
        </div>
      </Shell>
    )
  }

  if (paidReturn === "missing") {
    return (
      <Shell>
        <div className="brick-card flex flex-col gap-3 p-6 md:p-8">
          <h2 className="heading-display text-d-md text-ink">
            Užsakymo dar nematome
          </h2>
          <p className="text-[16px] text-ink/75">
            Jei mokėjimas praėjo, o užsakymų paskyroje nėra, rinkiniai galėjo
            būti išnuomoti kitam nariui – tuomet mokestį grąžiname automatiškai.
            Kilus klausimų, susisiek su mumis.
          </p>
          <Button asChild size="lg" className="w-fit">
            <Link to="/paskyra">Į paskyrą</Link>
          </Button>
        </div>
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
            <Link to="/paskyra">Į paskyrą</Link>
          </Button>
        </div>
      </Shell>
    )
  }

  const totalValue = rows.reduce((sum, r) => sum + (r.product?.value ?? 0), 0)
  const isOverBudget = totalValue > remainingCredits
  const hasProblem = rows.some((r) => r.problem !== null)
  const isDeliveryReady = isDoor || terminal !== null
  // One fee covers the whole parcel; plans with door delivery pay nothing.
  const isCourierFeeDue = isDoor && !isDoorInPlan
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

    if (isCourierFeeDue) {
      const origin = window.location.origin
      const { data, error: checkoutError } = await supabase.functions.invoke(
        "create-rental-courier-checkout",
        {
          body: {
            productIds: rows.map((r) => r.id),
            successUrl: `${origin}/krepselis?courier_paid=true&session_id={CHECKOUT_SESSION_ID}&sets=${rows.map((r) => r.id).join(",")}`,
            cancelUrl: `${origin}/krepselis`,
          },
        }
      )
      if (checkoutError || !data?.url) {
        setIsClaiming(false)
        setClaimError(
          toRentalErrorMessage(await readFunctionError(checkoutError, ""))
        )
        return
      }
      window.location.assign(data.url)
      return
    }

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
          <p className="text-[16px] text-ink/75">Rinkinių krepšelis tuščias.</p>
          <Button asChild size="lg">
            <Link to="/rinkiniai">Žiūrėti rinkinius</Link>
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
                    to={`/rinkinys/${row.id}`}
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
                <Link to="/prenumerata" className="font-bold underline">
                  Pasirink planą →
                </Link>
              </p>
            ) : (
              <>
                <BricksBudgetBar
                  cartValue={totalValue}
                  remaining={remainingCredits}
                />
                {isOverBudget && (
                  <CreditsResetNotice
                    usedCredits={usedCredits}
                    className="mt-3 text-[13px] font-bold text-ink/70"
                  />
                )}
                {isOverBudget && plan !== "mega" && (
                  <Link
                    to="/prenumerata"
                    className="brick-hover-sm mt-4 flex h-11 w-full items-center justify-center rounded-full border-2 border-ink bg-brand-orange px-4 text-[14px] font-bold text-paper transition-all"
                  >
                    Pasirink didesnį planą →
                  </Link>
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
                  <DeliveryOption
                    label="Pristatymas kurjeriu"
                    note={
                      isDoorInPlan
                        ? "Įskaičiuota"
                        : `+€${RENTAL_COURIER_FEE} visam krepšeliui`
                    }
                    isSelected={isDoor}
                    onSelect={() => setIsDoor(true)}
                  />
                </div>
                {!isDoor && (
                  <div className="mt-4">
                    <TerminalPicker value={terminal} onChange={setTerminal} />
                  </div>
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
                        : isCourierFeeDue
                          ? `Apmokėti €${RENTAL_COURIER_FEE} ir nuomotis ${rows.length} →`
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
    <section aria-labelledby="cart-sets-heading">
      <h2
        id="cart-sets-heading"
        className="heading-display text-d-md mb-4 text-ink md:mb-6"
      >
        Rinkiniai
      </h2>
      {children}
      <Link
        to="/rinkiniai"
        className="label-mono mt-6 inline-flex items-center gap-1.5 text-ink/40 transition-colors hover:text-ink"
      >
        ← Visi rinkiniai
      </Link>
    </section>
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
