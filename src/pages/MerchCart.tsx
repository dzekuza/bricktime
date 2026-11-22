import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { MinusIcon, PlusIcon, Trash2Icon } from "lucide-react"

import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { Seo } from "@/components/Seo"
import { Button } from "@/components/ui/button"
import { ImagePlaceholder } from "@/components/ImagePlaceholder"
import { VatNote } from "@/components/VatNote"
import { WalletCheckout } from "@/components/WalletCheckout"
import {
  MerchDiscountCode,
  type AppliedMerchCode,
} from "@/components/merch/MerchDiscountCode"
import {
  MerchDelivery,
  MERCH_COURIER_FEE,
  type MerchDeliveryMethod,
} from "@/components/merch/MerchDelivery"
import { MERCH_CART_MAX_QUANTITY } from "@/contexts/MerchCartContext"
import { useAuth } from "@/hooks/useAuth"
import { useMerchCart } from "@/hooks/useMerchCart"
import { useSavedTerminal } from "@/hooks/useSavedTerminal"
import { readFunctionError } from "@/lib/function-error"
import { supabase } from "@/lib/supabase"
import type { MerchItem } from "./Merch"

type CartRow = {
  itemId: string
  size: string
  quantity: number
  item: MerchItem | null
  maxQuantity: number
}

export default function MerchCart() {
  const { user } = useAuth()
  const { lines, setQuantity, removeLine } = useMerchCart()
  const [items, setItems] = useState<Record<string, MerchItem> | null>(null)
  const [deliveryMethod, setDeliveryMethod] =
    useState<MerchDeliveryMethod>("terminal")
  const [terminal, setTerminal] = useSavedTerminal()
  // A code is priced against the subtotal it was checked for; it is only
  // honoured while the subtotal is unchanged (see activeCode below).
  const [applied, setApplied] = useState<{
    code: AppliedMerchCode
    subtotalCents: number
  } | null>(null)
  const [buying, setBuying] = useState(false)
  const [buyError, setBuyError] = useState<string | null>(null)
  const [isWalletPending, setIsWalletPending] = useState(false)

  // Prices, status and stock come from the database, not from what the
  // browser stored when the line was added.
  const itemIdsKey = [...new Set(lines.map((l) => l.itemId))].sort().join(",")
  useEffect(() => {
    if (!itemIdsKey) {
      setItems({})
      return
    }
    let isCancelled = false
    supabase
      .from("merch_items")
      .select("*")
      .in("id", itemIdsKey.split(","))
      .then(({ data, error }) => {
        if (isCancelled) return
        if (error) console.error("Cart items lookup failed:", error.message)
        setItems(
          Object.fromEntries(
            ((data ?? []) as MerchItem[]).map((i) => [i.id, i])
          )
        )
      })
    return () => {
      isCancelled = true
    }
  }, [itemIdsKey])

  const rows: CartRow[] = useMemo(
    () =>
      lines.map((line) => {
        const item = items?.[line.itemId] ?? null
        const isSellable =
          item !== null &&
          item.status === "active" &&
          item.sizes.includes(line.size)
        // Checkout only accepts whole-number stock, so anything else is none.
        const rawStock = isSellable ? item.stock[line.size] : 0
        const stock = Number.isSafeInteger(rawStock) ? rawStock : 0
        return {
          ...line,
          item: isSellable ? item : null,
          maxQuantity: Math.min(stock, MERCH_CART_MAX_QUANTITY),
        }
      }),
    [lines, items]
  )

  // A line asking for more than is left is trimmed rather than left to fail
  // at payment.
  useEffect(() => {
    for (const row of rows) {
      if (row.item && row.maxQuantity >= 1 && row.quantity > row.maxQuantity) {
        setQuantity(row.itemId, row.size, row.maxQuantity)
      }
    }
  }, [rows, setQuantity])

  if (items === null) {
    return (
      <>
        <Seo title="Krepšelis" path="/merch/krepselis" noindex />
        <Nav />
        <div className="mx-auto max-w-[1320px] px-4 py-10 md:px-7">
          <div className="brick-card h-64 animate-pulse bg-ink/10" />
        </div>
        <Footer />
      </>
    )
  }

  const hasUnavailable = rows.some((r) => !r.item || r.maxQuantity < 1)
  const subtotalCents = rows.reduce(
    (sum, r) =>
      r.item ? sum + Math.round(Number(r.item.price) * 100) * r.quantity : sum,
    0
  )
  const activeCode =
    applied?.subtotalCents === subtotalCents ? applied.code : null
  const discountCents = Math.min(activeCode?.amountOffCents ?? 0, subtotalCents)
  const shippingCents =
    deliveryMethod === "courier" ? MERCH_COURIER_FEE * 100 : 0
  const totalCents = subtotalCents - discountCents + shippingCents
  const isDeliveryReady = deliveryMethod === "courier" || terminal !== null
  const canCheckout =
    rows.length > 0 && !hasUnavailable && isDeliveryReady && !buying

  const origin = window.location.origin
  const returnUrl = `${origin}/merch/aciu?session_id={CHECKOUT_SESSION_ID}&cart=1`
  const checkoutBody = {
    items: rows.map((r) => ({
      itemId: r.itemId,
      size: r.size,
      quantity: r.quantity,
    })),
    userEmail: user?.email ?? undefined,
    deliveryMethod,
    ...(deliveryMethod === "terminal" &&
      terminal && { terminal: { id: terminal.id, name: terminal.name } }),
    ...(activeCode && { code: activeCode.code }),
  }
  // A discount code or gift card is held while a session is open, so the
  // wallet button is only offered without one; those orders use the pay button.
  const canUseWallet = canCheckout && !activeCode
  const walletOrderKey = JSON.stringify(checkoutBody)

  async function createWalletSession(): Promise<string> {
    const { data, error } = await supabase.functions.invoke(
      "create-merch-checkout",
      { body: { ...checkoutBody, uiMode: "elements", returnUrl } }
    )
    if (error || !data?.clientSecret) {
      throw new Error(await readFunctionError(error, "Wallet checkout failed"))
    }
    return data.clientSecret
  }

  async function handleCheckout() {
    if (!canCheckout || isWalletPending) return
    setBuying(true)
    setBuyError(null)
    const { data, error } = await supabase.functions.invoke(
      "create-merch-checkout",
      {
        body: {
          ...checkoutBody,
          successUrl: returnUrl,
          cancelUrl: `${origin}/merch/krepselis`,
        },
      }
    )
    if (error || !data?.url) {
      setBuyError(
        await readFunctionError(
          error,
          "Mokėjimo nepavyko pradėti. Bandyk dar kartą."
        )
      )
      setBuying(false)
      return
    }
    window.location.href = data.url
  }

  return (
    <>
      <Seo title="Krepšelis" path="/merch/krepselis" noindex />
      <Nav />

      <section className="bg-paper py-4 md:py-8">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
          <h1 className="heading-display text-d-lg mb-6 text-ink md:mb-8">
            Krepšelis
          </h1>

          {rows.length === 0 ? (
            <div className="brick-card flex flex-col items-start gap-4 p-6 md:p-8">
              <p className="text-[16px] text-ink/75">Krepšelis tuščias.</p>
              <Button asChild size="lg">
                <Link to="/merch">Į merch parduotuvę</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.4fr_1fr]">
              <ul className="flex flex-col gap-4">
                {rows.map((row) => (
                  <CartLine
                    key={`${row.itemId}|${row.size}`}
                    row={row}
                    onQuantity={(q) => setQuantity(row.itemId, row.size, q)}
                    onRemove={() => removeLine(row.itemId, row.size)}
                  />
                ))}
              </ul>

              <div className="brick-card bg-paper p-6 md:p-8">
                <h2 className="heading-display text-d-sm text-ink">
                  Užsakymo suvestinė
                </h2>

                <MerchDelivery
                  method={deliveryMethod}
                  onMethodChange={setDeliveryMethod}
                  terminal={terminal}
                  onTerminalChange={setTerminal}
                />
                <MerchDiscountCode
                  priceCents={subtotalCents}
                  applied={activeCode}
                  onApply={(code) => {
                    setApplied({ code, subtotalCents })
                    setBuyError(null)
                  }}
                  onClear={() => setApplied(null)}
                />

                <dl className="mt-6 flex flex-col gap-2 border-t-2 border-ink/10 pt-5 font-mono text-[13px] text-ink">
                  <Total label="Prekės" cents={subtotalCents} />
                  {discountCents > 0 && (
                    <Total label="Nuolaida" cents={-discountCents} />
                  )}
                  {shippingCents > 0 && (
                    <Total label="Pristatymas" cents={shippingCents} />
                  )}
                  <div className="flex items-center justify-between border-t-2 border-ink/10 pt-3 text-[16px] font-bold">
                    <dt>Iš viso</dt>
                    <dd>€{(totalCents / 100).toFixed(2)}</dd>
                  </div>
                </dl>
                <VatNote className="mt-2" />

                {canUseWallet && (
                  <WalletCheckout
                    orderKey={walletOrderKey}
                    createSession={createWalletSession}
                    onError={setBuyError}
                    onPendingChange={setIsWalletPending}
                  />
                )}

                <Button
                  size="lg"
                  disabled={!canCheckout || isWalletPending}
                  onClick={handleCheckout}
                  className="mt-5 w-full justify-center rounded-full border-2 border-ink bg-ink text-[16px] font-bold text-paper transition-all hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[6px_6px_0_rgba(0,27,33,.35)] disabled:opacity-40"
                >
                  {buying
                    ? "Kraunama…"
                    : hasUnavailable
                      ? "Pašalink neprieinamas prekes"
                      : !isDeliveryReady
                        ? "Pasirink paštomatą"
                        : `Apmokėti — €${(totalCents / 100).toFixed(2)} →`}
                </Button>
                {buyError && (
                  <p className="mt-2 font-mono text-[12px] text-red-500">
                    {buyError}
                  </p>
                )}
              </div>
            </div>
          )}

          <Link
            to="/merch"
            className="label-mono mt-6 inline-flex items-center gap-1.5 text-ink/40 transition-colors hover:text-ink"
          >
            ← Tęsti apsipirkimą
          </Link>
        </div>
      </section>

      <Footer />
    </>
  )
}

function Total({ label, cents }: { label: string; cents: number }) {
  const sign = cents < 0 ? "−" : ""
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink/60">{label}</dt>
      <dd>
        {sign}€{(Math.abs(cents) / 100).toFixed(2)}
      </dd>
    </div>
  )
}

type CartLineProps = {
  row: CartRow
  onQuantity: (quantity: number) => void
  onRemove: () => void
}

function CartLine({ row, onQuantity, onRemove }: CartLineProps) {
  const { item, size, quantity, maxQuantity } = row
  const isUnavailable = !item || maxQuantity < 1
  const unitCents = item ? Math.round(Number(item.price) * 100) : 0

  return (
    <li className="brick-card flex items-center gap-4 bg-paper p-4 md:p-5">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl border-2 border-ink bg-white md:size-24">
        {item?.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="absolute inset-0 h-full w-full object-contain p-2"
          />
        ) : (
          <ImagePlaceholder />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {item ? (
          <Link
            to={`/merch/${item.slug}`}
            className="heading-display text-d-xs truncate text-ink hover:underline"
          >
            {item.name}
          </Link>
        ) : (
          <p className="heading-display text-d-xs text-ink/50">
            Prekė nebeprieinama
          </p>
        )}
        <p className="label-mono text-ink/50">Dydis: {size}</p>
        {isUnavailable ? (
          <p className="font-mono text-[12px] text-red-500">
            {item ? "Šio dydžio nebėra." : "Šios prekės nebegalima įsigyti."}
          </p>
        ) : (
          <div className="mt-1 flex items-center gap-2">
            <QtyButton
              label="Mažinti kiekį"
              disabled={quantity <= 1}
              onClick={() => onQuantity(quantity - 1)}
            >
              <MinusIcon className="size-4" />
            </QtyButton>
            <span className="min-w-6 text-center font-mono text-[14px] font-bold text-ink">
              {quantity}
            </span>
            <QtyButton
              label="Didinti kiekį"
              disabled={quantity >= maxQuantity}
              onClick={() => onQuantity(quantity + 1)}
            >
              <PlusIcon className="size-4" />
            </QtyButton>
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-3">
        {!isUnavailable && (
          <p className="font-mono text-[16px] font-bold text-ink">
            €{((unitCents * quantity) / 100).toFixed(2)}
          </p>
        )}
        <button
          type="button"
          onClick={onRemove}
          aria-label="Pašalinti iš krepšelio"
          className="text-ink/40 transition-colors hover:text-ink"
        >
          <Trash2Icon className="size-5" />
        </button>
      </div>
    </li>
  )
}

type QtyButtonProps = {
  label: string
  disabled: boolean
  onClick: () => void
  children: ReactNode
}

function QtyButton({ label, disabled, onClick, children }: QtyButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-full border-2 border-ink text-ink transition-colors hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  )
}
