import { supabase } from "@/lib/supabase"

// The plans table is what the storefront and Stripe checkout charge from, so
// the admin must read prices here instead of keeping its own copy.
export async function fetchPlanPrices(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from("plans").select("id, price")
  if (error) {
    console.error("Plan prices failed to load:", error.message)
    return {}
  }
  return Object.fromEntries(data.map((p) => [p.id, Number(p.price)]))
}
