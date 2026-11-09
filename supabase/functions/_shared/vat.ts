import type Stripe from "https://esm.sh/stripe@14.21.0"

const VAT_PERCENTAGE = 21

// Prices are gross (VAT included), so the rate is inclusive: Stripe splits the
// VAT out of the amount instead of adding it, and the customer pays the same.
// Found by its attributes so a second deploy never creates a duplicate rate.
export async function getVatTaxRateId(stripe: Stripe): Promise<string> {
  for await (const rate of stripe.taxRates.list({
    active: true,
    inclusive: true,
    limit: 100,
  })) {
    if (
      rate.percentage === VAT_PERCENTAGE &&
      rate.country === "LT" &&
      rate.tax_type === "vat"
    ) {
      return rate.id
    }
  }
  const created = await stripe.taxRates.create({
    display_name: "PVM",
    description: `PVM ${VAT_PERCENTAGE}%`,
    jurisdiction: "LT",
    country: "LT",
    percentage: VAT_PERCENTAGE,
    inclusive: true,
    tax_type: "vat",
  })
  return created.id
}
