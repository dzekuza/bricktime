---
tags: [architecture, deepening]
updated: 2026-11-22
---

# Deepening candidates

Friction only, no solutions. Method: improve-codebase-architecture (module, interface, depth, seam, adapter, leverage, locality, deletion test). Hot spots: `git log --since=90.days --name-only` at `9b4413c` (328 commits). Pick one to explore later.

## 1. Billing flow is split across pages, five functions, the webhook and SQL
- **Files:** `src/pages/Account.tsx` (56 touches in 90 days), `src/pages/Checkout.tsx` (30), `src/pages/Subscribe.tsx` (6), `supabase/functions/stripe-webhook/index.ts` (24), `change-subscription/index.ts` (20), `create-checkout/index.ts` (15), `create-merch-checkout` (17), `_shared/plan-schedule.ts`, `used_credits` and `held_brick_value` in SQL.
- **Problem:** The interface of "subscribe / change plan / apply code" is spread over three page modules that each call functions and then wait on the webhook (`waitForSubscriberBilling`). Callers must know the order (checkout → redirect → webhook → poll → refetch the whole row). As of `195f18a` Account's plan-change flow was moved into `Checkout.tsx` (Account −551 lines, Checkout +59), which concentrates callers; `PlanChangeSummary.tsx` and `DiscountCodeField.tsx` are now unreferenced. The 2026-11-18 fix (`Account.tsx` merged only `plan`/`home_delivery`, leaving `status` stale) is a locality failure: one rule, several places. Budget maths exists in SQL (`used_credits`, four definitions across migrations) and in `_shared/plan-schedule.ts` (`fitsWithinCredits`).
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
- **Note (2026-11-20, `6fe244d`):** return-parcel sizing now depends on `products.shipping_size` set by hand in admin, with `S` as silent default for unset sets; the sizing rule lives only in this function.
- **Strength:** Speculative

## 7. Image optimiser copied into two apps; one call site bypasses the upload helper

- **Files:** `src/lib/optimise-image.ts`, `admin/src/lib/optimise-image.ts` (identical 75 lines), `admin/src/lib/upload-to-storage.ts`, `src/pages/Community.tsx` (`FeedPanel` inline upload at `:825`).
- **Problem:** the `optimiseImage` module is duplicated per app (admin shares no code with the storefront, see candidate 5), so a change to size or quality needs two edits. The storefront has no upload helper: only `Community.tsx` calls `optimiseImage`, then writes its own storage sequence.
- **Deletion test:** deleting the admin copy would move the logic back into callers' absence (a real duplicate, not concentration); deleting `upload-to-storage.ts` would spread bucket, cache and optimise rules over five admin call sites (earns its keep).
- **Evidence:** commits `7634f18`, `53383b4` (2026-11-19). Branches merged into HEAD `52c4de3` (PR #126, #124); the divergence noted earlier is resolved.
- **Strength:** Speculative

## Smaller items
- `trackEvent` (`src/lib/analytics.ts:68`) has no caller found by `rg`.
- `.env.example` and code disagree (see [[environment-variables]]).

## Conflicts (code vs docs)
- `AGENTS.md` says `admin/` is a git submodule (`bricktime-admin`); `CLAUDE.md` says it is a plain tracked directory. Code: no `.gitmodules`, and `git ls-files admin` lists 130 files, so it is a plain directory. `AGENTS.md` is stale.

## 4. Two cart modules with parallel shape but separate rules
- **Files:** `src/contexts/MerchCartContext.tsx`, `src/contexts/RentalCartContext.tsx`, `src/pages/MerchCart.tsx`, `src/pages/RentalCart.tsx`, `supabase/migrations/20261119150000_claim_rentals.sql`, `src/lib/rental.ts`.
- **Problem:** Both carts hold local state in the browser (localStorage per status note) with their own limits (6 lines/qty 10; 10 sets). The rental rules (tier, availability, budget, door delivery) are checked in `RentalCart.tsx` for display and again in SQL (`guard_member_order_insert`), so the interface a caller must know is spread across a page and a trigger. Since `5dbc994` the cart also has a paid-courier path (one €3 Stripe fee, then `stripe-webhook` calls `record_paid_courier_rentals`), so a cart rental reaches `orders` by three routes: `claim_rentals`, `record_paid_courier_rentals`, and the single-set `record_paid_courier_rental`. The ten-set limit is repeated in `RentalCartContext.tsx`, `create-rental-courier-checkout` and both SQL functions (comments say they mirror each other).
- **Deletion test:** deleting `claim_rentals` would move the all-or-nothing loop into the page (moves complexity, so it earns its keep); the client-side pre-checks in `RentalCart.tsx` duplicate the guard.
- **Evidence:** commit `36ec075`, `ba70986`; commits `5dbc994` (courier fee for carts), `a82d3e4`; migration `20261119180000_cart_review_fixes.sql` redefines both RPCs the day they were added (applied live per status, 2026-11-19, unverified). Both are very recent, so churn is not yet measured.
- **Strength:** Speculative

## 8. Admin alert kinds are declared in four places, and webhook branches carry two side effects each
- **Files:** `supabase/functions/_shared/admin-notifications.ts` (kind union + `formatAdminMessage`), `supabase/functions/stripe-webhook/index.ts` (`enqueueAdminNotification` calls at `:851`, `:1074`, `:1156`; 1196 lines), `supabase/migrations/20261122120000_admin_notifications.sql` (the `new_subscriber` producer is a trigger), `supabase/functions/send-admin-notifications/index.ts`.
- **Problem:** The outbox has one narrow interface for producers, but a new kind needs a union member, a `case` in the formatter and a producer in either the webhook or SQL; the drain treats an unknown kind as `skipped`, so a missing formatter case fails quietly. Two producer shapes (TS call, DB trigger) feed the same table. In the webhook, `invoice.payment_failed` now queues an alert, pauses the subscriber and pushes an Omnisend event in one branch, and the order matters (alert first, so an Omnisend failure that returns 500 and triggers a Stripe retry does not lose it). Phase 2 kinds (merch, mystery box, courier, penalty, gift card) will add more call sites to the same file.
- **Deletion test:** deleting `enqueueAdminNotification` would push the swallow-errors and `23505` handling into every webhook call site (moves complexity, so it earns its keep). `sendWhatsAppAlert` is one adapter at the provider seam, so that seam is hypothetical until a second provider exists.
- **Evidence:** commits `ede8729`, `8c79cf6`; status 2026-11-22 (Phase 2 pending); `admin-notifications_test.ts` covers the formatter only. Commits `ef70708`, `2ee7b47` (sanitising untrusted fields inside the formatter) exist only on branch `feat/whatsapp-admin-notifications`, not at `3f5a813`; where they land, input hygiene sits in the same module as message wording.
- **Strength:** Worth exploring
- **Update 2026-11-22 (HEAD `47444f1`):** the outbox now has 12 kinds. Six come from DB triggers in `20261122130000_admin_notification_events.sql`, three from the webhook, so one kind list is spread over the TS union, `formatAdminMessage`, SQL trigger functions, `DAILY_CAPS` in the drain, `WHATSAPP_ALERT_KINDS` in admin, and the partial index `admin_notifications_sent_kind_idx` (its migration says the kind list must match `DAILY_CAPS` by hand). The channel seam now has two adapters for real (`whatsapp.ts` with Meta and Twilio inside, and `telegram.ts`, joined in `alert-channels.ts`), so that seam is real. Evidence: commits `82710da`, `9da9768`, `9046a9b`. Strength raised to `Worth exploring`.

## 9. Two migrations share timestamp `20261122130000`
- **Files:** `supabase/migrations/20261122130000_admin_notification_events.sql`, `supabase/migrations/20261122130000_subscriber_country.sql`.
- **Problem:** both files start with the same version; `CLAUDE.md` warns that a timestamp collision fails `db push` with a `schema_migrations` primary-key violation. Locality of schema ordering depends on a manual `ls` check by whoever names the file.
- **Deletion test:** not applicable (a naming collision, not a module).
- **Evidence:** both are at HEAD `47444f1` (`git ls-tree`); the two came from separate branches (`feat/telegram-admin-alerts`, `feat/address-autocomplete`). Whether either is applied live is unknown.
- **Strength:** Worth exploring
