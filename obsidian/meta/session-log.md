## 2026-11-05 — #98 cubic review round
- **Changed:** create-checkout fails closed (stored subscription checked, Stripe errors rethrown, all pages, incomplete counted, payment-problem message, 10 s idempotency key); webhook guard on every path, period never moves back, pause block kept, invoice fetched only after a pause; gift card row saved before checkout URL, email then activate; pause dates fixed (months-1, clamped), re-entry guarded; Legenda courier allowed; UI fixes (two-code swap block, stale-row fallback, history refresh, monthly/annual label, pause a11y + wording, pending gift cards, admin used/pending cards).
- **Status:** pushed to #98; 3 migrations applied live; five functions changed since the deploy are NOT redeployed.
- **Next:** redeploy those five; merge #96 → #97 → #98; Stripe cleanup (duplicate subscriptions, older unpaid gift cards); backfill billing periods.

## 2026-11-05 — edge functions deployed (combined #96 + #97 + #98)
- **Changed:** deployed 9 functions via Supabase MCP from local branch `deploy/combined` (merge of fix/merch-payment-hardening, feat/merch-orders-and-fixes, fix/billing-safety). Pause hardening from security reviews landed first on #98 (atomic start, resume keeps unpaid month blocked, webhook keeps the block, timeout-safe, no plan change while paused, 'infinity' fails closed).
- **Status:** all 9 boot and refuse unauthenticated calls correctly. No end-to-end Stripe test yet.
- **Next:** merge the three PRs in order; Stripe duplicate-subscription cleanup.

## 2026-11-05 — tester feedback: billing safety, rentals, courier, budget period, pause
- **Changed:** branch fix/billing-safety (9 commits, see status.md) + #97 card-only fix b676a16. Five migrations applied live via MCP and renamed locally to their recorded versions.
- **Status:** storefront + admin typecheck; deno check clean except pre-existing TS7006/EdgeRuntime errors; used_credits verified in a rolled-back transaction. Not tested end to end in the browser or against Stripe test mode. Edge functions not deployed.
- **Next:** open stacked PR, merge order #96 → #97 → this, deploy functions, clean up duplicate Stripe subscriptions.

## 2026-11-05 — PR #97 opened; cubic review addressed
- **Changed:** branch rebased onto main after #95; PR dzekuza/bricktime#97 opened (head b734b77 before review fixes). Review fixes: webhook keeps coupon/gift card holds for 14 days on delayed payments and releases them on `async_payment_failed`, keeps the coupon hold if `redeem_coupon` fails; useCredits waits for plan load; downgrade summary wording and no swap note on downgrades; 35-min retry message; migrations renamed 200000→220000 to avoid colliding with #96's `20261105200000_merch_order_stock_guard.sql`; new 220300 fixes the `reserved_by` column comment (applied live); vault hook marker stores the last edit time.
- **Status:** review fixes committed on feat/merch-orders-and-fixes; edge functions for #97 not deployed.
- **Next:** merge #96, rebase #97, deploy the three functions, enable `async_payment_failed` on the Stripe endpoint.

## 2026-11-05 — merch checkout security fixes
- **Changed:** create-merch-checkout (gift card needs login, hold tied to `reserved_by`, one generic error; coupon uses reserved via `claim_coupon_hold`), stripe-webhook (releases coupon hold after redeem), MerchDiscountCode (guest gift-card message), migrations 20261105200000 + 20261105200100 (`reserved_by`, `coupon_holds`, owner-only buyer PII in `get_merch_order_by_session`).
- **Status:** commits 5e72da3 + dafac67 on feat/merch-orders-and-fixes. Migrations 20261105200000/200100/200200 applied by hand in the SQL editor and verified live (reserved_by, coupon_holds+RLS+index, 3-arg claim_coupon_hold not callable by anon, order lookup hides buyer details for guest orders older than 1h). Edge functions not deployed.
- **Next:** regenerate database.types.ts (both apps), deploy create-merch-checkout + stripe-webhook, open the PR.

## 2026-11-05 — gift card hold extended to subscription checkout
- **Changed:** create-checkout holds the gift card with the same conditional UPDATE (35 min), sets a 30-min session expiry, releases the hold if Stripe fails, hides raw DB errors; stripe-webhook clears `reserved_until` when a subscription redeems a card.
- **Status:** deployed — create-checkout v9 (with `_shared/coupon.ts` + `_shared/downgrade-guard.ts`), stripe-webhook v13. Smoke tests: create-checkout boots and returns its own 401 for anon; merch bogus code → 400 "Kodas nerastas…"; webhook rejects unsigned. Gift-card hold in the subscription path not exercised with a real signed-in checkout.
- **Next:** one real gift-card test purchase (merch + subscription); delete test order #1003; Omnisend "merch order placed" automation; deploy storefront; commit.

## 2026-11-05 — gift card hold against double-spend; merch codes deployed
- **Changed:** migration 20261105130000_gift_card_reservation (`gift_cards.reserved_until`, applied); create-merch-checkout claims the card with one conditional UPDATE (35-min hold), Stripe session expires in 30 min, hold released if Stripe fails; DB errors no longer returned to the client; webhook redeems the gift card on every delivery (retry-safe, throws on error) and counts coupons only on first delivery.
- **Status:** deployed — stripe-webhook v12, create-merch-checkout v7; live smoke test: bogus code → "Kodas nerastas arba nebegalioja", webhook rejects unsigned. A real gift-card hold through Stripe not exercised end to end.
- **Next:** add the same hold to subscription create-checkout (cards used there ignore it); delete test order #1003; Omnisend "merch order placed" automation; deploy storefront; commit.

## 2026-11-05 — plan-change summary shows what the gift card really does
- **Changed:** `src/components/account/PlanChangeSummary.tsx` + `isDowngrade` prop from Account.tsx. New subscription: "Mokėsi dabar" line = total − card (≥ €0), note that the card covers only the first payment and any excess is forfeited (create-checkout caps the one-off coupon and marks the card used). Upgrade swap: card shown as credit with a note that it pays the swap invoice first and the rest carries over (Stripe customer balance); no exact pay-now figure because the swap charge depends on the current Stripe items. Downgrade: no coupon/gift deduction shown, with a note that codes don't apply (change-subscription returns before reading the code).
- **Status:** typecheck + lint clean; all four cases rendered in the dev preview by mounting the component directly (account page needs a login). Uncommitted.
- **Next:** decide whether to add a server-side swap preview (Stripe upcoming invoice) so swaps can show an exact pay-now amount; decide whether forfeiting a gift-card excess on new subscriptions is intended.

## 2026-11-05 — merch checkout accepts discount codes and gift cards
- **Changed:** `src/components/merch/MerchDiscountCode.tsx` (one field for coupon or gift card, shows −€ and the total on the buy button); MerchDrop passes `code` and now shows checkout errors instead of failing silently; create-merch-checkout prices the code server-side (coupon first, then gift card, capped at item price, one-off Stripe coupon); stripe-webhook redeems the gift card / counts the coupon only once the order is first recorded.
- **Status:** typecheck/lint/deno check clean; field verified in local preview (invalid code error, WECOME → −€5, button €20). Function changes NOT deployed — live create-merch-checkout ignores `code`.
- **Next:** deploy both functions before the storefront ships, otherwise shoppers see a discount and get charged full price.

## 2026-11-05 — merch orders actually get recorded
- **Changed:** new `merch_orders` table + `record_merch_order` / `get_merch_order_by_session` (migrations 20261105120000/120100, applied to remote); stripe-webhook handles `type: "merch"` sessions (insert, per-size stock decrement, Omnisend "merch order placed"); create-merch-checkout tags sessions, links verified user, collects phone, redirects to `/merch/aciu`; new storefront thank-you page `MerchThankYou.tsx`; fake `?payment=success` banner removed from MerchDrop; admin Orders page gets Rentals/Merch tabs (`MerchOrdersPanel`, `MerchOrderDetailSheet`, `lib/merch-orders.ts`); types regenerated in both apps.
- **Status:** typechecks + lint clean; DB functions dry-run tested; thank-you page and admin tab verified locally. Edge functions deployed 2026-11-05 (stripe-webhook v11, create-merch-checkout v6) via Supabase MCP — the CLI token lacks deploy rights. Test row #1003 (`cs_test_claude_preview`) still in merch_orders — deletion was declined.
- **Next:** deploy storefront (thank-you page + new success URL); create Omnisend automation for "merch order placed"; backfill past merch payments from Stripe; commit.

## 2026-11-05 — admin Analytics page fails with 500
- **Found:** `get-analytics` edge function returns 500 after auth succeeds (logs, 17:25 + 13:23 UTC), so the failure is in the Google step: secrets missing, or the service-account token or API calls failing. CLI can't list secrets (403 on this account).
- **Changed:** admin/src/pages/Analytics.tsx — the alert now shows the function's real `error` body, not the generic "non-2xx" text.
- **Verified:** new service account `bricks@cedar-freedom-471318-u2` works locally: token OK, GA4 property 548715432 (161 sessions/28d), GSC `sc-domain:bricktime.lt` (6 clicks).
- **Next:** set GOOGLE_SERVICE_ACCOUNT_EMAIL / _PRIVATE_KEY / GA4_PROPERTY_ID=548715432 / GSC_SITE_URL=sc-domain:bricktime.lt in Supabase secrets, then reload /analytics.

## 2026-11-05 — merch edit dialog gets a description field
- **Changed:** admin/src/pages/Merch.tsx — Description textarea under Name, loaded from and saved to `merch_items.description` (column already existed; storefront MerchDrop already renders it).
- **Status:** typechecks, field visible in dev preview; uncommitted (along with the sidebar grouping).
- **Next:** fill descriptions for the existing 4 merch items, then commit.

## 2026-11-05 — admin sidebar grouped into sections
- **Changed:** admin/src/components/AppSidebar.tsx — flat 16-item "Menu" split into Overview / Catalog / Sales / Customers / Engagement; Settings pinned to the bottom.
- **Status:** typechecks, verified in dev preview; uncommitted.
- **Next:** commit if the grouping is approved.

---
tags: [meta, session-log]
updated: 2026-11-05
---

# Session log

Append-only record of **what each working session changed and where it left the
project**. Newest first. Keep entries short (3–6 lines). Notable user-facing or
architectural changes also go in [[changelog]] / [[decisions-log]]; the live
snapshot lives in [[status]].

Entry format:

```
## YYYY-MM-DD HH:MM — one-line summary
- **Changed:** files / areas touched and why
- **Status:** what works now, what is half-done
- **Next:** the first thing to do next session
```

## 2026-11-05 — vault initialised

- **Changed:** project brain scaffolded (vault, shims, hooks).
- **Status:** skeleton only — architecture notes and catalogs still empty.
- **Next:** fill [[status]] and the architecture notes from the real codebase.
