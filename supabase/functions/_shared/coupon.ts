import type Stripe from "https://esm.sh/stripe@14.21.0"

export type CouponTerms = {
  type: "percentage" | "fixed"
  value: number
  durationMonths: number | null
}

// Open-ended coupons cut the recurring price itself. A coupon with a length
// leaves the price intact and rides on a Stripe `repeating` coupon, so the
// discount ends by itself and later invoices bill in full.
export async function applyCoupon(
  stripe: Stripe,
  terms: CouponTerms,
  monthlyPrice: number,
  monthsPerInterval: number
): Promise<{ monthlyPrice: number; stripeCouponId: string | null }> {
  if (terms.durationMonths == null) {
    const cut =
      terms.type === "percentage"
        ? monthlyPrice * (1 - terms.value / 100)
        : monthlyPrice - terms.value
    return { monthlyPrice: Math.max(0, cut), stripeCouponId: null }
  }

  const coupon = await stripe.coupons.create({
    duration: "repeating",
    duration_in_months: terms.durationMonths,
    max_redemptions: 1,
    name: "Nuolaidos kodas",
    ...(terms.type === "percentage"
      ? { percent_off: terms.value }
      : {
          // `value` is per month; yearly invoices carry 12 months.
          amount_off: Math.round(terms.value * 100) * monthsPerInterval,
          currency: "eur",
        }),
  })
  return { monthlyPrice, stripeCouponId: coupon.id }
}
