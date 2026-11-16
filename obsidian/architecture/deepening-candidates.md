---
tags: [architecture, deepening]
updated: 2026-11-16
synced_commit: a985f7f
---

# Deepening candidates

Friction found with the improve-codebase-architecture method (vocabulary: module, interface, depth, seam, adapter, leverage, locality). **No solutions or interfaces are proposed here**; the owner picks one to explore later. Scope was set by hot spots: `git log --since=90.days --name-only` over 329 commits. Top paths by commits touching them: `src/pages/Account.tsx` 57, `src/pages/Checkout.tsx` 33, `src/pages/Drop.tsx` 28, `supabase/functions/stripe-webhook/index.ts` 22, `change-subscription` 20, `create-merch-checkout` 16, `create-checkout` 15, plus `database.types.ts` (24 and 23, generated). Tests exist only for two shared helpers: `supabase/functions/_shared/plan-change_test.ts` and `plan-schedule_test.ts`. No `GLOSSARY.md` exists; domain terms were derived from code and chat (see the report for proposed additions).

## 1. Subscription lifecycle has no single home (Strong)

- **Files:** `supabase/functions/stripe-webhook/index.ts`, `change-subscription/index.ts`, `create-rental-courier-checkout/index.ts`, `create-checkout/index.ts`, `cancel-subscription/index.ts`, `pause-subscription/index.ts`, `process-plan-changes/index.ts`, `_shared/plan-schedule.ts`, `_shared/downgrade-guard.ts`, SQL `guard_subscriber_billing_columns`, `used_credits`, `held_brick_value`, `begin_subscription_pause`.
- **Problem:** the rules "no downgrade while sets are held", "cancel only when everything is returned", "billing period never moves back", "pause blocks rentals" are enforced in several modules at once (edge functions, SQL guards, webhook mirror). Understanding one rule needs six files; each rule has to be repeated at every entry (`assertNoDowngradeWhileHolding` is called from two functions, the same check is re-made in `process-plan-changes`). The interface of the state machine is implicit in the column set of `subscribers` (`status`, `plan`, `pending_plan`, `pending_schedule_id`, `cancel_requested`, `cancel_at`, `paused_until`, period columns). Low locality: a bug in the plan-change flow lands in 3 to 4 files per fix (see changelog 2026-11-05 "#98 cubic review rounds").
- **Deletion test:** removing the shared helpers (`downgrade-guard`, `plan-schedule`) would spread their logic across the callers (it earns its keep); removing the per-function copies would concentrate. The webhook and `process-plan-changes` both write plan state, so the writer is not unique.
- **Evidence:** `git log` shows `stripe-webhook` 25 (22 at `7e98519`) and `change-subscription` 20 touching commits in 90 days; PR #114 (`dbcc907`) added a second payment entry (`rental_courier`) to the webhook, taking it to 965 lines; `meta/changelog.md` 2026-11-05 to 2026-11-13 entries; CRM tasks 1aab630b, d2d9f341, 5b0a1377, 2c96e082 (plan change, cancel and "when next set can be ordered after return").

## 2. Account and Checkout pages hold the rental and plan-change flows inline (Strong)

- **Files:** `src/pages/Account.tsx` (1816 lines, 36 `useState`), `src/pages/Checkout.tsx` (2145 lines, 34 `useState`), `src/components/account/*`, `src/components/checkout/*`.
- **Problem:** each page is a large module whose interface is a route but whose implementation orchestrates `change-subscription`, `create-checkout`, `create-billing-portal`, `waitForSubscriberBilling`, terminal choice, discount code, budget and the client-side `orders` insert. Both pages call the same edge functions with overlapping inputs, so plan-change and confirmation logic exists in both (`PlanChangeSummary` and `PlanChangeConfirm` are two partial extractions). Locality is poor: the 90-day history shows these files changing in 79 commits combined.
- **Deletion test:** deleting the page-level glue would move it, but extracting repeated flow logic would concentrate; the existing small components (`PlanChangeSummary`, `PauseSubscription`) show the pattern partially works.
- **Evidence:** file sizes above; commit list `4fc18a4`, `edc762b`, `625aa83` (account notice and plan-change fixes in the last days); `dbcc907` added a third branch to the page (pay the courier fee in Stripe, return, poll) plus `usePaidCourierReturn`; the +3 EUR courier rule is now spelled in `Checkout.tsx` (`isDoorDeliveryInPlan`), `create-checkout` (`planKey !== "mega"`), `create-merch-checkout`, `create-rental-courier-checkout` and SQL (`apply_member_rental_rules`) separately; CRM tasks 535858d1 (inconsistent monthly price 52.99 vs 49.99 with courier), 0a5f326a, 9b6741fc, 1756bfc5.

## 3. Migration history does not describe the live database (Strong)

- **Files:** `supabase/migrations/` (109 files), `src/lib/database.types.ts`, `supabase/database.types.ts`, `admin/src/lib/database.types.ts`.
- **Problem:** `coupons`, `subscriber_penalties`, `public_profiles` and `redeem_coupon` appear in generated types and code but have no CREATE in the repo; `meta/status.md` says some migrations were applied by hand in the SQL editor and are not in `schema_migrations`; the `process-plan-changes` cron schedule is not in any migration; `used_credits`, `guard_member_order_insert` and `record_merch_order` were each redefined 3 to 4 times (`guard_member_order_insert` again in `20261115120000`, which moves its body into `apply_member_rental_rules`). The migration sequence is the seam that should let the schema be recreated (`migration/` scripts exist for moving it), and today it is not a complete adapter. Three copies of `database.types.ts` must be regenerated together.
- **Deletion test:** deleting the stale redefinitions would not hide complexity, it would reveal that only the last copy matters; this is a pass-through history, not a module.
- **Evidence:** `rg` for `create table.*coupons` finds nothing in `supabase/migrations`; `meta/status.md` ("#97's migrations ... applied by hand"); `20261030160000_cron_secrets.sql` mentions the job but never schedules it.

## 4. Discount code (coupon and gift card) resolution is implemented several times (Worth exploring)

- **Files:** `supabase/functions/verify-gift-card/index.ts`, `create-checkout/index.ts` (gift card hold), `change-subscription/index.ts` (`resolveDiscountCode`), `create-merch-checkout/index.ts` (`resolveDiscount`), `stripe-webhook/index.ts` (redeem), `_shared/coupon.ts`; browser: `src/hooks/useDiscountCode.ts`, `src/components/merch/MerchDiscountCode.tsx`, `src/pages/Subscribe.tsx`, `src/pages/Checkout.tsx` (direct reads of `coupons` table).
- **Problem:** six edge-function files read `gift_cards` or `coupons` and three client files read `coupons` directly; the rules (pending cards do not validate, one code per order, holds for 35 min, counted once because `redeem_coupon` is not idempotent) are repeated per entry point. The server and the client both compute a discount preview. Bugs reported by the client such as "gift code state after cancelling plan change" and "used code but amount unchanged" live between these copies.
- **Deletion test:** `_shared/coupon.ts` covers only the Stripe coupon creation; deleting `verify-gift-card` would force its logic into callers, so it concentrates a little; the rest is repeated.
- **Evidence:** chat 2026-10-28 (gift code applied but amount unchanged), CRM task 1aab630b, status notes on gift card hold (2026-11-05).

## 5. Edge function boilerplate repeated per function (Worth exploring)

- **Files:** all 18 functions in `supabase/functions/*/index.ts`.
- **Problem:** 16 files define their own `corsHeaders`, 12 resolve the caller with `auth.getUser`, 6 each re-implement Stripe customer lookup (`create-checkout`, `create-penalty-checkout`, `get-billing-history`, `change-subscription`, `create-billing-portal`, `stripe-webhook`) with slightly different fallbacks (email match only when confirmed, stored id first). `_shared/` has 6 helpers but none for auth, CORS or customer resolution, so the security-relevant rule "identity from the token, never the body" is a per-function convention. There is no seam where authentication could be swapped or tested.
- **Deletion test:** a shared auth/customer module would concentrate (the per-function copies are pass-through boilerplate with small drift).
- **Evidence:** `rg` counts above; `create-penalty-checkout/index.ts` comments on why stored customer ids cannot be trusted.

## 6. Admin authorisation is two different mechanisms (Worth exploring)

- **Files:** `admin/src/context/AuthContext.tsx` (email equals `VITE_ADMIN_EMAIL` or a hardcoded fallback), RLS policies (`app_metadata.role = 'admin'`), `lpexpress`, `lpexpress-sync`, `delete-subscriber` (claim check), `get-analytics` (any signed-in user passes, no admin check in code).
- **Problem:** the admin interface is "who may use this" but it is answered by an email comparison in the browser and a JWT claim on the server; they can disagree. `get-analytics` exposes Google data to every authenticated member if called directly. Low leverage: each function re-implements `isAdmin`.
- **Deletion test:** the client-side email gate is a pass-through for UX only; deleting it moves nothing server-side.
- **Evidence:** the files above; CRM task dba2d7da (Admin Analytics shows Edge Function error).

## 7. Thin alias hooks and dead data (Speculative)

- **Files:** `src/hooks/useAuth.ts` (alias of `useAuthContext`), `src/hooks/useSubscriptions.ts` (alias of the context hook), `src/data/community.ts` (mock `feedItems`, `leaderboard`, `currentUserAchievements` never imported elsewhere), `src/data/merch.ts` (no importer), `src/lib/analytics.ts` `trackEvent` (no caller), `admin/src/data/*`.
- **Problem:** shallow modules whose interface equals their implementation; the plans table is called "plans" in the DB but "subscriptions" in the UI code and copy, so naming leaks across the seam (`SubscriptionsContext.tsx` comment).
- **Deletion test:** deleting the alias hooks only moves an import line (pass-through); deleting the unused mock data concentrates nothing.
- **Evidence:** `rg` of importers (see [[storefront-shared]] notes).

## 8. Copied code between storefront and admin (Speculative)

- **Files:** `src/lib/{series,heading-markup,vilnius-time,lpexpress}.ts` and `admin/src/lib/` copies; `database.types.ts` x3.
- **Problem:** no shared seam; a rule change (a series name, a Vilnius time rule) is made twice. Admin is deployed from the same build but cannot import storefront code.
- **Deletion test:** deleting the duplicates would force a shared module to exist; unclear whether it earns its keep.
- **Evidence:** `git ls-files` listings; CLAUDE.md note "regenerate both after any schema change".

## Not a candidate but flagged

- `.env.example` is missing for both apps (global rule requires it).
- `async_payment_failed` is still not handled by `stripe-webhook` (rechecked at `a985f7f`: `default: break`; no `checkout.session.expired` either). The claim is in `meta/session-log.md` (PR #97 entry: webhook "releases them on `async_payment_failed`"), not `meta/status.md`. Mitigation in code: `create-merch-checkout` forces `payment_method_types: ["card"]` when a code hold is taken, and `create-rental-courier-checkout` is card only, so delayed methods are avoided on those paths.
