import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"

import Nav from "@/components/Nav"
import { useBreadcrumbLabel } from "@/contexts/BreadcrumbContext"
import Footer from "@/components/Footer"
import { Seo } from "@/components/Seo"
import { Button } from "@/components/ui/button"
import { ImagePlaceholder } from "@/components/ImagePlaceholder"
import { supabase } from "@/lib/supabase"

interface MerchOrderSummary {
  order_number: number
  item_name: string
  size: string
  amount: number
  buyer_email: string | null
  buyer_name: string | null
  shipping_address: ShippingAddress | null
  image_url: string | null
  item_slug: string | null
}

interface ShippingAddress {
  line1?: string | null
  line2?: string | null
  postal_code?: string | null
  city?: string | null
  country?: string | null
}

// The webhook usually lands within a second or two of Stripe's redirect, so
// poll briefly instead of failing on the first empty lookup.
const POLL_ATTEMPTS = 8
const POLL_INTERVAL_MS = 1500

type LoadState = "loading" | "found" | "pending" | "missing"

export default function MerchThankYou() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const { setLabel } = useBreadcrumbLabel()
  const [order, setOrder] = useState<MerchOrderSummary | null>(null)
  const [state, setState] = useState<LoadState>(
    sessionId ? "loading" : "missing"
  )

  useEffect(() => {
    setLabel("Užsakymas")
  }, [setLabel])

  useEffect(() => {
    if (!sessionId) return
    let isCancelled = false

    async function poll(attempt: number) {
      const { data, error } = await supabase.rpc("get_merch_order_by_session", {
        p_session_id: sessionId as string,
      })
      if (isCancelled) return
      if (error) console.error("Merch order lookup failed:", error.message)
      const row = data?.[0]
      if (row) {
        setOrder(row as MerchOrderSummary)
        setState("found")
        return
      }
      if (attempt + 1 >= POLL_ATTEMPTS) {
        setState("pending")
        return
      }
      setTimeout(() => void poll(attempt + 1), POLL_INTERVAL_MS)
    }

    void poll(0)
    return () => {
      isCancelled = true
    }
  }, [sessionId])

  return (
    <>
      <Seo title="Ačiū už užsakymą" path="/merch/aciu" noindex />
      <Nav />

      <section className="bg-paper py-6 md:py-12">
        <div className="mx-auto max-w-[760px] px-4 md:px-7">
          {state === "loading" && <LoadingCard />}
          {state === "found" && order && <OrderCard order={order} />}
          {state === "pending" && <PendingCard />}
          {state === "missing" && <MissingCard />}
        </div>
      </section>

      <Footer />
    </>
  )
}

function LoadingCard() {
  return (
    <div className="brick-card flex flex-col gap-4 p-6 md:p-8">
      <div className="h-8 w-2/3 animate-pulse rounded bg-ink/10" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-ink/10" />
      <div className="h-32 animate-pulse rounded-2xl bg-ink/10" />
    </div>
  )
}

function OrderCard({ order }: { order: MerchOrderSummary }) {
  const address = order.shipping_address
  const addressLines = address
    ? [
        address.line1,
        address.line2,
        [address.postal_code, address.city].filter(Boolean).join(" "),
        address.country,
      ].filter(Boolean)
    : []

  return (
    <div className="flex flex-col gap-6">
      <div className="brick-card flex flex-col gap-3 bg-brand-mint p-6 md:p-8">
        <p className="label-mono text-ink/60">
          Užsakymas #{order.order_number}
        </p>
        <h1 className="heading-display text-d-md text-ink">
          Ačiū už užsakymą!
        </h1>
        <p className="text-[15px] leading-relaxed text-ink/75 md:text-[17px]">
          Apmokėjimas gautas.
          {order.buyer_email && (
            <>
              {" "}
              Patvirtinimą išsiuntėme adresu{" "}
              <span className="font-semibold text-ink">
                {order.buyer_email}
              </span>
              .
            </>
          )}{" "}
          Produktą išsiųsime per 3–5 d. d.
        </p>
      </div>

      <div className="brick-card flex flex-col gap-6 p-6 md:p-8">
        <div className="flex items-center gap-4">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl border-2 border-ink bg-white md:size-24">
            {order.image_url ? (
              <img
                src={order.image_url}
                alt={order.item_name}
                className="absolute inset-0 h-full w-full object-contain p-2"
              />
            ) : (
              <ImagePlaceholder />
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="heading-display text-d-xs text-ink">
              {order.item_name}
            </p>
            <p className="label-mono text-ink/50">Dydis: {order.size}</p>
          </div>
          <p className="shrink-0 font-mono text-[20px] font-bold text-ink">
            €{Number(order.amount).toFixed(2)}
          </p>
        </div>

        {addressLines.length > 0 && (
          <div className="flex flex-col gap-1.5 border-t-2 border-ink/10 pt-5">
            <p className="label-mono text-ink/50">Pristatymo adresas</p>
            {order.buyer_name && (
              <p className="text-[15px] font-semibold text-ink">
                {order.buyer_name}
              </p>
            )}
            {addressLines.map((line) => (
              <p key={line} className="text-[15px] text-ink/75">
                {line}
              </p>
            ))}
          </div>
        )}
      </div>

      <BackLinks slug={order.item_slug} />
    </div>
  )
}

function PendingCard() {
  return (
    <div className="flex flex-col gap-6">
      <div className="brick-card flex flex-col gap-3 bg-brand-mint p-6 md:p-8">
        <h1 className="heading-display text-d-md text-ink">
          Ačiū už užsakymą!
        </h1>
        <p className="text-[15px] leading-relaxed text-ink/75 md:text-[17px]">
          Apmokėjimą gavome ir užsakymas dar apdorojamas. Patvirtinimą su
          užsakymo informacija netrukus gausite el. paštu.
        </p>
      </div>
      <BackLinks slug={null} />
    </div>
  )
}

function MissingCard() {
  return (
    <div className="flex flex-col gap-6">
      <div className="brick-card flex flex-col gap-3 p-6 md:p-8">
        <h1 className="heading-display text-d-md text-ink">
          Užsakymas nerastas
        </h1>
        <p className="text-[15px] leading-relaxed text-ink/75">
          Šioje nuorodoje nėra užsakymo informacijos. Jei ką tik apmokėjote,
          patikrinkite el. paštą arba susisiekite su mumis.
        </p>
      </div>
      <BackLinks slug={null} />
    </div>
  )
}

function BackLinks({ slug }: { slug: string | null }) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button asChild size="lg">
        <Link to="/merch">Visi merch produktai</Link>
      </Button>
      {slug && (
        <Button asChild size="lg" variant="outline">
          <Link to={`/merch/${slug}`}>Grįžti į produktą</Link>
        </Button>
      )}
    </div>
  )
}
