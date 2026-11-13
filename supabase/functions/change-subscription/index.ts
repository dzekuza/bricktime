import Stripe from "https://esm.sh/stripe@14.21.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

import { applyCoupon } from "../_shared/coupon.ts"
import { flatUpgradeDiffCents } from "../_shared/plan-change.ts"
import { getVatTaxRateId } from "../_shared/vat.ts"
import {
  fitsWithinCredits,
  getHeldBrickValue,
  releaseSchedule,
  schedulePlanChange,
} from "../_shared/plan-schedule.ts"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

const HOME_DELIVERY_FEE_CENTS = 300
const SWAPPABLE_STATUSES = new Set(["active", "trialing"])

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })

type DiscountCode =
  | {
      kind: "coupon"
      code: string
      type: "percentage" | "fixed"
      value: number
      durationMonths: number | null
    }
  | { kind: "gift"; code: string; cents: number }

// Validates a code against the database; the client's own preview is never
// trusted. A code is a coupon (percentage / fixed price cut) or a gift card.
async function resolveDiscountCode(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  raw: string
): Promise<DiscountCode> {
  const code = String(raw).trim().toUpperCase()
  const invalid = new Error("Kodas negalioja")

  const { data: coupon } = await supabase
    .from("coupons")
    .select(
      "code, discount_type, discount_value, duration_months, max_uses, uses_count, expires_at, active"
    )
    .eq("code", code)
    .maybeSingle()
  if (coupon) {
    const expired =
      coupon.expires_at && new Date(coupon.expires_at) < new Date()
    const exhausted =
      coupon.max_uses != null && coupon.uses_count >= coupon.max_uses
    if (!coupon.active || expired || exhausted) throw invalid
    return {
      kind: "coupon",
      code,
      type: coupon.discount_type,
      value: Number(coupon.discount_value),
      durationMonths: coupon.duration_months,
    }
  }

  const { data: card } = await supabase
    .from("gift_cards")
    .select("code, amount_cents, status, expires_at")
    .eq("code", code)
    .maybeSingle()
  if (
    !card ||
    card.status !== "active" ||
    new Date(card.expires_at) < new Date()
  ) {
    throw invalid
  }
  return { kind: "gift", code: card.code, cents: card.amount_cents }
}

// Stripe Checkout normally leaves a default payment method on the customer,
// but older/migrated subscribers can lack one, which makes invoices.pay()
// fail with a raw "no default_payment_method" error. Resolve one explicitly
// (subscription default, then customer default, then the customer's first
// saved card) so the gap invoice always has something to charge.
async function resolveChargeablePaymentMethod(
  customerId: string,
  subscription: Stripe.Subscription
): Promise<string> {
  const subscriptionPm =
    typeof subscription.default_payment_method === "string"
      ? subscription.default_payment_method
      : subscription.default_payment_method?.id
  if (subscriptionPm) return subscriptionPm

  const customer = await stripe.customers.retrieve(customerId)
  if (!("deleted" in customer && customer.deleted)) {
    const defaultPm = (customer as Stripe.Customer).invoice_settings
      ?.default_payment_method
    const customerPm = typeof defaultPm === "string" ? defaultPm : defaultPm?.id
    if (customerPm) return customerPm
  }

  const methods = await stripe.paymentMethods.list({
    customer: customerId,
    type: "card",
  })
  if (methods.data[0]) return methods.data[0].id

  throw new Error(
    "Nerastas joks mokėjimo būdas. Pridėk kortelę atsiskaitymų skiltyje ir bandyk dar kartą."
  )
}

// Bills the upgrade gap as its own invoice and settles it before the plan is
// swapped, so a failed payment leaves the old plan untouched.
async function chargeUpgradeDifference(
  customerId: string,
  cents: number,
  planName: string,
  paymentMethodId: string
): Promise<Stripe.Invoice> {
  await stripe.invoiceItems.create({
    customer: customerId,
    amount: cents,
    currency: "eur",
    description: `Plano keitimas į ${planName}: kainų skirtumas`,
  })
  const draft = await stripe.invoices.create({
    customer: customerId,
    collection_method: "charge_automatically",
    auto_advance: false,
    pending_invoice_items_behavior: "include",
    default_tax_rates: [await getVatTaxRateId(stripe)],
    default_payment_method: paymentMethodId,
  })
  try {
    const finalized = await stripe.invoices.finalizeInvoice(draft.id)
    // A gift-card balance can cover the whole gap, leaving nothing to pay.
    return finalized.status === "paid"
      ? finalized
      : await stripe.invoices.pay(finalized.id, {
          payment_method: paymentMethodId,
        })
  } catch (err) {
    await stripe.invoices
      .voidInvoice(draft.id)
      .catch(() => stripe.invoices.del(draft.id))
      .catch(() => undefined)
    throw err
  }
}

// What the member will pay now for an immediate swap, without claiming a gift
// card, creating a coupon or touching the subscription, so the page can show
// the amount before anything is charged. Customer balance and a gift card code
// count as credit, as they do when the swap really runs.
async function previewUpgrade(args: {
  subscription: Stripe.Subscription
  plan: { name: string | null; price: number; annual_price: number | null }
  planKey: string
  billing: string | undefined
  homeDelivery: boolean | undefined
  discount: DiscountCode | null
}) {
  const { subscription, plan, planKey, billing, homeDelivery, discount } = args
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id
  const isAnnual = billing === "annual"
  const interval = isAnnual ? "year" : "month"
  const monthsPerInterval = isAnnual ? 12 : 1
  const hasDeliveryFee = Boolean(homeDelivery) && planKey !== "mega"
  const listPrice = isAnnual ? (plan.annual_price ?? plan.price) : plan.price

  // A coupon with a length leaves the recurring price intact; only an
  // open-ended one cuts it, and that case creates nothing in Stripe.
  const monthlyPrice =
    discount?.kind === "coupon" && discount.durationMonths == null
      ? (await applyCoupon(stripe, discount, listPrice, monthsPerInterval))
          .monthlyPrice
      : listPrice
  const newTotalCents =
    Math.round(monthlyPrice * 100) * monthsPerInterval +
    (hasDeliveryFee ? HOME_DELIVERY_FEE_CENTS * monthsPerInterval : 0)

  const customer = await stripe.customers.retrieve(customerId)
  const balanceCents =
    "deleted" in customer && customer.deleted
      ? 0
      : Math.max(0, -((customer as Stripe.Customer).balance ?? 0))
  const giftCents = discount?.kind === "gift" ? discount.cents : 0
  const creditCents = balanceCents + giftCents

  const flatDiffCents = flatUpgradeDiffCents(
    subscription.items.data,
    interval,
    newTotalCents
  )
  let grossCents: number
  if (flatDiffCents != null) {
    grossCents = flatDiffCents
  } else {
    // Yearly or interval changes use Stripe's own proration. The upcoming
    // invoice needs a product id, so the two products are created here too.
    const planProduct = await stripe.products.create({
      name: plan.name ?? `BRICKTIME ${planKey}`,
    })
    const deliveryProduct = hasDeliveryFee
      ? await stripe.products.create({ name: "Pristatymas į duris" })
      : null
    const upcoming = await stripe.invoices.retrieveUpcoming({
      customer: customerId,
      subscription: subscription.id,
      subscription_items: [
        ...subscription.items.data.map((item: Stripe.SubscriptionItem) => ({
          id: item.id,
          deleted: true,
        })),
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
      subscription_proration_behavior: "always_invoice",
    })
    // amount_due already nets the customer balance, so add it back to treat
    // both paths the same below.
    grossCents = upcoming.amount_due + balanceCents
  }

  const amountCents = Math.max(0, grossCents - creditCents)
  let card: { brand: string; last4: string } | null = null
  if (amountCents > 0) {
    const paymentMethodId = await resolveChargeablePaymentMethod(
      customerId,
      subscription
    )
    const method = await stripe.paymentMethods.retrieve(paymentMethodId)
    if (method.card)
      card = { brand: method.card.brand, last4: method.card.last4 }
  }
  return {
    preview: true,
    amountCents,
    creditCents: Math.min(creditCents, grossCents),
    isProration: flatDiffCents == null,
    card,
  }
}

// Swaps the plan on the caller's existing Stripe subscription instead of
// opening a second checkout. Returns { changed: false } when there is nothing
// to swap so the client can fall back to a normal checkout.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return json({ error: "Unauthorized" }, 401)

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: userData } = await userClient.auth.getUser()
    const user = userData.user
    if (!user) return json({ error: "Unauthorized" }, 401)

    const { planKey, billing, homeDelivery, code, withdrawPending, preview } =
      await req.json()

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const { data: subscriber } = await supabase
      .from("subscribers")
      .select("stripe_subscription_id, plan, paused_until")
      .eq("id", user.id)
      .maybeSingle()

    if (!subscriber?.stripe_subscription_id) {
      return json({ changed: false, reason: "no_active_subscription" })
    }

    // A plan change while paused would bill a proration invoice that could
    // stand in for the skipped (voided) renewal and lift the rental block.
    // 'infinity' or anything unparseable counts as paused (fails closed).
    const pausedUntilMs = subscriber.paused_until
      ? Date.parse(subscriber.paused_until)
      : null
    if (
      pausedUntilMs !== null &&
      (Number.isNaN(pausedUntilMs) || pausedUntilMs > Date.now())
    ) {
      return json(
        { error: "Prenumerata pristabdyta – pirmiausia ją atnaujink." },
        400
      )
    }

    // A stored id Stripe no longer knows (deleted, or from the other Stripe
    // mode) is a stale row, not a failure — fall back to a fresh checkout.
    let subscription: Stripe.Subscription
    try {
      subscription = await stripe.subscriptions.retrieve(
        subscriber.stripe_subscription_id
      )
    } catch (err) {
      if ((err as { code?: string }).code === "resource_missing") {
        return json({ changed: false, reason: "no_active_subscription" })
      }
      throw err
    }
    if (!SWAPPABLE_STATUSES.has(subscription.status)) {
      return json({ changed: false, reason: "no_active_subscription" })
    }
    // Stripe is the source of truth if paused_until hasn't synced yet.
    if (subscription.pause_collection) {
      return json(
        { error: "Prenumerata pristabdyta – pirmiausia ją atnaujink." },
        400
      )
    }

    if (withdrawPending) {
      await releaseSchedule(stripe, subscription)
      await supabase
        .from("subscribers")
        .update({
          pending_plan: null,
          pending_home_delivery: null,
          pending_schedule_id: null,
        })
        .eq("id", user.id)
      return json({ changed: false, withdrawn: true })
    }

    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("name, price, annual_price, credits")
      .eq("id", planKey)
      .eq("active", true)
      .single()
    if (planError || !plan) throw new Error(`Unknown plan: ${planKey}`)

    // A cheaper plan never takes effect mid-cycle and never refunds: the request
    // is stored and Stripe moves the subscription at the next renewal, but only
    // while the sets the member holds fit the new plan's credits. If they don't,
    // the old plan and price carry on and the request waits (process-plan-changes
    // schedules it once the sets are back).
    const { data: currentPlan } = await supabase
      .from("plans")
      .select("price")
      .eq("id", subscriber.plan)
      .maybeSingle()
    if (
      currentPlan &&
      planKey !== subscriber.plan &&
      plan.price < currentPlan.price
    ) {
      // A cheaper plan is only scheduled, so there is nothing to charge or save.
      if (preview)
        return json({ preview: true, amountCents: 0, scheduled: true })
      await supabase
        .from("subscribers")
        .update({
          pending_plan: planKey,
          pending_home_delivery: Boolean(homeDelivery),
        })
        .eq("id", user.id)

      const heldValue = await getHeldBrickValue(supabase, user.id)
      const fits = fitsWithinCredits(heldValue, plan.credits)
      let effectiveAt = new Date(
        subscription.current_period_end * 1000
      ).toISOString()
      if (fits) {
        const scheduled = await schedulePlanChange(stripe, supabase, user.id)
        effectiveAt = scheduled.effectiveAt
        await supabase
          .from("subscribers")
          .update({ pending_schedule_id: scheduled.scheduleId })
          .eq("id", user.id)
      } else {
        await releaseSchedule(stripe, subscription)
        await supabase
          .from("subscribers")
          .update({ pending_schedule_id: null })
          .eq("id", user.id)
      }
      return json({
        changed: false,
        scheduled: true,
        fits,
        effectiveAt,
        heldValue,
        credits: plan.credits,
      })
    }

    // Validate the code before touching the schedule: a rejected code must not
    // cost the member their scheduled downgrade. The gift card is still
    // claimed atomically further down; this only catches a live hold early.
    const discount = code ? await resolveDiscountCode(supabase, code) : null
    if (discount?.kind === "gift") {
      const { data: held } = await supabase
        .from("gift_cards")
        .select("code")
        .eq("code", discount.code)
        .gt("reserved_until", new Date().toISOString())
        .maybeSingle()
      if (held) {
        throw new Error(
          "Ši dovanų kortelė jau naudojama kitame neužbaigtame užsakyme. Pabandyk po 35 min."
        )
      }
    }

    if (preview) {
      return json(
        await previewUpgrade({
          subscription,
          plan,
          planKey,
          billing,
          homeDelivery,
          discount,
        })
      )
    }

    // An immediate swap supersedes a pending downgrade, and Stripe refuses to
    // update a subscription while a schedule controls it.
    if (subscription.schedule) {
      await releaseSchedule(stripe, subscription)
      await supabase
        .from("subscribers")
        .update({
          pending_plan: null,
          pending_home_delivery: null,
          pending_schedule_id: null,
        })
        .eq("id", user.id)
    }

    // Legenda (mega) includes free courier delivery.
    const chargeHomeDeliveryFee = homeDelivery && planKey !== "mega"

    // plans.annual_price is the discounted per-month rate; yearly billing
    // charges 12 of those once a year, and every item must share an interval.
    const isAnnual = billing === "annual"
    const interval = isAnnual ? "year" : "month"
    const monthsPerInterval = isAnnual ? 12 : 1
    const monthlyPrice = isAnnual
      ? (plan.annual_price ?? plan.price)
      : plan.price

    const priced =
      discount?.kind === "coupon"
        ? await applyCoupon(stripe, discount, monthlyPrice, monthsPerInterval)
        : { monthlyPrice, stripeCouponId: null }
    const chargedMonthlyPrice = priced.monthlyPrice

    const planProduct = await stripe.products.create({
      name: plan.name ?? `BRICKTIME ${planKey}`,
    })
    const deliveryProduct = chargeHomeDeliveryFee
      ? await stripe.products.create({ name: "Pristatymas į duris" })
      : null

    const metadata = {
      userId: user.id,
      planKey,
      billing: billing ?? "monthly",
      homeDelivery: homeDelivery ? "true" : "false",
    }

    // A gift card becomes Stripe customer balance, which is applied to the swap
    // invoice automatically (and carries over if it exceeds it). Claim the card
    // first so two requests can't spend it twice; undo both if the swap fails.
    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id
    // Invoices render in the customer's preferred locale, which Checkout only
    // sets for new customers, so set it before the gap invoice is created.
    await stripe.customers.update(customerId, { preferred_locales: ["lt"] })
    const vatTaxRateId = await getVatTaxRateId(stripe)

    let creditApplied = false
    if (discount?.kind === "gift") {
      const { data: claimed } = await supabase
        .from("gift_cards")
        .update({
          status: "used",
          redeemed_at: new Date().toISOString(),
          redeemed_by_user_id: user.id,
        })
        .eq("code", discount.code)
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        // A card held by an open checkout elsewhere can't be spent here too.
        .or(
          `reserved_until.is.null,reserved_until.lte.${new Date().toISOString()}`
        )
        .select("code")
        .maybeSingle()
      if (!claimed) {
        // Tell a held card apart from a bad one: it frees up on its own, so
        // the member should retry rather than think the card is worthless.
        const { data: held } = await supabase
          .from("gift_cards")
          .select("code")
          .eq("code", discount.code)
          .eq("status", "active")
          .gt("reserved_until", new Date().toISOString())
          .maybeSingle()
        throw new Error(
          held
            ? "Ši dovanų kortelė jau naudojama kitame neužbaigtame užsakyme. Pabandyk po 35 min."
            : "Kodas negalioja"
        )
      }
      await stripe.customers.createBalanceTransaction(customerId, {
        amount: -discount.cents,
        currency: "eur",
        description: `Dovanų kortelė ${discount.code}`,
      })
      creditApplied = true
    }

    // A monthly upgrade bills the flat price gap now; anything else falls back
    // to Stripe's proration with always_invoice. Either way the payment settles
    // before the plan changes, so a plan is never granted before it is paid for.
    const newTotalCents =
      Math.round(chargedMonthlyPrice * 100) * monthsPerInterval +
      (deliveryProduct ? HOME_DELIVERY_FEE_CENTS * monthsPerInterval : 0)
    const flatDiffCents = flatUpgradeDiffCents(
      subscription.items.data,
      interval,
      newTotalCents
    )
    let upgradeInvoice: Stripe.Invoice | null = null
    try {
      if (flatDiffCents != null) {
        const paymentMethodId = await resolveChargeablePaymentMethod(
          customerId,
          subscription
        )
        upgradeInvoice = await chargeUpgradeDifference(
          customerId,
          flatDiffCents,
          plan.name ?? planKey,
          paymentMethodId
        )
      }
      await stripe.subscriptions.update(subscription.id, {
        items: [
          ...subscription.items.data.map((item: Stripe.SubscriptionItem) => ({
            id: item.id,
            deleted: true,
          })),
          {
            price_data: {
              currency: "eur",
              product: planProduct.id,
              unit_amount:
                Math.round(chargedMonthlyPrice * 100) * monthsPerInterval,
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
        ...(priced.stripeCouponId && {
          discounts: [{ coupon: priced.stripeCouponId }],
        }),
        ...(flatDiffCents != null
          ? { proration_behavior: "none" as const }
          : {
              proration_behavior: "always_invoice" as const,
              payment_behavior: "error_if_incomplete" as const,
            }),
        // The swapped items carry no tax rate of their own, so the proration
        // and every later renewal would otherwise be invoiced without VAT.
        default_tax_rates: [vatTaxRateId],
        cancel_at_period_end: false,
        metadata,
      })
    } catch (swapErr) {
      const paidIntent =
        typeof upgradeInvoice?.payment_intent === "string"
          ? upgradeInvoice.payment_intent
          : upgradeInvoice?.payment_intent?.id
      if (paidIntent) {
        try {
          await stripe.refunds.create({ payment_intent: paidIntent })
        } catch (refundErr) {
          console.error(
            `change-subscription: failed to refund upgrade invoice ${upgradeInvoice?.id}:`,
            (refundErr as Error).message
          )
        }
      }
      // Customer credit the gap invoice consumed isn't covered by the refund.
      // Give it back first; otherwise undoing the gift card below would push
      // the balance into debt and the next invoice would charge it.
      const creditUsedCents = upgradeInvoice
        ? Math.max(
            0,
            (upgradeInvoice.ending_balance ?? upgradeInvoice.starting_balance) -
              upgradeInvoice.starting_balance
          )
        : 0
      if (creditUsedCents > 0) {
        try {
          await stripe.customers.createBalanceTransaction(customerId, {
            amount: -creditUsedCents,
            currency: "eur",
            description: `Plano keitimas nepavyko: grąžintas kreditas (${upgradeInvoice?.id})`,
          })
        } catch (creditErr) {
          console.error(
            `change-subscription: failed to restore credit used by ${upgradeInvoice?.id}:`,
            (creditErr as Error).message
          )
        }
      }
      if (creditApplied && discount?.kind === "gift") {
        try {
          await stripe.customers.createBalanceTransaction(customerId, {
            amount: discount.cents,
            currency: "eur",
            description: `Dovanų kortelė ${discount.code} (atšaukta)`,
          })
          await supabase
            .from("gift_cards")
            .update({
              status: "active",
              redeemed_at: null,
              redeemed_by_user_id: null,
            })
            .eq("code", discount.code)
            .eq("redeemed_by_user_id", user.id)
        } catch (undoErr) {
          console.error(
            `change-subscription: failed to undo gift card ${discount.code}:`,
            (undoErr as Error).message
          )
        }
      }
      throw swapErr
    }

    if (discount?.kind === "coupon") {
      // The swap already succeeded, so a lost count must not fail the request.
      const { error: redeemError } = await supabase.rpc("redeem_coupon", {
        p_code: discount.code,
      })
      if (redeemError) {
        console.error(
          `change-subscription: redeem_coupon ${discount.code} failed:`,
          redeemError.message
        )
      }
    }

    return json({ changed: true })
  } catch (err) {
    console.error("change-subscription failed:", (err as Error).message)
    return json({ error: (err as Error).message }, 400)
  }
})
