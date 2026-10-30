import Stripe from "https://esm.sh/stripe@14.21.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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

async function pushOmnisendEvent(
  eventName: string,
  email: string,
  properties: Record<string, unknown>
) {
  if (!omnisendApiKey) {
    console.error("OMNISEND_API_KEY is not configured; skipping event push")
    return
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
  }
}

async function handleGiftCardCheckout(session: Stripe.Checkout.Session) {
  const { data: giftCard } = await supabase
    .from("gift_cards")
    .select(
      "code, amount_cents, recipient_email, buyer_email, message, expires_at, created_at"
    )
    .eq("stripe_session_id", session.id)
    .maybeSingle()

  if (!giftCard) return

  await pushOmnisendEvent("gift card purchased", giftCard.recipient_email, {
    code: giftCard.code,
    amount: giftCard.amount_cents / 100,
    buyerEmail: giftCard.buyer_email,
    recipientEmail: giftCard.recipient_email,
    message: giftCard.message ?? "",
    expiresAt: giftCard.expires_at,
    purchasedAt: giftCard.created_at,
    redeemUrl: `https://www.bricktime.lt/gift-cards?code=${encodeURIComponent(giftCard.code)}`,
  })
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

  const update: Record<string, unknown> = {
    stripe_customer_id: customerId ?? null,
    stripe_subscription_id: subscription.id,
    status: toSubscriberStatus(subscription.status),
    cancel_at: subscription.cancel_at
      ? new Date(subscription.cancel_at * 1000).toISOString()
      : null,
  }

  if (planKey) update.plan = planKey
  if (homeDelivery !== undefined) update.home_delivery = homeDelivery

  await supabase.from("subscribers").update(update).eq("id", subscriber.id)
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

        if (session.mode !== "subscription") break

        // Redeem only once the session completes — creating it must not burn the card.
        const giftCardCode = session.metadata?.giftCardCode
        if (giftCardCode) {
          const { data: redeemed, error: redeemError } = await supabase
            .from("gift_cards")
            .update({
              status: "used",
              redeemed_at: new Date().toISOString(),
              redeemed_by_user_id: session.client_reference_id,
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

        if (subscriber) {
          const update: Record<string, unknown> = {
            status: "active",
            stripe_customer_id: customerId ?? null,
            stripe_subscription_id: subscriptionId ?? null,
            cancel_at: null,
          }

          if (planKey) update.plan = planKey
          if (homeDelivery !== undefined) update.home_delivery = homeDelivery

          await supabase
            .from("subscribers")
            .update(update)
            .eq("id", subscriber.id)
        }
        break
      }

      // Delayed payment methods complete the session unpaid and settle later.
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.metadata?.type === "penalty") {
          await handlePenaltyCheckout(session)
        }
        break
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        let fallbackEmail: string | null = null

        if (typeof subscription.customer === "string") {
          const customer = await stripe.customers.retrieve(
            subscription.customer
          )
          if (!customer.deleted) {
            fallbackEmail = customer.email
          }
        }

        await updateSubscriberByStripeIds(subscription, fallbackEmail)
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

        if (subscriber) {
          await supabase
            .from("subscribers")
            .update({ status: "paused" })
            .eq("id", subscriber.id)
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
