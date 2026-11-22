import { useEffect, useEffectEvent, useState } from "react"
import {
  CheckoutElementsProvider,
  ExpressCheckoutElement,
  useCheckoutElements,
} from "@stripe/react-stripe-js/checkout"

import { stripePromise } from "@/lib/stripe"

// Settles quick edits (quantity taps) before a Stripe session is created.
const SESSION_DEBOUNCE_MS = 400

type WalletCheckoutProps = {
  /** Changes whenever the order changes, so the wallet session is rebuilt. */
  orderKey: string
  /** Creates a Stripe Checkout Session for the current order; returns its client secret. */
  createSession: () => Promise<string>
  onError: (message: string) => void
}

/**
 * One-tap Apple Pay / Google Pay on the page itself. Renders nothing when the
 * key is missing or the device has no wallet, so the normal pay button stays
 * the only option there.
 */
export function WalletCheckout({
  orderKey,
  createSession,
  onError,
}: WalletCheckoutProps) {
  const [session, setSession] = useState<{
    key: string
    secret: string
  } | null>(null)
  const runCreateSession = useEffectEvent(createSession)

  useEffect(() => {
    if (!stripePromise) return
    let isCancelled = false
    const timer = setTimeout(() => {
      runCreateSession()
        .then((secret) => {
          if (!isCancelled) setSession({ key: orderKey, secret })
        })
        .catch((error: unknown) => {
          // The hosted pay button reports the same failure to the shopper.
          console.error("Wallet checkout session failed", error)
        })
    }, SESSION_DEBOUNCE_MS)
    return () => {
      isCancelled = true
      clearTimeout(timer)
    }
  }, [orderKey])

  if (!stripePromise || session?.key !== orderKey) return null

  return (
    <CheckoutElementsProvider
      key={session.secret}
      stripe={stripePromise}
      options={{ clientSecret: session.secret }}
    >
      <WalletButtons onError={onError} />
    </CheckoutElementsProvider>
  )
}

function WalletButtons({ onError }: Pick<WalletCheckoutProps, "onError">) {
  const checkout = useCheckoutElements()
  const [isAvailable, setIsAvailable] = useState(false)

  return (
    <div className={isAvailable ? "mt-5" : "h-0 overflow-hidden"}>
      <ExpressCheckoutElement
        options={{
          buttonHeight: 48,
          buttonTheme: undefined,
          buttonType: undefined,
          layout: undefined,
          paymentMethodOrder: undefined,
          paymentMethods: {
            link: "never",
            paypal: "never",
            amazonPay: "never",
            klarna: "never",
          },
        }}
        onReady={(event) => {
          const methods = event.availablePaymentMethods
          setIsAvailable(Boolean(methods?.applePay || methods?.googlePay))
        }}
        onConfirm={async (event) => {
          if (checkout.type !== "success") return
          const result = await checkout.checkout.confirm({
            expressCheckoutConfirmEvent: event,
          })
          if (result.type === "error") {
            onError(result.error.message)
          }
        }}
      />
      {isAvailable && (
        <p className="label-mono mt-3 text-center text-ink/40">arba</p>
      )}
    </div>
  )
}
