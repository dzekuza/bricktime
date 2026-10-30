type RecurringItem = {
  price: {
    unit_amount: number | null
    recurring: { interval: string } | null
  }
  quantity?: number | null
}

// A monthly upgrade bills exactly the price gap, once, instead of Stripe's
// day-based proration, and keeps the billing day. Returns null when the swap
// isn't a plain monthly-to-monthly price increase, so the caller falls back to
// Stripe's own proration (yearly plans, interval changes, same-or-lower price).
export function flatUpgradeDiffCents(
  items: RecurringItem[],
  newInterval: string,
  newTotalCents: number
): number | null {
  if (newInterval !== "month" || items.length === 0) return null
  if (
    items.some(
      (item) =>
        item.price.recurring?.interval !== "month" ||
        item.price.unit_amount == null
    )
  ) {
    return null
  }

  const currentCents = items.reduce(
    (sum, item) => sum + item.price.unit_amount! * (item.quantity ?? 1),
    0
  )
  return newTotalCents > currentCents ? newTotalCents - currentCents : null
}
