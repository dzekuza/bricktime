---
tags: [architecture, codebase-map]
updated: 2026-11-16
synced_commit: a985f7f
---

# Billing edge functions

### Billing edge functions — `supabase/functions/` (subscription and payment half)

Purpose: everything that creates, changes, pauses, cancels or reconciles a subscription in Stripe and mirrors the result into `subscribers`. Domain terms: **plan** (tier key `mystery_s`, `nano`, `mystery_m`, `mini`, `standard`, `pro`, `mega`; `pro` was retired by migration `20260805250000`), **budget / credits** (monthly € value of sets a member may hold), **held sets** (orders not `returned`), **plan change** (immediate swap, or scheduled downgrade), **penalty** (a charge on `subscribers`/`subscriber_penalties`), **pause** (1 to 3 voided monthly renewals).

Interface: every function is `POST /functions/v1/<name>`, CORS-enabled, JSON in and out, errors as `{ error: string }` (Lithuanian text for member-facing rules). Identity comes from the caller's JWT, never from a body `userId`. `stripe-webhook` and `process-plan-changes` are not user-callable: signature header `stripe-signature` and header `x-cron-secret` respectively. Invariants: no downgrade while sets are held (`assertNoDowngradeWhileHolding`); one live subscription per customer (`create-checkout` fails closed); cancel/pause only when all sets are returned; prices are gross, 21% LT VAT is inclusive (`getVatTaxRateId`); Checkout sessions carry `locale: "lt"`.

Depends on: [[database-module]] (tables `subscribers`, `plans`, `coupons`, `gift_cards`, `orders`, `cron_secrets`; RPCs `redeem_coupon`, `held_brick_value`, `begin_subscription_pause`), external: Stripe, Omnisend, Supabase.
Used by: [[storefront-pages]] (`Account.tsx`, `Checkout.tsx`, `Subscribe.tsx`), `PlanChangeSummary`, `DeleteAccountDialog`, Stripe, `pg_cron`.

<!-- auto:start module=billing-edge -->
| Function / export | File:line | Signature (one line) | Does | Called from |
|---|---|---|---|---|
| `stripe-webhook` (handler) | `supabase/functions/stripe-webhook/index.ts:812` | `Deno.serve(req)` POST, verifies `stripe-signature` | Dispatches Stripe events: `checkout.session.completed` (branches on `metadata.type`: merch, penalty, `rental_courier`, subscription mode), `checkout.session.async_payment_succeeded` (merch, `rental_courier`, gift card), `customer.subscription.created/updated/deleted`, `invoice.paid`, `invoice.payment_failed`; other events fall to `default: break` (still 7 `case` labels, no new event since `7e98519`) | Stripe (webhook endpoint) |
| `handleSubscriptionCheckout` | `stripe-webhook/index.ts:637` | `(session) => Promise<void>` | Stores Stripe ids, plan, status, delivery, redeems coupon, sends welcome event | webhook |
| `handleGiftCardCheckout` | `stripe-webhook/index.ts:107` | `(session) => Promise<void>` | Marks a paid gift card active, emails via Omnisend; an empty buyer message is replaced by `DEFAULT_GIFT_CARD_MESSAGE` (line 101) so the template quote box is never empty (PR #111) | webhook |
| `handleMerchCheckout` | `stripe-webhook/index.ts:171` | `(session) => Promise<void>` | `rpc record_merch_order` (idempotent), redeems gift card, counts coupon once | webhook |
| `handlePenaltyCheckout` | `stripe-webhook/index.ts:368` | `(session) => Promise<void>` | Clears a paid penalty |
| `handleRentalCourierCheckout` | `stripe-webhook/index.ts:325` | `(session) => Promise<void>` | Paid `rental_courier` session: `rpc record_paid_courier_rental` (idempotent per session); if SQLSTATE `42501` or `23514` (`RENTAL_REFUSED_CODES`, line 320) the rental is refused and the fee refunded with `stripe.refunds.create` (idempotency key `rental-courier-refund-<session>`); other errors throw so Stripe retries | webhook | webhook |
| `updateSubscriberByStripeIds` | `stripe-webhook/index.ts:519` | `(subscription, fallbackEmail) => Promise<void>` | Mirrors Stripe subscription state to `subscribers`; never moves billing period back | webhook |
| `isStoredSubscriptionOtherLive` | `stripe-webhook/index.ts:490` | `(subscriberId, subscriptionId) => Promise<boolean>` | Guard so a stale subscription event cannot overwrite the live one | webhook |
| `findSubscriber` | `stripe-webhook/index.ts:443` | `({email, customerId, subscriptionId}) => Promise<...>` | Locates the row by ids, then email | webhook |
| `redeemMerchGiftCard`, `countMerchCoupon`, `deleteCouponHold` | `stripe-webhook/index.ts:248,278,306` | internal | Post-payment coupon / gift card accounting | webhook |
| `sendWelcomeEvent`, `pushOmnisendEvent` | `stripe-webhook/index.ts:756,66` | internal | Omnisend event `subscription started`; retried only on 429/5xx | webhook |
| `create-checkout` | `create-checkout/index.ts:33` | POST body `{planKey, billing, successUrl, cancelUrl, giftCardCode, couponCode, homeDelivery}` -> Checkout URL | Creates the subscription Checkout session; holds gift card 35 min; blocks duplicates and downgrades | `Subscribe.tsx`, `Checkout.tsx`, `Account.tsx` |
| `create-rental-courier-checkout` | `create-rental-courier-checkout/index.ts:54` | POST `{productId, successUrl, cancelUrl}` -> `{url}` (JWT required) | One-off Checkout (mode `payment`, card only, `locale: lt`, 30 min TTL) for the 3 EUR (`COURIER_FEE_CENTS = 300`) courier fee of one rental, with the 21% inclusive VAT rate; refuses with 400 when the plan is `mega` or `home_delivery` is already on; dry-runs `rpc record_paid_courier_rental` (`p_dry_run`) so no payment is taken for a rental the rules would refuse; reuses the stored Stripe customer only if its email matches (`getOwnedCustomerId`, line 35); metadata `type=rental_courier`, `userId`, `productId`. The rental itself is created later by the webhook | `Checkout.tsx` |
| `holdGiftCard`, `releaseGiftCard` | `create-checkout/index.ts:362,401` | internal | Conditional UPDATE hold on `gift_cards.reserved_until` | create-checkout |
| `change-subscription` | `change-subscription/index.ts:284` | POST body `{planKey, billing, homeDelivery, code, withdrawPending, preview}` | Immediate plan swap (upgrade gap invoiced first, flat price diff) or scheduled downgrade; `preview` returns the charge without side effects | `Checkout.tsx`, `Account.tsx`, `PlanChangeSummary.tsx` |
| `resolveDiscountCode` | `change-subscription/index.ts:46` | `(supabase, code) => Promise<...>` | Server-side re-validation of coupon or gift card | change-subscription |
| `resolveChargeablePaymentMethod` | `change-subscription/index.ts:96` | `(stripe, subscription) => Promise<...>` | Picks a card for the gap invoice | change-subscription |
| `chargeUpgradeDifference`, `previewUpgrade` | `change-subscription/index.ts:127,168` | internal | Gap invoice settled before swap; preview mode | change-subscription |
| `cancel-subscription` | `cancel-subscription/index.ts:27` | POST `{undo?}` | Cancel at period end only when all sets returned, else `cancel_requested`; `undo` withdraws | `Account.tsx` |
| `pause-subscription` | `pause-subscription/index.ts:30` | POST `{months?, undo?}` | Voids 1 to 3 renewals via Stripe, blocks rentals through `rpc begin_subscription_pause` | `Account.tsx` (`PauseSubscription`) |
| `syncPausedUntil`, `addMonthsClamped` | `pause-subscription/index.ts:231,218` | internal | Mirror a racing Stripe pause; month arithmetic | pause-subscription |
| `process-plan-changes` | `process-plan-changes/index.ts:211` | POST, header `x-cron-secret` | Reconciles pending downgrade schedules and cancellations with held sets; idempotent | `pg_cron` (schedule not in repo, see [[data-flow]]) |
| `processRow`, `clearPending`, `isAuthorized`, `timingSafeEqual` | `process-plan-changes/index.ts:79,63,52,41` | internal | per-row reconcile, auth against `cron_secrets` | process-plan-changes |
| `create-billing-portal` | `create-billing-portal/index.ts:63` | POST -> `{url}` | Stripe portal for cards and invoices only (plan change and cancel disabled there) | `Account.tsx`, `Checkout.tsx` |
| `getPortalConfigurationId` | `create-billing-portal/index.ts:14` | internal | Finds/creates the restricted portal configuration | create-billing-portal |
| `get-billing-history` | `get-billing-history/index.ts:49` | POST -> invoices list | Lists invoices across the stored customer and legacy customers with the same confirmed email | `Account.tsx` (`PaymentHistory`) |
| `describeInvoice` | `get-billing-history/index.ts:28` | internal | Names plan-swap invoices from their lines | get-billing-history |
| `create-penalty-checkout` | `create-penalty-checkout/index.ts:38` | POST `{successUrl, cancelUrl}` -> Checkout URL | Payment Checkout for a `subscriber_penalties` row | `Account.tsx` |
| `getOwnedCustomerId` | `create-penalty-checkout/index.ts:17` | internal | Reuses stored customer only if Stripe confirms ownership by email | create-penalty-checkout |
| `flatUpgradeDiffCents` | `_shared/plan-change.ts:13` | `(items, newInterval, newTotalCents) => number \| null` | Flat monthly-to-monthly price gap; null falls back to Stripe proration | change-subscription; test `plan-change_test.ts` |
| `fitsWithinCredits`, `getHeldBrickValue`, `releaseSchedule`, `schedulePlanChange` | `_shared/plan-schedule.ts:9,13,27,42` | see file | Subscription-schedule helpers for downgrades; `rpc held_brick_value` | cancel, change, pause, process-plan-changes; test `plan-schedule_test.ts` |
| `assertNoDowngradeWhileHolding` | `_shared/downgrade-guard.ts:5` | `(supabase, userId, currentKey, newKey, newPrice) => Promise<void>` throws | Refuses cheaper plan while sets held | create-checkout, change-subscription |
| `applyCoupon` | `_shared/coupon.ts:12` | `(stripe, terms, monthlyPrice, monthsPerInterval) => {monthlyPrice, stripeCouponId}` | Open-ended coupon cuts price; timed coupon becomes a one-redemption Stripe coupon | create-checkout, change-subscription |
| `getVatTaxRateId` | `_shared/vat.ts:8` | `(stripe) => Promise<string>` | Finds or creates the 21% inclusive LT VAT rate | create-checkout, change-subscription |
<!-- auto:end -->

Counts: 10 user-facing handlers + webhook + cron handler, 6 shared exports groups (11 exported functions), about 21 internal helpers listed.

Notes (hand-written): the webhook is now 965 lines (was 901) and `change-subscription` 720; they are the highest-churn files in the last 90 days (25 and 20 commits). `async_payment_failed` is **not** handled in `stripe-webhook` (default branch ignores it, rechecked at `a985f7f`; the claim that it releases holds is in `meta/session-log.md`, not `meta/status.md`); see [[deepening-candidates]]. Paid courier path (PR #114, 2026-11-15): the member never inserts the order; `Checkout.tsx` calls `create-rental-courier-checkout`, Stripe takes the fee, the webhook creates the order through the `security definer` RPC `record_paid_courier_rental`, or refunds the fee when the rules now refuse it. The fee is **not** charged to Legenda (`mega`) or to members with the monthly door-delivery item: the function rejects them and `Checkout.tsx` sets `isDoorDeliveryInPlan` (`mega` or `hasPlanHomeDelivery`). Deployed versions per `meta/status.md` (2026-11-13): change-subscription v16, create-checkout v14, stripe-webhook v18 (from chat/notes, not verifiable from code).
