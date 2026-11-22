import Stripe from "https://esm.sh/stripe@14.21.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { enqueueAdminNotification } from "../_shared/admin-notifications.ts"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
})

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!
const omnisendApiKey = Deno.env.get("OMNISEND_API_KEY")

const planKeys = new Set([
  "mystery_s",
  "nano",
  "mystery_m",
  "mini",
  "standard",
  "pro",
  "mega",
])

type SubscriberStatus = "active" | "paused" | "cancelled"

const statusMap: Record<string, SubscriberStatus> = {
  active: "active",
  trialing: "active",
  past_due: "paused",
  paused: "paused",
  incomplete: "paused",
  unpaid: "paused",
  canceled: "cancelled",
  incomplete_expired: "cancelled",
}

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

function toSubscriberStatus(
  stripeStatus: string | null | undefined
): SubscriberStatus {
  return statusMap[stripeStatus ?? ""] ?? "active"
}

function parseHomeDelivery(
  value: string | null | undefined
): boolean | undefined {
  if (value == null) return undefined
  return value === "true"
}

function parsePlanKey(value: string | null | undefined) {
  return value && planKeys.has(value) ? value : undefined
}

// Returns false only for a failure worth retrying (rate limit, server error),
// so a caller that must deliver the event can have Stripe retry.
async function pushOmnisendEvent(
  eventName: string,
  email: string,
  properties: Record<string, unknown>
): Promise<boolean> {
  if (!omnisendApiKey) {
    console.error("OMNISEND_API_KEY is not configured; skipping event push")
    return true
  }

  const res = await fetch("https://api.omnisend.com/v5/events", {
    method: "POST",
    headers: {
      "X-API-KEY": omnisendApiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      eventName,
      origin: "api",
      contact: { email },
      properties,
    }),
  })

  if (!res.ok) {
    console.error(
      `Omnisend event push failed for "${eventName}": ${res.status} ${await res.text()}`
    )
    // Only a rate limit or server error is worth a Stripe retry; a rejected
    // request (bad address, invalid payload) would fail the same way forever.
    return res.status !== 429 && res.status < 500
  }
  return true
}

const DEFAULT_GIFT_CARD_MESSAGE =
  "Linkiu smagaus konstravimo - mėgaukis kiekviena detale!"

// A bought card is inserted as pending; it becomes spendable only once paid.
// Delayed methods complete the session unpaid and are activated on
// async_payment_succeeded instead.
async function handleGiftCardCheckout(session: Stripe.Checkout.Session) {
  if (
    session.payment_status !== "paid" &&
    session.payment_status !== "no_payment_required"
  ) {
    return
  }

  const { data: giftCard, error: loadError } = await supabase
    .from("gift_cards")
    .select(
      "code, status, amount_cents, recipient_email, buyer_email, message, expires_at, created_at"
    )
    .eq("stripe_session_id", session.id)
    .maybeSingle()
  if (loadError) {
    throw new Error(
      `Gift card for session ${session.id} not loaded: ${loadError.message}`
    )
  }
  // The row is saved before the buyer reaches Stripe, so a missing one is a
  // real fault: throw so Stripe retries rather than lose a paid card.
  if (!giftCard) {
    throw new Error(`No gift card row for paid session ${session.id}`)
  }
  // Already active means an earlier delivery sent the email.
  if (giftCard.status !== "pending") return

  // Email first, then activate: a failed email leaves the card pending and
  // the event is retried, so the recipient is never left without the code.
  const isSent = await pushOmnisendEvent(
    "gift card purchased",
    giftCard.recipient_email,
    {
      code: giftCard.code,
      amount: giftCard.amount_cents / 100,
      buyerEmail: giftCard.buyer_email,
      recipientEmail: giftCard.recipient_email,
      // The Omnisend template prints this verbatim in a quote box, so an
      // empty value would render as an empty „“ quote.
      message: giftCard.message?.trim() || DEFAULT_GIFT_CARD_MESSAGE,
      expiresAt: String(giftCard.expires_at).slice(0, 10),
      purchasedAt: giftCard.created_at,
      redeemUrl: `https://www.bricktime.lt/gift-cards?code=${encodeURIComponent(giftCard.code)}`,
    }
  )
  if (!isSent) {
    throw new Error(`Gift card email for session ${session.id} not sent`)
  }

  const { error: activateError } = await supabase
    .from("gift_cards")
    .update({ status: "active" })
    .eq("stripe_session_id", session.id)
    .eq("status", "pending")
  if (activateError) {
    throw new Error(
      `Gift card for session ${session.id} not activated: ${activateError.message}`
    )
  }
}

// Errors throw so Stripe retries the event; record_merch_order is idempotent
// on the session id, so a retry never double-counts stock.
async function handleMerchCheckout(session: Stripe.Checkout.Session) {
  // Delayed methods complete the session unpaid; the order is recorded when
  // async_payment_succeeded arrives. A fully discounted order needs no payment.
  if (
    session.payment_status !== "paid" &&
    session.payment_status !== "no_payment_required"
  ) {
    return
  }

  const lines = readMerchLines(session)
  if (!lines) {
    throw new Error(`Merch session ${session.id} is missing cart metadata`)
  }

  const shipping = session.shipping_details ?? null
  const customer = session.customer_details ?? null
  const email = customer?.email ?? session.customer_email ?? null
  const userId = session.metadata?.userId || null
  const isTerminal = session.metadata?.deliveryMethod === "terminal"

  const { data: isNew, error } = await supabase.rpc("record_merch_cart_order", {
    p_lines: lines,
    p_amount: (session.amount_total ?? 0) / 100,
    p_buyer_email: email,
    p_buyer_name: shipping?.name ?? customer?.name ?? null,
    p_buyer_phone: customer?.phone ?? null,
    p_shipping_address: shipping?.address ?? customer?.address ?? null,
    p_user_id: userId,
    p_stripe_session_id: session.id,
    p_stripe_payment_intent_id:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : null,
    p_delivery_method: isTerminal ? "terminal" : "courier",
    p_lp_terminal_id: isTerminal
      ? (session.metadata?.lpTerminalId ?? null)
      : null,
    p_lp_terminal_name: isTerminal
      ? (session.metadata?.lpTerminalName ?? null)
      : null,
  })
  if (error) {
    throw new Error(
      `record_merch_cart_order failed for session ${session.id}: ${error.message}`
    )
  }
  // Runs on every delivery: if marking the card used failed last time, the
  // retry still gets it. Safe to repeat — it only touches an active card.
  await redeemMerchGiftCard(session)
  if (!isNew) return

  await countMerchCoupon(session)
  if (!email) return

  const { data: order } = await supabase
    .from("merch_orders")
    .select(
      "order_number, item_name, size, amount, shipping_address, merch_order_items(item_name, size, quantity)"
    )
    .eq("stripe_session_id", session.id)
    .single()
  if (!order) return

  await pushOmnisendEvent("merch order placed", email, {
    orderNumber: order.order_number,
    itemName: order.item_name,
    size: order.size,
    amount: Number(order.amount),
    shippingAddress: order.shipping_address ?? {},
    items: (order.merch_order_items ?? []).map(
      (l: { item_name: string; size: string; quantity: number }) => ({
        itemName: l.item_name,
        size: l.size,
        quantity: l.quantity,
      })
    ),
  })
}

type MerchLine = { item_id: string; size: string; quantity: number }

// Sessions opened before the cart carry itemId/size instead of `cart`.
function readMerchLines(session: Stripe.Checkout.Session): MerchLine[] | null {
  const metadata = session.metadata ?? {}
  if (metadata.cart) {
    try {
      const parsed: unknown = JSON.parse(metadata.cart)
      if (!Array.isArray(parsed) || parsed.length === 0) return null
      return parsed.map((l: { i: string; s: string; q: number }) => ({
        item_id: l.i,
        size: l.s,
        quantity: l.q,
      }))
    } catch {
      return null
    }
  }
  if (metadata.itemId && metadata.size) {
    return [{ item_id: metadata.itemId, size: metadata.size, quantity: 1 }]
  }
  return null
}

// The card was held for this session at checkout, so finding it already used
// means something bypassed the hold — flag it for review rather than retry.
async function redeemMerchGiftCard(session: Stripe.Checkout.Session) {
  const giftCardCode = session.metadata?.giftCardCode
  if (giftCardCode) {
    const { data: redeemed, error } = await supabase
      .from("gift_cards")
      .update({
        status: "used",
        redeemed_at: new Date().toISOString(),
        redeemed_by_user_id: session.metadata?.userId || null,
        reserved_until: null,
      })
      .eq("code", giftCardCode)
      .eq("status", "active")
      .select("code")
    if (error) {
      throw new Error(
        `Gift card ${giftCardCode} not redeemed for merch session ${session.id}: ${error.message}`
      )
    }
    if (!redeemed?.length) {
      console.error(
        `Gift card ${giftCardCode} was not active when merch session ${session.id} completed`
      )
    }
  }
}

// Counted once, on the first delivery only — redeem_coupon is not idempotent.
// A coupon that ran out while checkout was open was already discounted, so
// it is flagged rather than retried.
async function countMerchCoupon(session: Stripe.Checkout.Session) {
  const couponCode = session.metadata?.couponCode
  if (couponCode) {
    const { error } = await supabase.rpc("redeem_coupon", {
      p_code: couponCode,
    })
    if (error) {
      // Keep the hold: it still stands in for this use until it lapses, so
      // max_uses is not exceeded while the miscount is looked into.
      console.error(
        `Coupon ${couponCode} not counted for merch session ${session.id}: ${error.message}`
      )
      return
    }
    // The use is now in uses_count, so the checkout's reservation must stop
    // counting against max_uses as well.
    // Only logged: this runs on the first delivery only, and throwing would
    // skip the order email on the retry. A leftover hold lapses on its own.
    const holdId = session.metadata?.couponHoldId
    if (holdId) {
      await deleteCouponHold(holdId, session.id).catch((e: Error) =>
        console.error(e.message)
      )
    }
  }
}

// A hold left behind would block the coupon's last use until it lapses.
async function deleteCouponHold(holdId: string, sessionId: string) {
  const { error } = await supabase
    .from("coupon_holds")
    .delete()
    .eq("id", holdId)
  if (error) {
    throw new Error(
      `Coupon hold ${holdId} not released for merch session ${sessionId}: ${error.message}`
    )
  }
}

function parseCartProductIds(value: string | undefined): number[] | null {
  if (!value) return null
  try {
    const parsed: unknown = JSON.parse(value)
    if (
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      parsed.every((id) => Number.isSafeInteger(id))
    ) {
      return parsed as number[]
    }
  } catch {
    // Falls through to null: the caller reports missing metadata.
  }
  return null
}

// Rental rule violations (inactive, paused, over budget, tier, address, out of
// stock). Retrying can't fix these, so the fee is refunded instead.
const RENTAL_REFUSED_CODES = new Set(["42501", "23514"])

// The courier fee is paid; create the rental it was paid for. The rules are
// checked again because budget or stock may have changed since the session
// opened. Errors throw so Stripe retries; the RPC is idempotent per session.
async function handleRentalCourierCheckout(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") return
  const userId = session.metadata?.userId
  const cartProductIds = parseCartProductIds(session.metadata?.productIds)
  const productId = Number(session.metadata?.productId)
  if (!userId || (!cartProductIds && !Number.isSafeInteger(productId))) {
    throw new Error(
      `Rental courier session ${session.id} is missing userId/productId metadata`
    )
  }

  // One fee can cover a whole set cart; then every rental is created at once.
  const { error } = cartProductIds
    ? await supabase.rpc("record_paid_courier_rentals", {
        p_subscriber_id: userId,
        p_product_ids: cartProductIds,
        p_stripe_session_id: session.id,
        p_amount: (session.amount_total ?? 0) / 100,
      })
    : await supabase.rpc("record_paid_courier_rental", {
        p_subscriber_id: userId,
        p_product_id: productId,
        p_stripe_session_id: session.id,
        p_amount: (session.amount_total ?? 0) / 100,
      })
  if (!error) return

  if (!RENTAL_REFUSED_CODES.has(error.code ?? "")) {
    throw new Error(
      `record_paid_courier_rental failed for session ${session.id}: ${error.message}`
    )
  }

  console.error("Paid courier rental refused, refunding the fee", {
    userId,
    productId,
    sessionId: session.id,
    reason: error.message,
  })
  if (typeof session.payment_intent !== "string") {
    throw new Error(
      `Rental courier session ${session.id} has no payment intent`
    )
  }
  await stripe.refunds.create(
    { payment_intent: session.payment_intent },
    { idempotencyKey: `rental-courier-refund-${session.id}` }
  )
}

// The courier fee for a Mystery Box request is paid; create the request. Same
// refuse-and-refund handling as rental courier fees: rule violations can't be
// fixed by retrying, other errors throw so Stripe retries (RPC is idempotent).
async function handleMysteryCourierCheckout(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") return
  const userId = session.metadata?.userId
  if (!userId) {
    throw new Error(`Mystery courier session ${session.id} is missing userId metadata`)
  }

  const { error } = await supabase.rpc("record_paid_mystery_courier", {
    p_subscriber_id: userId,
    p_stripe_session_id: session.id,
    p_amount: (session.amount_total ?? 0) / 100,
  })
  if (!error) return

  if (!RENTAL_REFUSED_CODES.has(error.code ?? "")) {
    throw new Error(
      `record_paid_mystery_courier failed for session ${session.id}: ${error.message}`
    )
  }

  console.error("Paid Mystery Box request refused, refunding the fee", {
    userId,
    sessionId: session.id,
    reason: error.message,
  })
  // Recorded before the refund so a redelivery can't later turn this refused
  // payment into a request (record_paid_mystery_courier honours the record).
  const { error: rejectError } = await supabase
    .from("rejected_checkout_sessions")
    .upsert(
      { session_id: session.id, reason: error.message },
      { onConflict: "session_id", ignoreDuplicates: true }
    )
  if (rejectError) {
    throw new Error(
      `Recording the refused session ${session.id} failed: ${rejectError.message}`
    )
  }
  if (typeof session.payment_intent !== "string") {
    throw new Error(`Mystery courier session ${session.id} has no payment intent`)
  }
  await stripe.refunds.create(
    { payment_intent: session.payment_intent },
    { idempotencyKey: `mystery-courier-refund-${session.id}` }
  )
}

// Members can no longer write penalty columns themselves, so the paid
// penalty is cleared here. Errors throw so Stripe retries the event.
async function handlePenaltyCheckout(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  if (!userId || session.payment_status !== "paid") return

  const { data: subscriber, error: loadError } = await supabase
    .from("subscribers")
    .select("penalty_amount")
    .eq("id", userId)
    .maybeSingle()
  if (loadError) {
    throw new Error(
      `Loading penalty for ${userId} failed: ${loadError.message}`
    )
  }
  // A cleared penalty falls through to resolving the record, so a retry after
  // a failure below still finishes the job instead of returning early.
  if (subscriber?.penalty_amount) {
    // An admin may have raised the penalty after this session was created, so
    // an older, smaller payment must not clear it.
    const owedCents = Math.round(Number(subscriber.penalty_amount) * 100)
    if (session.currency !== "eur" || (session.amount_total ?? 0) < owedCents) {
      console.error("Penalty payment does not cover the current penalty", {
        userId,
        sessionId: session.id,
        paidCents: session.amount_total,
        owedCents,
      })
      return
    }

    // Compare-and-set: if an admin changed the amount since the read above,
    // nothing is cleared.
    const { data: cleared, error: clearError } = await supabase
      .from("subscribers")
      .update({ penalty_amount: null, penalty_reason: null })
      .eq("id", userId)
      .eq("penalty_amount", subscriber.penalty_amount)
      .select("id")
    if (clearError) {
      throw new Error(
        `Clearing penalty for ${userId} failed: ${clearError.message}`
      )
    }
    if (!cleared?.length) {
      console.error("Penalty changed before it could be cleared", {
        userId,
        sessionId: session.id,
      })
      return
    }
  }

  // Only the record create-penalty-checkout attached to this session; a
  // forgiven or already-paid record is no longer pending, so this is a no-op.
  const penaltyRecordId = session.metadata?.penaltyRecordId
  if (!penaltyRecordId) {
    console.error("Penalty session has no penalty record to resolve", {
      userId,
      sessionId: session.id,
    })
    return
  }

  const { error: resolveError } = await supabase
    .from("subscriber_penalties")
    .update({ status: "paid", resolved_at: new Date().toISOString() })
    .eq("id", penaltyRecordId)
    .eq("status", "pending")
  if (resolveError) {
    throw new Error(
      `Resolving penalty record ${penaltyRecordId} failed: ${resolveError.message}`
    )
  }
}

async function findSubscriber(args: {
  userId?: string | null
  email?: string | null
  customerId?: string | null
  subscriptionId?: string | null
}) {
  if (args.subscriptionId) {
    const { data } = await supabase
      .from("subscribers")
      .select("id")
      .eq("stripe_subscription_id", args.subscriptionId)
      .maybeSingle()
    if (data) return data
  }

  if (args.customerId) {
    const { data } = await supabase
      .from("subscribers")
      .select("id")
      .eq("stripe_customer_id", args.customerId)
      .maybeSingle()
    if (data) return data
  }

  if (args.userId) {
    const { data } = await supabase
      .from("subscribers")
      .select("id")
      .eq("id", args.userId)
      .maybeSingle()
    if (data) return data
  }

  if (args.email) {
    const { data } = await supabase
      .from("subscribers")
      .select("id")
      .eq("email", args.email)
      .maybeSingle()
    if (data) return data
  }

  return null
}

// True when the subscriber's stored subscription is a different, still-live
// one: then an event for `subscriptionId` (a duplicate) must not change the row.
async function isStoredSubscriptionOtherLive(
  subscriberId: string,
  subscriptionId: string
): Promise<boolean> {
  const { data: current, error } = await supabase
    .from("subscribers")
    .select("stripe_subscription_id, status")
    .eq("id", subscriberId)
    .maybeSingle()
  // Fail closed: Stripe retries the event rather than risk a duplicate's
  // data overwriting the row.
  if (error) {
    throw new Error(
      `Loading stored subscription for ${subscriberId} failed: ${error.message}`
    )
  }
  const isOtherLive = Boolean(
    current?.stripe_subscription_id &&
    current.stripe_subscription_id !== subscriptionId &&
    (current.status === "active" || current.status === "paused")
  )
  if (isOtherLive) {
    console.error(
      `Ignoring subscription ${subscriptionId} for subscriber ${subscriberId}: stored subscription ${current?.stripe_subscription_id} is still live. Check for a duplicate subscription in Stripe.`
    )
  }
  return isOtherLive
}

async function updateSubscriberByStripeIds(
  subscription: Stripe.Subscription,
  fallbackEmail?: string | null
) {
  const metadata = subscription.metadata ?? {}
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id
  const planKey = parsePlanKey(metadata.planKey)
  const homeDelivery = parseHomeDelivery(metadata.homeDelivery)
  const subscriber = await findSubscriber({
    userId: metadata.userId,
    email: fallbackEmail,
    customerId,
    subscriptionId: subscription.id,
  })

  if (!subscriber) return

  // A member with two live subscriptions (created before create-checkout
  // refused duplicates) would otherwise flip between them on every event.
  // While the stored one is live, only its own events may change the row.
  if (await isStoredSubscriptionOtherLive(subscriber.id, subscription.id)) {
    return
  }

  const { data: stored } = await supabase
    .from("subscribers")
    .select("current_period_start, paused_until")
    .eq("id", subscriber.id)
    .maybeSingle()

  const update: Record<string, unknown> = {
    stripe_customer_id: customerId ?? null,
    stripe_subscription_id: subscription.id,
    status: toSubscriberStatus(subscription.status),
    cancel_at: subscription.cancel_at
      ? new Date(subscription.cancel_at * 1000).toISOString()
      : null,
  }

  // Anchor for the budget rule (see public.used_credits). Stripe doesn't
  // order webhooks, so an older snapshot must not move the period back.
  const periodStartMs = subscription.current_period_start * 1000
  const storedPeriodStartMs = stored?.current_period_start
    ? Date.parse(stored.current_period_start)
    : Number.NEGATIVE_INFINITY
  if (periodStartMs >= storedPeriodStartMs) {
    update.current_period_start = new Date(periodStartMs).toISOString()
    update.current_period_end = new Date(
      subscription.current_period_end * 1000
    ).toISOString()
  }

  // pause-subscription stores when rentals may start again, which is later
  // than Stripe's resumes_at (the skipped months are unpaid); keep the later.
  const storedPausedUntilMs = stored?.paused_until
    ? Date.parse(stored.paused_until)
    : null
  if (subscription.pause_collection) {
    const resumesAtMs = subscription.pause_collection.resumes_at
      ? subscription.pause_collection.resumes_at * 1000
      : Number.POSITIVE_INFINITY
    const isStoredLater =
      storedPausedUntilMs !== null &&
      (Number.isNaN(storedPausedUntilMs) || storedPausedUntilMs >= resumesAtMs)
    if (!isStoredLater) {
      update.paused_until = Number.isFinite(resumesAtMs)
        ? new Date(resumesAtMs).toISOString()
        : "infinity"
    }
  } else if (storedPausedUntilMs !== null) {
    // Only after a pause that reached this period: a voided latest invoice
    // then means a skipped, unpaid month, so the block lasts until it ends.
    const isPauseInThisPeriod =
      Number.isNaN(storedPausedUntilMs) ||
      storedPausedUntilMs >= subscription.current_period_start * 1000
    const latestInvoiceId =
      typeof subscription.latest_invoice === "string"
        ? subscription.latest_invoice
        : subscription.latest_invoice?.id
    const latestInvoice =
      isPauseInThisPeriod && latestInvoiceId
        ? await stripe.invoices.retrieve(latestInvoiceId)
        : null
    update.paused_until =
      latestInvoice?.status === "void"
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null
  }

  if (planKey) update.plan = planKey
  if (homeDelivery !== undefined) update.home_delivery = homeDelivery

  // A scheduled downgrade has landed once the subscription carries its plan;
  // a cancelled subscription has nothing left to wait for.
  const { data: pending } = await supabase
    .from("subscribers")
    .select("pending_plan")
    .eq("id", subscriber.id)
    .maybeSingle()
  if (
    (planKey && pending?.pending_plan === planKey) ||
    update.status === "cancelled"
  ) {
    update.pending_plan = null
    update.pending_home_delivery = null
    update.pending_schedule_id = null
  }
  if (update.status === "cancelled") {
    update.cancel_requested = false
    update.paused_until = null
  }

  await supabase.from("subscribers").update(update).eq("id", subscriber.id)
}

async function handleSubscriptionCheckout(session: Stripe.Checkout.Session) {
  if (
    session.payment_status !== "paid" &&
    session.payment_status !== "no_payment_required"
  ) {
    return
  }

  // Redeem only once the session completes — creating it must not burn the card.
  const giftCardCode = session.metadata?.giftCardCode
  if (giftCardCode) {
    const { data: redeemed, error: redeemError } = await supabase
      .from("gift_cards")
      .update({
        status: "used",
        redeemed_at: new Date().toISOString(),
        redeemed_by_user_id: session.client_reference_id,
        reserved_until: null,
        reserved_by: null,
      })
      .eq("code", giftCardCode)
      .eq("status", "active")
      .select("code")
    if (redeemError) throw redeemError
    // Zero rows means another checkout redeemed the card first; the
    // discount was already granted, so flag it for manual review.
    if (!redeemed?.length) {
      console.error(
        `Gift card ${giftCardCode} already redeemed; session ${session.id} was discounted`
      )
    }
  }

  // Count the coupon use only once the session completes. Failure means
  // the coupon ran out while this checkout was open; the discount was
  // already granted, so flag it for manual review rather than failing.
  const couponCode = session.metadata?.couponCode
  if (couponCode) {
    const { error: couponError } = await supabase.rpc("redeem_coupon", {
      p_code: couponCode,
    })
    if (couponError) {
      console.error(
        `Coupon ${couponCode} not counted for session ${session.id}: ${couponError.message}`
      )
    }
  }

  const planKey = parsePlanKey(session.metadata?.planKey)
  const homeDelivery = parseHomeDelivery(session.metadata?.homeDelivery)
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id

  const subscriber = await findSubscriber({
    userId: session.client_reference_id,
    email: session.customer_details?.email ?? session.customer_email,
    customerId,
    subscriptionId,
  })

  // Same rule as updateSubscriberByStripeIds: while the stored
  // subscription is live, a different one must not take over the row.
  const isOtherLive =
    subscriber &&
    subscriptionId &&
    (await isStoredSubscriptionOtherLive(subscriber.id, subscriptionId))

  // Stripe delivers events at least once, so a repeat must not email again:
  // the welcome goes out only when this subscription is not stored yet.
  const { data: storedBefore } = subscriber
    ? await supabase
        .from("subscribers")
        .select("stripe_subscription_id")
        .eq("id", subscriber.id)
        .maybeSingle()
    : { data: null }
  const isFirstDelivery =
    storedBefore?.stripe_subscription_id !== subscriptionId

  if (subscriber && !isOtherLive) {
    const update: Record<string, unknown> = {
      status: "active",
      stripe_customer_id: customerId ?? null,
      stripe_subscription_id: subscriptionId ?? null,
      cancel_at: null,
      paused_until: null,
    }

    if (planKey) update.plan = planKey
    if (homeDelivery !== undefined) update.home_delivery = homeDelivery

    await supabase.from("subscribers").update(update).eq("id", subscriber.id)
  }

  // Not thrown on failure: the rows above are already written and a Stripe
  // retry would redeem the coupon and gift card a second time.
  const email = session.customer_details?.email ?? session.customer_email

  // Not behind isFirstDelivery: a subscription event or invoice.paid may have
  // stored the id first, and the alert must still go out. The subscription-keyed
  // dedupe_key already makes a repeat delivery a no-op.
  if (email && !isOtherLive) {
    await enqueueAdminNotification(
      supabase,
      "subscription_started",
      {
        email,
        plan: planKey,
        amount:
          session.amount_total == null ? undefined : session.amount_total / 100,
      },
      `subscription_started:${subscriptionId ?? session.id}`
    )
  }

  if (email && !isOtherLive && isFirstDelivery) {
    await sendWelcomeEvent(
      session,
      email,
      planKey,
      homeDelivery,
      subscriptionId
    )
  }
}

const formatLtDate = (date: Date) => date.toLocaleDateString("lt-LT")

// Everything the welcome email shows is sent as event properties, so the
// Omnisend template only places them. Lookups that fail fall back to blanks
// rather than blocking the email.
async function sendWelcomeEvent(
  session: Stripe.Checkout.Session,
  email: string,
  planKey: string | undefined,
  homeDelivery: boolean | undefined,
  subscriptionId: string | undefined
) {
  let planName = ""
  if (planKey) {
    const { data: plan } = await supabase
      .from("plans")
      .select("name")
      .eq("id", planKey)
      .maybeSingle()
    planName = plan?.name ?? ""
  }

  let nextPaymentAt = ""
  let monthlyPrice = ""
  if (subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      nextPaymentAt = formatLtDate(
        new Date(subscription.current_period_end * 1000)
      )
      // The recurring price before any one-off discount, per month.
      const cents = subscription.items.data.reduce(
        (sum: number, item: Stripe.SubscriptionItem) =>
          sum + (item.price.unit_amount ?? 0) * (item.quantity ?? 1),
        0
      )
      const isYearly =
        subscription.items.data[0]?.price.recurring?.interval === "year"
      monthlyPrice = (cents / (isYearly ? 12 : 1) / 100).toFixed(2)
    } catch (e) {
      console.error(
        `Welcome email: subscription ${subscriptionId} not loaded`,
        e
      )
    }
  }

  // Omnisend automations cannot attach files, so the template links the same
  // invoice the account's orders page offers. Blank when Stripe has no invoice
  // yet (e.g. a fully credit-covered first month) rather than blocking the email.
  let invoicePdfUrl = ""
  let invoiceUrl = ""
  const invoiceId =
    typeof session.invoice === "string" ? session.invoice : session.invoice?.id
  if (invoiceId) {
    try {
      const invoice = await stripe.invoices.retrieve(invoiceId)
      invoicePdfUrl = invoice.invoice_pdf ?? ""
      invoiceUrl = invoice.hosted_invoice_url ?? ""
    } catch (e) {
      console.error(`Welcome email: invoice ${invoiceId} not loaded`, e)
    }
  }

  await pushOmnisendEvent("subscription started", email, {
    invoicePdfUrl,
    invoiceUrl,
    planKey: planKey ?? "",
    planName,
    status: "Aktyvi",
    billing: session.metadata?.billing ?? "monthly",
    homeDelivery: homeDelivery ?? false,
    amountPaid: (session.amount_total ?? 0) / 100,
    monthlyPrice,
    activatedAt: formatLtDate(new Date()),
    nextPaymentAt,
    catalogUrl: "https://www.bricktime.lt/archive",
  })
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" })
  }

  const signature = req.headers.get("stripe-signature")
  if (!signature) {
    return json(400, { error: "Missing Stripe signature" })
  }

  const payload = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      payload,
      signature,
      webhookSecret
    )
  } catch (error) {
    return json(400, {
      error: `Webhook signature verification failed: ${(error as Error).message}`,
    })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === "payment" && session.metadata?.code) {
          await handleGiftCardCheckout(session)
          break
        }

        if (
          session.mode === "payment" &&
          session.metadata?.type === "penalty"
        ) {
          await handlePenaltyCheckout(session)
          break
        }

        if (session.mode === "payment" && session.metadata?.type === "merch") {
          await handleMerchCheckout(session)
          break
        }

        if (
          session.mode === "payment" &&
          session.metadata?.type === "rental_courier"
        ) {
          await handleRentalCourierCheckout(session)
          break
        }

        if (
          session.mode === "payment" &&
          session.metadata?.type === "mystery_courier"
        ) {
          await handleMysteryCourierCheckout(session)
          break
        }

        if (session.mode === "subscription") {
          await handleSubscriptionCheckout(session)
        }
        break
      }

      // Delayed payment methods complete the session unpaid and settle later.
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.metadata?.type === "penalty") {
          await handlePenaltyCheckout(session)
        }
        if (session.metadata?.type === "merch") {
          await handleMerchCheckout(session)
        }
        if (session.metadata?.type === "rental_courier") {
          await handleRentalCourierCheckout(session)
        }
        if (session.metadata?.type === "mystery_courier") {
          await handleMysteryCourierCheckout(session)
        }
        if (session.mode === "payment" && session.metadata?.code) {
          await handleGiftCardCheckout(session)
        }
        if (session.mode === "subscription") {
          await handleSubscriptionCheckout(session)
        }
        break
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const snapshot = event.data.object as Stripe.Subscription
        // Stripe doesn't order events, so an early "incomplete" snapshot can
        // arrive after the paid one and flip the member to paused. Read the
        // live subscription instead (the client pins the API version).
        const subscription =
          event.type === "customer.subscription.deleted"
            ? snapshot
            : await stripe.subscriptions.retrieve(snapshot.id)
        let fallbackEmail: string | null = null

        if (typeof subscription.customer === "string") {
          const customer = await stripe.customers.retrieve(
            subscription.customer
          )
          if (!customer.deleted) {
            fallbackEmail = customer.email
          }
        }

        // Replacing subscription A with B deletes A while B owns the row; that
        // is not a member leaving, so it must not raise a cancellation alert.
        let isReplaced = false
        if (event.type === "customer.subscription.deleted") {
          const owner = await findSubscriber({
            userId: subscription.metadata?.userId,
            email: fallbackEmail,
            customerId:
              typeof subscription.customer === "string"
                ? subscription.customer
                : subscription.customer?.id,
            subscriptionId: subscription.id,
          })
          isReplaced = Boolean(
            owner &&
              (await isStoredSubscriptionOtherLive(owner.id, subscription.id))
          )
        }

        await updateSubscriberByStripeIds(subscription, fallbackEmail)

        if (event.type === "customer.subscription.deleted" && !isReplaced) {
          await enqueueAdminNotification(
            supabase,
            "subscription_cancelled",
            { email: fallbackEmail },
            `subscription_cancelled:${subscription.id}`
          )
        }
        break
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice
        if (!invoice.subscription) break

        const subscriptionId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription.id
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        await updateSubscriberByStripeIds(subscription, invoice.customer_email)
        break
      }

      // Stripe sends this ahead of a renewal (lead time set in Billing
      // settings); the reminder email itself lives in Omnisend.
      case "invoice.upcoming": {
        const invoice = event.data.object as Stripe.Invoice
        if (!invoice.customer_email || !invoice.subscription) break
        if ((invoice.amount_due ?? 0) <= 0) break
        const chargeAtSeconds =
          invoice.next_payment_attempt ?? invoice.period_end
        const isSent = await pushOmnisendEvent(
          "subscription payment upcoming",
          invoice.customer_email,
          {
            amountDue: ((invoice.amount_due ?? 0) / 100).toFixed(2),
            chargeAt: formatLtDate(new Date(chargeAtSeconds * 1000)),
            accountUrl: "https://www.bricktime.lt/account",
          }
        )
        if (!isSent) {
          return json(500, { error: "Omnisend event push failed" })
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id
        const subscriptionId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription?.id
        const subscriber = await findSubscriber({
          email: invoice.customer_email,
          customerId,
          subscriptionId,
        })

        const isOtherLive =
          subscriber &&
          subscriptionId &&
          (await isStoredSubscriptionOtherLive(subscriber.id, subscriptionId))
        // A failed invoice of a subscription the member has since replaced is
        // not news, same as for the pause below. Queued before the Omnisend
        // push, whose failure returns early for a Stripe retry; the
        // invoice-keyed dedupe makes the repeat harmless.
        if (!isOtherLive) {
          // An invoice can lack customer_email; the alert is useless without
          // who it concerns, so fall back to the Stripe customer's address.
          let alertEmail = invoice.customer_email
          if (!alertEmail && customerId) {
            try {
              const customer = await stripe.customers.retrieve(customerId)
              if (!customer.deleted) alertEmail = customer.email
            } catch (error) {
              console.error(`Customer ${customerId} email lookup failed:`, error)
            }
          }
          await enqueueAdminNotification(
            supabase,
            "payment_failed",
            { email: alertEmail, amount: invoice.amount_due / 100 },
            `payment_failed:${invoice.id}`
          )
        }

        if (subscriber && !isOtherLive) {
          await supabase
            .from("subscribers")
            .update({ status: "paused" })
            .eq("id", subscriber.id)

          if (invoice.customer_email) {
            const isSent = await pushOmnisendEvent(
              "subscription payment failed",
              invoice.customer_email,
              {
                amountDue: ((invoice.amount_due ?? 0) / 100).toFixed(2),
                accountUrl: "https://www.bricktime.lt/account",
              }
            )
            if (!isSent) {
              return json(500, { error: "Omnisend event push failed" })
            }
          }
        }
        break
      }

      default:
        break
    }

    return json(200, { received: true })
  } catch (error) {
    console.error("Stripe webhook handling failed:", error)
    return json(500, { error: (error as Error).message })
  }
})
