import { loadStripe } from "@stripe/stripe-js"

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as
  | string
  | undefined

/** Null when the key isn't configured, which hides the on-page wallet button. */
export const stripePromise = publishableKey ? loadStripe(publishableKey) : null
