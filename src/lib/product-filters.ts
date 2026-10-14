export const SUBSCRIPTION_CHIPS = [
  { key: "nano", label: "Mėgėjas" },
  { key: "mini", label: "Kūrėjas" },
  { key: "standard", label: "Meistras" },
  { key: "mega", label: "Legenda" },
  { key: "mystery_s", label: "Mystery box Mėgėjams" },
  { key: "mystery_m", label: "Mystery Box Kūrėjams" },
] as const

export const AGE_CHIPS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18] as const

// Regular plans before Mystery Box: admin stores `products.tier` as the first
// allowed plan in an order that puts mystery_s/mystery_m ahead of mini, so a
// set open to both "Kūrėjas" and "Mystery Box Kūrėjams" would otherwise be
// labelled with the Mystery Box plan.
const PLAN_DISPLAY_ORDER = [
  "nano",
  "mini",
  "standard",
  "mega",
  "mystery_s",
  "mystery_m",
] as const

/**
 * Plan to show on a product: the cheapest one the shopper filtered by, else
 * the cheapest regular plan that may rent it, else `fallback` (`products.tier`).
 */
export function getDisplayPlan(
  allowedPlans: readonly string[],
  fallback: string,
  preferredPlans: readonly string[] = []
): string {
  const preferred = allowedPlans.filter((p) => preferredPlans.includes(p))
  const pool = preferred.length > 0 ? preferred : allowedPlans
  return PLAN_DISPLAY_ORDER.find((p) => pool.includes(p)) ?? fallback
}

export function sortPlans(plans: readonly string[]): string[] {
  return PLAN_DISPLAY_ORDER.filter((p) => plans.includes(p))
}
