---
tags: [architecture, deepening]
updated: 2026-11-18
---

# Deepening candidates

Friction only, no solutions. Method: improve-codebase-architecture (module, interface, depth, seam, adapter, leverage, locality, deletion test). Hot spots: `git log --since=90.days --name-only` at `9b4413c` (328 commits). Pick one to explore later.

## 1. Billing flow is split across pages, five functions, the webhook and SQL
- **Files:** `src/pages/Account.tsx` (56 touches in 90 days), `src/pages/Checkout.tsx` (30), `src/pages/Subscribe.tsx` (6), `supabase/functions/stripe-webhook/index.ts` (24), `change-subscription/index.ts` (20), `create-checkout/index.ts` (15), `create-merch-checkout` (17), `_shared/plan-schedule.ts`, `used_credits` and `held_brick_value` in SQL.
- **Problem:** The interface of "subscribe / change plan / apply code" is spread over three page modules that each call functions and then wait on the webhook (`waitForSubscriberBilling`). Callers must know the order (checkout → redirect → webhook → poll → refetch the whole row). The 2026-11-18 fix (`Account.tsx` merged only `plan`/`home_delivery`, leaving `status` stale) is a locality failure: one rule, several places. Budget maths exists in SQL (`used_credits`, four definitions across migrations) and in `_shared/plan-schedule.ts` (`fitsWithinCredits`).
- **Deletion test:** deleting `waitForSubscriberBilling` would push its polling into every page (moves complexity, so it earns its keep); the pages' own copies of the post-purchase refetch logic would concentrate if they vanished.
- **Evidence:** commits `fix: refetch subscriber row after a Stripe plan redirect`, `fix: confirm plan change charge, add VAT...`; `src/lib/wait-for-subscriber.ts:19`; session-log 2026-11-18.
- **Strength:** Strong

## 2. Very large page modules with shallow interfaces
- **Files:** `src/pages/Checkout.tsx` 2145 lines, `Account.tsx` 1823, `Community.tsx` 1460, `Drop.tsx` 1013 (project rule: extract above ~150 lines).
- **Problem:** The interface of each page is a route, but the body holds data fetching, rules and presentation. Changes to claim rules, delivery options or plan change land in the same files again and again (top churn list). Callers of rules (budget, held value, availability) re-derive them locally.
- **Deletion test:** pages are entry points, so they cannot be deleted; their inner logic, if extracted, would concentrate behaviour that today is repeated across Checkout, Drop and Account (`useProductAvailability`, `getDisplayPlan` are already shared by three).
- **Evidence:** `wc -l src/pages`; churn counts above.
- **Strength:** Strong

## 3. One-off checkout functions repeat the same Stripe plumbing
- **Files:** `create-checkout`, `create-merch-checkout`, `create-gift-card-checkout`, `create-penalty-checkout`, `create-rental-courier-checkout`, `_shared/vat.ts`, `_shared/coupon.ts`.
- **Problem:** The same comments and logic recur: Stripe's shortest session lifetime with a longer gift-card or coupon hold (`create-checkout/index.ts:16`, `create-merch-checkout/index.ts:14`), customer reuse only when Stripe confirms the email (`create-penalty-checkout/index.ts:15`), VAT rate lookup. Only `vat.ts` and `coupon.ts` are shared. A change in hold or customer rules needs edits in several functions (see the 21% VAT commits touching merch and subscriptions separately).
- **Deletion test:** deleting `_shared/vat.ts` would copy its lookup into each checkout (earns its keep); the duplicated hold and customer code is where a shared module is missing.
- **Evidence:** commits `feat: add 21% inclusive VAT to merch checkout`, `fix: keep Stripe Checkout and customer invoice language Lithuanian`.
- **Strength:** Worth exploring

## 4. Paid state has one writer but the order and rental rules live in SQL triggers redefined across migrations
- **Files:** `supabase/migrations/20261115120000_paid_courier_rentals.sql` (`apply_member_rental_rules`, `guard_member_order_insert`, `record_paid_courier_rental`), `20261105*` migrations (`used_credits` redefined in four files).
- **Problem:** The live rule for "may this member rent" is the last definition of several functions plus triggers; to know it a reader must replay migrations. Live DB also changed outside the migration history (status.md: SQL-editor migrations not recorded in `schema_migrations`).
- **Deletion test:** the triggers concentrate rules that would otherwise be in every insert path (earn their keep); the redefinition history is the friction.
- **Evidence:** migration file names above; `obsidian/meta/status.md` ("applied by hand ... not recorded").
- **Strength:** Worth exploring

## 5. Admin app shares schema types by copy
- **Files:** `src/lib/database.types.ts`, `admin/src/lib/database.types.ts` (24 touches each in 90 days), `admin/` calls `cancel-subscription`, `delete-subscriber`, `admin-cancel-subscription`, `get-analytics`.
- **Problem:** Two copies of generated types must be regenerated together (rule in `CLAUDE.md`); functions serve two apps with different callers, and the admin cancel bug of 2026-11-18 came from the admin path updating a row without going through the same cancel rule as members.
- **Deletion test:** not applicable to the copy; the admin-only function `admin-cancel-subscription` concentrates the Stripe cancel rule, so it earns its keep.
- **Evidence:** commit `fix: cancel the Stripe subscription when an admin cancels a member`.
- **Strength:** Speculative

## 6. LP Express: one adapter behind a single action router
- **Files:** `supabase/functions/lpexpress/index.ts`, `_shared/lpexpress.ts`, `src/lib/lpexpress.ts`.
- **Problem:** Six actions behind one endpoint with `{ action, ...params }`; only one carrier, so the seam is hypothetical. Not a defect today; noted because merch and rentals both ship (see [[decisions-from-chat]] when chat is read).
- **Deletion test:** deleting `src/lib/lpexpress.ts` would move the `invoke` wiring into three components (earns its keep, thin).
- **Strength:** Speculative

## Smaller items
- `trackEvent` (`src/lib/analytics.ts:68`) has no caller found by `rg`.
- `.env.example` and code disagree (see [[environment-variables]]).

## Conflicts (code vs docs)
- `AGENTS.md` says `admin/` is a git submodule (`bricktime-admin`); `CLAUDE.md` says it is a plain tracked directory. Code: no `.gitmodules`, and `git ls-files admin` lists 130 files, so it is a plain directory. `AGENTS.md` is stale.
