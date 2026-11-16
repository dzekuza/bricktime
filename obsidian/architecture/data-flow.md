---
tags: [architecture]
updated: 2026-11-16
---

# Data Flow

How state and data move through the app. Verified against `a985f7f` (courier-fee rental flow added).

## Server data

There is no server rendering. "Server" data means Supabase (Postgres via PostgREST) and edge functions.

- **Reads** use the anon client `supabase` (`src/lib/supabase.ts`) directly from pages and hooks, protected by RLS. Public catalog and CMS tables: `products`, `product_categories`, `plans`, `home_content`, `home_*`, `faq_items`, `legal_pages`, `page_headers`, `merch_items`; views `public_stats`, `product_availability`, `community_feed`, `leaderboard`, `user_profile_view`.
- **Member writes done from the browser**: `orders` insert (the rental claim, `Checkout.tsx`; a courier rental that needs the paid fee is not inserted here but by the webhook), `feed_items`, `product_reviews`, `missing_part_requests`, `subscribers` profile edits, `coupons`/`gift_cards` reads. Integrity is enforced in SQL: `guard_member_order_insert`, `guard_member_order_update`, `assert_product_available`, `guard_subscriber_billing_columns`, `enforce_checkin_once_per_day`.
- **Money and privileged writes** go through edge functions ([[billing-edge]], [[fulfilment-edge]]): the function derives the user from the JWT, never from the body.

## Subscription state (the important loop)

1. Browser calls `create-checkout` (new subscriber) or `change-subscription` (existing member; has a `preview` mode so the dialog can show the charge first).
2. Stripe Checkout / invoice happens; the user returns to the site.
3. `stripe-webhook` (events `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `customer.subscription.created|updated|deleted`, `invoice.paid`, `invoice.payment_failed`) updates `subscribers` (plan, status, period, Stripe ids) and, for the subscription path, pushes the Omnisend event `subscription started`.
4. The browser never trusts URL params: `waitForSubscriberBilling` (`src/lib/wait-for-subscriber.ts`) polls the member's own `subscribers` row (15 attempts, 2 s) until the webhook's update shows.
5. `process-plan-changes` (cron) reconciles scheduled downgrades and cancellations with the sets a member still holds.

## Rental with paid courier (since 2026-11-15)

A member whose plan lacks door delivery (not `mega`, no `home_delivery` item) may still pick courier for one rental.

1. `Checkout.tsx` (`isCourierFeeDue`) invokes `create-rental-courier-checkout`, which dry-runs `record_paid_courier_rental` and opens a 3 EUR Stripe Checkout (card only).
2. Stripe calls `stripe-webhook` (`checkout.session.completed`, or `async_payment_succeeded`) with `metadata.type = rental_courier`; `handleRentalCourierCheckout` calls `record_paid_courier_rental`, which re-checks the rules and inserts the order with `stripe_session_id`. If the rules now refuse (SQLSTATE `42501` or `23514`) the fee is refunded.
3. The browser returns with `courier_paid=true&session_id=...` and `usePaidCourierReturn` polls `orders` until the row exists (`placed`) or gives up (`missing`).

The plain path (terminal, or courier already in plan) is unchanged: browser insert into `orders` guarded by `guard_member_order_insert` -> `apply_member_rental_rules`.

## Budget

`useCredits` (`src/hooks/useCredits.ts`) combines `plans.credits` with the RPC `used_credits(subscriber_id)`. The same budget rule exists in SQL (`used_credits`, `held_brick_value`) and in TypeScript (`resolveBudgetFreesAt`, `plan-schedule.ts`'s `fitsWithinCredits`): see [[deepening-candidates]].

## Client data

No TanStack Query. Each page or hook owns `useState` + `useEffect` and calls `supabase.from(...)`. Shared, loaded-once data sits in contexts: `AuthProvider` (user + `subscribers` profile row), `SubscriptionsProvider` (active `plans`; the table is still named `plans` while UI copy says subscriptions), `ConsentProvider` (cookie consent, gates GA and Meta Pixel), `BreadcrumbProvider`.

## Client state

Local `useState` is the default (Checkout.tsx has 34 `useState` calls, Account.tsx 36). `localStorage`: site access code (`bricktime-access`), anonymous session id and liked ids (`anonSession.ts`), consent. No global store.

## Forms

No React Hook Form or Zod. Forms are controlled inputs with ad hoc validation in the page; server validation is in the edge function or in triggers. Errors from edge functions are unwrapped with `readFunctionError` (`src/lib/function-error.ts`) and Lithuanian auth messages with `translateAuthError`.

## Background jobs

| Job | Trigger | Target |
|-----|---------|--------|
| `lpexpress-delivery-sync` | `pg_cron` every 30 min (migration `20260707192807`) | `lpexpress-sync` via `pg_net`, bearer service-role key from Vault |
| plan-change reconcile | `pg_cron` expected, secret in `public.cron_secrets` (`plan_changes`) | `process-plan-changes` with `x-cron-secret` header. **The `cron.schedule` call is not in the repo migrations** (TODO: unknown whether scheduled live) |
| leaderboard refresh | removed; `leaderboard` is now a live view (`20260827000007`) | n/a |

## Loading / error / empty

No shared skeleton or error component is documented in code beyond per-page patterns (`LoadingScreen` only for the home intro). TODO: unknown conventions; handled ad hoc per page.

## Related

[[system-overview]] · [[api-architecture]] · [[integrations]]
