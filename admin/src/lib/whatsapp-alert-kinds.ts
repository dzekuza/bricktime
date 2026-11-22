/** Alert kinds an admin can switch on or off, in the order they are shown. */
export const WHATSAPP_ALERT_KINDS = [
  { id: "new_subscriber", label: "New member", description: "Someone signs up." },
  {
    id: "subscription_started",
    label: "New subscription",
    description: "A member pays for a plan.",
  },
  {
    id: "payment_failed",
    label: "Payment failed",
    description: "A renewal payment is declined.",
  },
  {
    id: "subscription_cancelled",
    label: "Subscription cancelled",
    description: "A subscription ends.",
  },
  {
    id: "rental_order",
    label: "Set rental",
    description: "A member rents a set (one alert per cart).",
  },
  {
    id: "mystery_request",
    label: "Mystery Box request",
    description: "A member requests a Mystery Box.",
  },
  {
    id: "return_requested",
    label: "Return request",
    description: "A member asks to return a set.",
  },
  {
    id: "merch_order",
    label: "Merch order",
    description: "A merch order is paid.",
  },
  {
    id: "missing_part_request",
    label: "Missing part form",
    description: "A member reports a missing part.",
  },
  {
    id: "gift_card_bought",
    label: "Gift card bought",
    description: "A gift card is paid for.",
  },
  {
    id: "product_review",
    label: "New review",
    description: "A member posts a product review.",
  },
] as const

export const WHATSAPP_KIND_LABELS: Record<string, string> = {
  ...Object.fromEntries(WHATSAPP_ALERT_KINDS.map((k) => [k.id, k.label])),
  test: "Test alert",
}
