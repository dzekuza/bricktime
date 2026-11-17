---
tags: [architecture]
updated: 2026-11-18
---

# Data Flow

How state and data move through the app. Module detail: [[codebase-map]].

## Server data

There is no server rendering. Pages call `supabase.from(...)` / `.rpc(...)` from the browser under RLS. Most-read tables: `subscribers`, `gift_cards`, `orders`, `products`, `feed_items`, `coupons`, `plans`, `home_content`. CMS-like tables (`home_content`, `faq_items`, `legal_pages`, `page_headers`, `home_testimonials`, `home_marquee_items`, `home_how_it_works_steps`) feed the landing and legal pages through small hooks. Views: `public_stats`, `product_availability`, `leaderboard`, `user_profile_view`, `community_feed`, `public_profiles`.

## Client data

No TanStack Query. Each hook fetches in `useEffect` and keeps its own state. The subscriber row is shared through `SubscriptionsContext`.

## Client state

- Session: `AuthContext`. Subscriber row and plans: `SubscriptionsContext` (`useSubscriptions`). Budget: `useCredits` (RPC `used_credits`, `held_brick_value` on the server).
- Consent: `ConsentContext` (loads GA4 and Meta Pixel only after consent).
- Anonymous likes: `localStorage` through `src/lib/anonSession.ts`.

## Money flow (the one flow that crosses modules)

1. Page → `create-checkout` / `change-subscription` / one-off checkout function (JWT) → Stripe session.
2. Browser is redirected to Stripe (`window.location.assign(data.url)`, e.g. `src/pages/Subscribe.tsx:184`).
3. Stripe → `stripe-webhook` → database (and Omnisend event).
4. Page returns and runs `waitForSubscriberBilling` until the row shows the new state; `Account.tsx` then refetches the whole subscriber row (fix of 2026-11-18, see [[session-log]]).
5. pg_cron → `process-plan-changes` applies scheduled plan changes and cancellations; `lpexpress-sync` (every 30 min) advances order status from tracking.

## Realtime

`src/pages/Community.tsx` uses a Supabase channel (`rg '\.channel\('`). Details not read: TODO: unknown.

## Forms

No React Hook Form or Zod; forms use local state. Validation of codes and prices is repeated server-side (`change-subscription` never trusts the client preview).

## Loading / error / empty

Edge function errors are read with `readFunctionError` (`src/lib/function-error.ts`). A shared skeleton component: TODO: unknown.

## Related
[[system-overview]] · [[api-architecture]] · [[integrations]]
