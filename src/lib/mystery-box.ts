/** Mystery plans are keyed `mystery_s`, `mystery_m`. */
export const isMysteryPlan = (plan: string | null | undefined): boolean =>
  !!plan?.startsWith("mystery")

/** Id of the Užsakymai section on /account, also its URL hash. */
export const MYSTERY_ORDERS_ANCHOR = "uzsakymai"
export const MYSTERY_ORDERS_PATH = `/paskyra#${MYSTERY_ORDERS_ANCHOR}`

/** Fired when the member's orders change, so the top bar re-checks. */
export const ORDERS_CHANGED_EVENT = "bricktime:orders-changed"

export const notifyOrdersChanged = () =>
  window.dispatchEvent(new Event(ORDERS_CHANGED_EVENT))
