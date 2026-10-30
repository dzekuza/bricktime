import type Stripe from "https://esm.sh/stripe@14.21.0"

const HOME_DELIVERY_FEE_CENTS = 300

type PhaseItem = { price: string | { id: string }; quantity?: number | null }

// Held sets must fit the plan they're held under, so a smaller plan only takes
// over once everything the member keeps at home fits its credits.
export function fitsWithinCredits(heldValue: number, credits: number): boolean {
  return Number(heldValue) <= Number(credits)
}

export async function getHeldBrickValue(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  subscriberId: string
): Promise<number> {
  const { data, error } = await supabase.rpc("held_brick_value", {
    p_subscriber: subscriberId,
  })
  if (error) throw new Error(`held_brick_value failed: ${error.message}`)
  return Number(data ?? 0)
}

// Stops a schedule without touching the subscription: it keeps running on the
// phase it is in, at the price it is on.
export async function releaseSchedule(
  stripe: Stripe,
  subscription: Stripe.Subscription
): Promise<void> {
  const scheduleId =
    typeof subscription.schedule === "string"
      ? subscription.schedule
      : subscription.schedule?.id
  if (scheduleId) await stripe.subscriptionSchedules.release(scheduleId)
}

// Moves the subscriber's Stripe subscription onto `pending_plan` at the next
// renewal: current plan until the period ends, then the new plan for one cycle,
// after which the schedule releases and the subscription carries on as-is. No
// proration, no refund. Returns the schedule id and the date it takes effect.
export async function schedulePlanChange(
  stripe: Stripe,
  // deno-lint-ignore no-explicit-any
  supabase: any,
  userId: string
): Promise<{ scheduleId: string; effectiveAt: string }> {
  const { data: subscriber } = await supabase
    .from("subscribers")
    .select("stripe_subscription_id, pending_plan, pending_home_delivery")
    .eq("id", userId)
    .maybeSingle()
  if (!subscriber?.stripe_subscription_id || !subscriber.pending_plan) {
    throw new Error("No pending plan change to schedule")
  }

  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select("name, price, annual_price")
    .eq("id", subscriber.pending_plan)
    .eq("active", true)
    .single()
  if (planError || !plan) {
    throw new Error(`Unknown plan: ${subscriber.pending_plan}`)
  }

  const subscription = await stripe.subscriptions.retrieve(
    subscriber.stripe_subscription_id
  )
  // A leftover schedule (an earlier request) would block creating a new one.
  await releaseSchedule(stripe, subscription)

  const interval = subscription.items.data[0]?.price.recurring?.interval
  if (interval !== "month" && interval !== "year") {
    throw new Error("Subscription has no supported billing interval")
  }
  const isYearly = interval === "year"
  const monthsPerInterval = isYearly ? 12 : 1
  const monthlyPrice = isYearly ? (plan.annual_price ?? plan.price) : plan.price
  const chargeHomeDelivery =
    subscriber.pending_home_delivery && subscriber.pending_plan !== "mega"

  const planProduct = await stripe.products.create({
    name: plan.name ?? `BRICKTIME ${subscriber.pending_plan}`,
  })
  const deliveryProduct = chargeHomeDelivery
    ? await stripe.products.create({ name: "Pristatymas į duris" })
    : null

  const schedule = await stripe.subscriptionSchedules.create({
    from_subscription: subscription.id,
  })
  const current = schedule.phases[0]

  await stripe.subscriptionSchedules.update(schedule.id, {
    end_behavior: "release",
    phases: [
      {
        start_date: current.start_date,
        end_date: current.end_date,
        items: current.items.map((item: PhaseItem) => ({
          price: typeof item.price === "string" ? item.price : item.price.id,
          quantity: item.quantity ?? 1,
        })),
        metadata: current.metadata ?? undefined,
        proration_behavior: "none",
      },
      {
        items: [
          {
            price_data: {
              currency: "eur",
              product: planProduct.id,
              unit_amount: Math.round(monthlyPrice * 100) * monthsPerInterval,
              recurring: { interval },
            },
            quantity: 1,
          },
          ...(deliveryProduct
            ? [
                {
                  price_data: {
                    currency: "eur",
                    product: deliveryProduct.id,
                    unit_amount: HOME_DELIVERY_FEE_CENTS * monthsPerInterval,
                    recurring: { interval },
                  },
                  quantity: 1,
                },
              ]
            : []),
        ],
        iterations: 1,
        // Copied onto the subscription when the phase starts, so the webhook
        // sees the new planKey and moves subscribers.plan.
        metadata: {
          userId,
          planKey: subscriber.pending_plan,
          billing: isYearly ? "annual" : "monthly",
          homeDelivery: chargeHomeDelivery ? "true" : "false",
        },
        proration_behavior: "none",
      },
    ],
  })

  return {
    scheduleId: schedule.id,
    effectiveAt: new Date(current.end_date * 1000).toISOString(),
  }
}
