// Sets are budgeted against the plan they were rented on. Dropping to a
// cheaper plan while holding sets would keep them for less than they cost,
// so downgrades wait until everything is returned. Shared by every path that
// can change a subscriber's plan (plan swap, fresh checkout after cancelling).
export async function assertNoDowngradeWhileHolding(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  userId: string,
  currentPlanKey: string | null | undefined,
  newPlanKey: string,
  newPlanPrice: number
): Promise<void> {
  if (!currentPlanKey || currentPlanKey === newPlanKey) return

  const { data: currentPlan } = await supabase
    .from("plans")
    .select("price")
    .eq("id", currentPlanKey)
    .maybeSingle()
  if (!currentPlan || newPlanPrice >= currentPlan.price) return

  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("subscriber_id", userId)
    .neq("status", "returned")
  if ((count ?? 0) > 0) {
    throw new Error(
      "Pereiti į pigesnį planą galėsi, kai grąžinsi visus paimtus rinkinius."
    )
  }
}
