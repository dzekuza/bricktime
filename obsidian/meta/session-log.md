## 2026-11-22 — WhatsApp admin notifications (Meta Cloud API), Phase 1

- **Changed:** branch `feat/whatsapp-admin-notifications`, uncommitted. Migration `20261122120000_admin_notifications` (outbox table, `subscribers` insert trigger, `admin_whatsapp` setting off by default, per-minute cron), `_shared/whatsapp.ts`, `_shared/admin-notifications.ts` (+ test), edge function `send-admin-notifications`, and `stripe-webhook` enqueues subscription started, payment failed and cancelled.
- **Status:** `deno check` and 4 Deno tests pass. Migration not applied, function not deployed, nothing sent. Admin Settings UI not built (`admin/` is a separate app).
- **Next:** Meta app + `admin_alert` template, set `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `ADMIN_WHATSAPP_TO`; deploy; flip `admin_whatsapp.enabled`.

## 2026-11-22 — architecture docs sync to `3d5f1be`

- **Changed:** codebase-map `synced_commit` -> `3d5f1be`. Only code change since `f3554ce` is the admin favicon/title (`1d25dae`); no module interface changed. Chats and CRM skipped.
- **Status:** checked with `git diff`.
- **Next:** none pending.

## 2026-11-20 — architecture docs sync to `f3554ce`

- **Changed:** codebase-map `synced_commit` -> `f3554ce`. The one commit since `ccd3b5d` (`fix: darker tracking labels for contrast`) is colour classes only. Chats and CRM skipped.
- **Status:** checked with `git diff`.
- **Next:** none pending.

## 2026-11-20 — architecture docs sync to `ccd3b5d`

- **Changed:** codebase-map `synced_commit` -> `ccd3b5d`; `lpexpress-sync` row updated (`eventTime` `:46`, `Deno.serve` `:62`, difference with browser side resolved after #145); countdown format. OrderTracking/RentedOrderCard/Merch edits are styling only. Chats and CRM skipped.
- **Status:** checked with `git diff`/`rg`.
- **Next:** none pending.

## 2026-11-20 — architecture docs sync to `9b75241`

- **Changed:** codebase-map `synced_commit` -> `9b75241`; noted browser/edge-function difference on LP `eventDate` (`OrderTracking.tsx`, `src/lib/lpexpress.ts:21` vs `lpexpress-sync/index.ts:46`). Other changed files were styling only. Chats and CRM skipped.
- **Status:** checked with `git diff`/`rg`.
- **Next:** re-sync after `fix/lp-sync-event-date` merges.

## 2026-11-20 — architecture docs sync to `bbaacca`

- **Changed:** codebase-map `synced_commit` -> `bbaacca`; merch card image ratio detail updated (only `src/pages/Merch.tsx` changed). Chats and CRM skipped.
- **Status:** checked with `git diff`/`rg`.
- **Next:** re-sync after `fix/lp-sync-event-date` merges.

## 2026-11-20 — architecture docs sync to `68c7931`

- **Changed:** codebase-map `synced_commit` -> `68c7931`. Fixed the previous entry: `d3eaefa` is on `fix/lp-sync-event-date` and not an ancestor of HEAD, so `lpexpress-sync` row reverted to HEAD behaviour. Merch card image ratio noted. Chats and CRM skipped.
- **Status:** checked with `git diff`/`rg`.
- **Next:** re-sync after `fix/lp-sync-event-date` merges.

## 2026-11-20 — architecture docs sync to `d3eaefa`

- **Changed:** codebase-map `synced_commit` -> `d3eaefa`. Code changes since `6ad2d2b`: `lpexpress-sync` `eventTime` now reads LP `eventDate` (commit d3eaefa; `LpTrackingEvent.eventDate` in `_shared/lpexpress.ts`). Line ref updated. Chats and CRM skipped.
- **Status:** checked with `git diff`/`rg`.
- **Next:** re-sync after the next merge.

## 2026-11-20 — architecture docs sync to `6ad2d2b`

- **Changed:** codebase-map `synced_commit` -> `6ad2d2b`. PR #143 (credits billing window) is now in HEAD, so the "branch-only" flags on `useCreditsReset`, `CreditsResetNotice` and migration `20261121100000` were replaced with "merged". Other code change: merch card image ratio (`src/pages/Merch.tsx`). Chats and CRM skipped.
- **Status:** checked with `git diff`/`rg`.
- **Next:** re-sync after the next merge.

## 2026-11-20 — architecture docs sync to `357879a`

- **Changed:** codebase-map `synced_commit` -> `357879a`. HEAD (`fix/merch-card-description`) does not contain `179d56d` (it is on `feat/credits-billing-window`), so the credits-reset rows (`useCreditsReset`, `CreditsResetNotice`, migration `20261121100000`) are marked branch-only. Only code change on HEAD: merch card description removed (`src/pages/Merch.tsx`). Chats and CRM skipped.
- **Status:** checked with `git diff`/`rg`.
- **Next:** re-sync after `feat/credits-billing-window` merges.

## 2026-11-20 — architecture docs sync to `179d56d`

- **Changed:** codebase-map: credits come back at the next charge (`179d56d`): `useCreditsReset`, `CreditsResetNotice` on Account/Checkout/RentalCart, SQL `credits_pending_reset`, redefined `used_credits`/`billing_window`, `subscribers.credits_reset_at`. Chats and CRM skipped (automated run).
- **Status:** lines checked with `rg`.
- **Next:** none.

## 2026-11-20 — architecture docs sync to `b388322`

- **Changed:** codebase-map: `b388322` no longer uncommitted; admin plan label in Orders/OrderDetailSheet; `aria-pressed` on MysteryBoxRequestDialog; stripe-webhook line refs refreshed (were stale). Chats and CRM skipped (automated run).
- **Status:** lines checked with `rg`.
- **Next:** none.

## 2026-11-20 — architecture docs sync to `f6d2c81`

- **Changed:** codebase-map: Mystery Box review fixes (`f6d2c81`): return-URL allow-list and idempotent Checkout in `create-mystery-courier-checkout`, RPC lock-order and locker-name fixes, `MysteryBoxRequest` retry/countdown changes, admin `Orders`/`OrderDetailSheet` guards for `requested`; uncommitted `rejected_checkout_sessions` table + webhook record-before-refund. integrations: one line. Chats and CRM skipped (automated run).
- **Status:** paths and lines checked with `rg`.
- **Next:** none.

## 2026-11-20 — architecture docs sync to `d985cd2`

- **Changed:** codebase-map: Mystery Box requests (`b2ab66f`): RPCs `request_mystery_box`, `record_paid_mystery_courier`, `check_mystery_box_request`, `billing_window`, enum `requested`, nullable `orders.product_id`, function `create-mystery-courier-checkout`, webhook `handleMysteryCourierCheckout`, `MysteryBoxRequest*`, `useBillingCountdown`, admin `AssignMysterySet`. integrations: Stripe line. Chats and CRM skipped (automated run).
- **Status:** paths and lines checked with `rg`.
- **Next:** none.

## 2026-11-20 — architecture docs sync to `7a7362c`

- **Changed:** codebase-map: `lpexpress-sync` logs unknown tracking states; cron job `lpexpress-delivery-sync` got a 60 s `pg_net` timeout (migration `20261120130000`); admin `SetPicker` added. Chats and CRM skipped (automated run).
- **Status:** paths and lines checked with `rg`.
- **Next:** none.

## 2026-11-20 — architecture docs sync to `03e2ea6`

- **Changed:** codebase-map: `useSiteGateEnabled` 5 s timeout; `site_settings` admin policies split (migration `20261120140000`). Chats and CRM skipped (automated run).
- **Status:** paths and lines checked with `rg`.
- **Next:** none.

## 2026-11-20 — architecture docs sync to `de535e2`

- **Changed:** codebase-map: coming-soon gate switch (`site_settings`, `useSiteGateEnabled`, `ComingSoonGateCard`). Chats and CRM skipped (automated run).
- **Status:** paths and lines checked with `rg`.
- **Next:** none.

## 2026-11-20 — architecture docs sync to `e75e3cf`

- **Changed:** codebase-map: admin `CreateOrderDialog`, `MysteryLock`/`mystery.ts`, migration `orders_is_mystery`. Chats and CRM skipped (automated run).
- **Status:** paths and lines checked with `rg`/`test -e`.
- **Next:** none.

## 2026-11-20 — architecture docs sync to `10f692e`

- **Changed:** codebase-map lpexpress section: `returnSize` bumps only across distinct outbound parcels; `orders.lp_parcel_size` migration; line numbers. Chats and CRM skipped (automated run).
- **Status:** symbols and lines checked with `rg`.
- **Next:** none.

## 2026-11-20 — architecture docs incremental sync

- **Changed:** codebase-map synced `48bf10a`→`6fe244d` (lpexpress return sizing from `products.shipping_size`, line numbers; rating hook and badge). Chats and CRM not read (automated run).
- **Status:** paths and symbols checked with `rg`.
- **Next:** none.

## 2026-11-20 — product shipping size for return labels

- **Changed:** `products.shipping_size` (XS–XL, default S; migration `products_shipping_size` applied live). Admin product dialog has a "Shipping size" select. `lpexpress` `create-return-label` now sizes the parcel from the sets' sizes (largest, one step up for several sets); deployed as v14. Both `database.types.ts` hand-edited.
- **Status:** typecheck OK; no real return label created yet.
- **Next:** set sizes on real sets in admin, verify the first return label size on LP.

## 2026-11-19 — architecture docs sync (`48bf10a`)

- **Changed:** map rows for admin courier override / manual tracking code and merch quantity stepper. Docs only. Chats and CRM skipped.

## 2026-11-19 — architecture docs sync (`4492cd5`)

- **Changed:** map row for admin order-table label cell (`25f1161`, PR #131). Docs only. Chats and CRM skipped.

## 2026-11-19 — architecture docs sync (`f0a5ea7`)

- **Changed:** map row for admin cart visibility in order lists (`f842908`, PR #129/#130). Docs only. Chats and CRM skipped.

## 2026-11-19 — architecture docs sync (`a03770e`)

- **Changed:** map updated for `31bdc41`/`a03770e` (cart_id grouping of rentals, admin cart view, merch item lines). Docs only. Chats and CRM skipped.

## 2026-11-19 — architecture docs sync (`2f9b09a`)

- **Changed:** map updated for `2f9b09a` (login form on `/account`, Nav avatar is a plain link); stale `Account.tsx` line refs fixed; `synced_commit` `2f9b09a`. Docs only. Chats and CRM skipped.

## 2026-11-19 — architecture docs sync (`52c4de3`)

- **Changed:** codebase map and candidate #7 updated after PRs #124/#125/#126 merged; LP Express line refs corrected; `synced_commit` `52c4de3`. Docs only; no code touched. Chats and CRM skipped.

## 2026-11-19 — product image backfill (live data change)

- **Changed:** 192 of 194 images used by `products` were converted to WebP (max 1600 px, quality 82) and uploaded as new `*-opt.webp` files to the `products` bucket (one-year cache header); `products.image_url` and `gallery` now point at them (97 products, none missing). Files served for products: 535 MB -> 16 MB; first 25 catalogue cards 73 MB -> 2 MB. The 2 already-small images were kept.
- **Not done:** the original files (199, ~542 MB) are still in the bucket; delete once the site has been checked. Revert: `supabase/rollbacks/20261119_product_images_webp_backfill_revert.sql`. Videos (hero/promo 19-20 MB, three 9-37 MB in `site-content`) and the three merch PNGs (21/10/10 MB) and one 9.9 MB community JPEG still to compress.

## 2026-11-19 — architecture docs sync (`1aaa744`)

- **Changed:** map note for `1aaa744` only (2 files changed since `53383b4`); `synced_commit` bumped. Chats and CRM not read.

## 2026-11-19 — architecture docs sync (`53383b4`)

- **Changed:** map + candidate #7 for `perf/image-optimisation` (optimiser in both apps, upload helper with bucket/cache); flagged that `41678c5` lives on `feat/merch-cart` only. Chats and CRM not read.

## 2026-11-19 — architecture docs sync (`41678c5`)

- **Changed:** map drops `optimiseImage` (removed in `41678c5`); cart round-3 notes; candidate #7 rewritten. `synced_commit` `41678c5`. Chats and CRM not read.

## 2026-11-19 — architecture docs sync (`7634f18`)

- **Changed:** map gets `optimiseImage` (storefront lib); candidate #7 added (image upload helper duplicated in admin). `synced_commit` `7634f18`. Chats and CRM not read.

## 2026-11-19 — architecture docs check (`fde922b`)

- **Changed:** `synced_commit` bumped to `fde922b`; no architecture content changed (types regeneration and a `ProfileEditDialog` restyle only). Chats and CRM not read.

## 2026-11-19 — architecture docs sync for carts

- **Changed:** `codebase-map` and `deepening-candidates` for `2677e36..a82d3e4` (paid courier for set carts, review-fix migration, index). `synced_commit` is `a82d3e4`. Chats and CRM not read (automated run).
- **Note:** `ba70986` is now an ancestor of HEAD. Migration `20261119180000_cart_review_fixes` is marked not applied only because the status note says so.

## 2026-11-19 — architecture docs sync for LP parcels

- **Changed:** lpexpress module in `codebase-map` for `2677e36`; `synced_commit` is `2677e36`. Chats and CRM not read (automated run).
- **Note:** `ba70986` (cart work) is on `feat/merch-cart`, not an ancestor of HEAD; cart sections stay as the working tree shows them. `admin/` only documented for the LP files.

## 2026-11-19 — architecture docs incremental sync

- **Changed:** architecture notes updated for the cart commits (`81f5a60`→`ba70986`); `synced_commit` is now `ba70986`. Chats and CRM not read (automated run).
- **Not covered:** uncommitted LP shipping work (`lpexpress` size/weight, admin `ShipTogetherDialog`) was left out until committed; `admin/` is not documented.

## 2026-11-19 — grouped returns + PR for admin deploy

- **Changed:** `create-return-label` accepts `orderIds[]` (size S/M/L/XL by set count, v12 live); storefront `ReturnDialog` lets a customer tick other held sets. LP changes committed on `feat/lp-parcel-options` (2677e36), PR #125. Admin is built inside the bricktime Vercel project, so deploy = merge to main.
- **Done:** PR #125 merged to main (294da04), Vercel production build started. **Next:** verify first real label in LP self-service.

## 2026-11-19 — paid courier in the set cart (branch `feat/merch-cart`, uncommitted)

- **Changed:** courier option in `/rinkiniai/krepselis` (+€3 once per cart, free if the plan has door delivery). Migration `20261119170000_paid_courier_rental_cart` (`record_paid_courier_rentals`: all-or-nothing, first order carries the Stripe session id), `create-rental-courier-checkout` accepts `productIds`, `stripe-webhook` handles `metadata.productIds`. RPC tested in a rolled-back transaction (dry run, real, replay idempotent, over-budget refused). Also: Briksiai progress bar, catalogue add-to-cart button, one-line plan badges.
- **Not done:** migration NOT applied and the two functions NOT deployed (deploying the webhook is required before the courier path can work); no real Stripe test of the cart fee.
- **Next:** apply + deploy, test-mode pay €3 for a two-set cart, regen types.

## 2026-11-19 — set (rental) cart (branch `feat/merch-cart`, uncommitted)

- **Changed:** "Į krepšelį" on `Drop` (desktop CTA + mobile icon), `RentalCartContext` (localStorage, ≤10 sets), Nav shows a second badge only when the set cart is non-empty, `/rinkiniai/krepselis` page (tier/availability/budget checks, terminal or plan door delivery), `toRentalErrorMessage` moved to `src/lib/rental.ts`. New migration `20261119150000_claim_rentals` (invoker RPC, one transaction, existing `guard_member_order_insert` stays the rule source). Typecheck + lint clean; cart UI checked in the browser pane.
- **Not done:** `claim_rentals` migration NOT applied remotely, so "Nuomotis" will fail until it is; paid courier fee not supported in the cart (message tells the member to rent singly); no real claim tested; `database.types.ts` entry added by hand.
- **Next:** apply the migration, claim two sets with a test member, regen types.

## 2026-11-19 — merch cart (branch `feat/merch-cart`, uncommitted)

- **Changed:** several merch items per checkout. `MerchCartContext` (localStorage) + `/merch/krepselis` page + Nav bag badge + "Į krepšelį" on `MerchDrop`; `create-merch-checkout` takes `items[]` (legacy single item still works, max 6 lines, qty ≤ 10, stock re-checked per line); webhook reads `metadata.cart` and calls new `record_merch_cart_order`; migration `20261119100000_merch_cart_orders` adds `merch_order_items` + `get_merch_order_lines_by_session`; thank-you page lists lines. Typecheck, vite build, `deno check` clean; cart flow checked in the browser pane. Not yet: migration applied, functions deployed, test-mode payment.
- **Next:** apply migration, regen `database.types.ts` (one function entry added by hand), deploy `create-merch-checkout` + `stripe-webhook`, test-mode 2-line purchase; then rental cart (`claim_rentals` RPC + `/rinkiniai/krepselis`).

## 2026-11-19 — LP label size/weight + ship several sets in one parcel

- **Changed:** `lpexpress` `create-label` accepts `orderIds[]` (admin only; same customer + destination, none labelled) and validates `size`/`weight`; `cancel` hits every order sharing the parcel. Admin: size (XS–XL) / weight picker in `OrderDetailSheet`, new `ShipTogetherDialog` + "Ship together" bulk action in Orders, `ParcelOptionsFields`. Admin typecheck + lint clean, `deno check` ok; `courierPickup` toggle (H2T) for locker parcels added. `lpexpress` deployed as v11 via project-2 MCP; not tested against real LP.
- **Next:** verify in LP self-service that `size` is honoured (code defaulted to M, user saw smallest slot); grouped customer returns (one `create-return-label` for several orders) not built; courier pickup call not in code, check LP API.

## 2026-11-18 — owner decisions applied

- **Changed:** returned sets free budget immediately (migration + UI wording, `useCredits` pruned), `mystery_s` credits 0, two functions deployed.
- **Next:** e2e test purchase; commit.

## 2026-11-18 — TASKS.md fix pass (3 agents)

- **Changed:** see status.md; typecheck passes, src lint clean; nothing committed/deployed.
- **Next:** deploy change-subscription + get-analytics, e2e test purchase.

## 2026-11-18 — architecture docs incremental (automated, 6)

- **Changed:** `codebase-map.md` synced to `81f5a60` (see changelog).
- **Next:** none from this run.

## 2026-11-18 — architecture docs incremental (automated, 5)

- **Changed:** vault only. `codebase-map.md` synced_commit `195f18a` → `ba8c33b`; Account plan buttons for members without a plan now go to `/subscribe`.
- **Open:** chats/CRM not read (skipped by instruction).

## 2026-11-18 — architecture docs incremental (automated, 4)

- **Changed:** vault only. `codebase-map.md` synced_commit `1186250` → `195f18a`; plan changes now live in `Checkout.tsx`, Account only navigates there; `PlanChangeSummary`/`DiscountCodeField` unreferenced.
- **Open:** chats/CRM not read (skipped by instruction).

## 2026-11-18 — architecture docs incremental (automated, 3)

- **Changed:** vault only. `codebase-map.md` synced_commit `1e55c31` → `1186250`; Pages note on upgrade routing and plan-only checkout redirect; admin `fetchPlanPrices`.
- **Open:** chats/CRM not read (skipped by instruction).

## 2026-11-18 — architecture docs incremental (automated, 2)

- **Changed:** vault only. `codebase-map.md` synced_commit `ec425ae` → `1e55c31`; noted `stripe-webhook` live-subscription re-read and `AuthContext` `refreshProfile` change.
- **Open:** chats/CRM not read (skipped by instruction).

## 2026-11-18 — architecture docs incremental (automated)

- **Changed:** vault only. `codebase-map.md` synced_commit `9b4413c` → `ec425ae`; added `VatNote` entry under Pages.
- **Open:** chats/CRM not read (skipped by instruction).

## 2026-11-18 — WhatsApp review, Stripe check, VAT note

- **Changed:** new `src/components/VatNote.tsx` ("Visos kainos nurodytos su PVM") shown on plan cards (`Subscriptions.tsx`), `Subscribe.tsx`, the `Account.tsx` plan-change picker and `MerchDrop.tsx` (uncommitted). Stripe sandbox `acct_1TgKMU8expYbOWjJ`: added the 21% inclusive PVM rate (`txr_1UbLvJ8expYbOWjJ93xRdB5t`) as `default_tax_rates` on 5 active test subs that lacked it (no proration).
- **Found (Stripe MCP, read-only):** prices match the site and the code sets VAT on new checkouts, but old invoices had no VAT; invoices carry no seller VAT id (`default_account_tax_ids` null) and no footer; the footer link in the chat points at a different account id (`acct_1TgKM39iqnB6VhnP`); user `4cf81f4c` has 5 active subs (leftovers from before the 6 Nov wipe); sandbox account has past-due verification (company tax id, owners). `BigCTA.tsx` is unused and shows old `$` prices.
- **Open:** cancel the leftover test subs (check DB first); seller VAT id + footer on the sandbox account (needs the VAT number); gift-card and penalty checkouts have no VAT rate (accountant's call); Stripe line descriptions stay English.
- **Done later:** VatNote committed (`ec425ae`). Decided to consolidate Stripe test onto the live account's test mode (`acct_1TgKM39iqnB6VhnP/test`); owner set the new `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` and webhook (`.../functions/v1/stripe-webhook`). Cleared `stripe_customer_id`/`stripe_subscription_id` and reset to paused/nano for 3 test members (`6e4f5184`, `4cf81f4c`, `6dcac626`) via `execute_sql`. Member `6dcac626` still has 1 `processing` order.
- **Webhook:** the new endpoint was on API `2026-05-27.dahlia` (period dates stayed null); recreated on `2025-02-24.acacia`, period dates now fill. A purchase then left the member `paused` (a stale `incomplete` snapshot won the race), so `stripe-webhook` now re-fetches the subscription on `customer.subscription.created/updated` — deployed as v25 via the `supabase-project-2` connector (source edit in `stripe-webhook/index.ts`, not committed yet). Member `6dcac626`'s leftover `processing` order was marked returned.
- **Next:** confirm the €5 plan change as a second test (status must stay active), check welcome email, VAT/footer on the invoice, then delete sandbox 1; commit the webhook change; push `fix/subscription-flow`.

## 2026-11-18 — architecture docs (automated run)

- **Changed:** vault only. New `architecture/codebase-map.md` (synced_commit `9b4413c`), `integrations.md`, `deepening-candidates.md`, `decisions-from-chat.md`; filled system-overview, folder-structure, tech-stack, data-flow, environment-variables.
- **Found:** `AGENTS.md` says `admin/` is a submodule, code says plain directory; `.env.example` and code disagree on several names; `trackEvent` has no caller.
- **Open:** WhatsApp/CRM not read (skipped by instruction); `process-plan-changes` cron schedule not in migrations; `routing`/`hooks`/`utils` notes not refreshed.
- **Next:** read the Bricktime chat for decisions; pick one candidate to explore.

## 2026-11-18 — account profile, plan picker, admin cancel

- **Changed (branch `fix/subscription-flow`, 3 commits, not pushed):** (1) `Account.tsx` refetches the whole subscriber row after the `plan_changed` webhook wait — it only merged `plan`/`home_delivery`, so `status` stayed stale and the profile showed no subscription until reload; (2) the payments-card "Pasirinkti planą" button now calls `openPlanChange` (the picker lives in the profile section above); (3) new edge function `admin-cancel-subscription` (admin JWT check, releases any schedule, cancels the Stripe subscription immediately, then sets the row `cancelled`) and `admin/src/pages/Subscribers.tsx` calls it for Cancel.
- **Why:** admin Cancel only set `subscribers.status`, so Stripe kept the subscription live and `create-checkout` refused a new plan with the 409 "Jau turi aktyvią prenumeratą".
- **Live:** `admin-cancel-subscription` v1 deployed via the multi-account `supabase-project-2` connector (the CLI gets 403 on deploy). Smoke test: 401 without a user. No real cancel run through it yet.
- **Open:** admin must be rebuilt/redeployed for the new Cancel; admin "Pause" and "Mark active" are still DB-only; the affected member's old Stripe subscription must be cancelled once (dashboard or admin) before they can re-subscribe.
- **Next:** push + PR, redeploy admin, test one admin cancel then a re-subscribe.

## 2026-11-13 — plan-change confirmation, VAT/lt on swaps, Checkout locale, welcome automation

- **Changed (all merged: #102–#105):** `change-subscription` has a `preview` mode + Checkout confirmation dialog ("Iš VISA ••4242 bus nuskaičiuota €X"), sets `default_tax_rates` and customer `preferred_locales=lt` on swaps; all four Checkout sessions (subscription, merch, gift card, penalty) send `locale: "lt"` because Checkout otherwise overwrites the customer locale with the browser's (en-GB). Omnisend (BRICKTIME): template + automation `6af725ad48aef24124a68d5b` for `subscription started`, enabled.
- **Live:** change-subscription v16, create-checkout v14, create-merch-checkout v12, create-gift-card-checkout v9, create-penalty-checkout v9, stripe-webhook v18. Test-mode cleanup: dzekuza@gmail.com subscriptions cancelled and its subscriber row reset; Justinas's test subscription got the VAT rate.
- **Open:** plans.credits for `mystery_s` is 2000 (migration says 0; banner shows "2000 briksių") — waiting for owner OK to set 0. Justinas's customer locale is still en-GB until his next purchase/swap. Needs a real test purchase to confirm lt + VAT + welcome email. Stripe dashboard seller/VAT id/invoice numbering still to do.
- **Next:** test purchase and plan change; fix `plans.credits`; decide whether merch/penalty need VAT.

## 2026-11-10 — VAT invoices, welcome event, merch delivery, stats, nav

- **Changed:** branch `feat/vat-invoices-merch-delivery` (not merged, no PR yet): pay-today line + gift card message in PDF; 21% inclusive VAT (`_shared/vat.ts`) and `lt` locale on subscription checkout and plan-change gap invoices; `subscription started` Omnisend event with plan/dates/price (see [[welcome-email]]); merch delivery choice (terminal free, courier +3 EUR) with migration `20261109120000` (applied live); `public_stats.active_sets` = sum of stock, migration `20261109130000` (applied live, reads 98); nav hamburger below `lg`.
- **Deployed live:** create-merch-checkout v11, create-checkout v13, stripe-webhook v17. Later same day: stripe-webhook v18 (enriched event) and change-subscription v15 (VAT on gap invoice) deployed too.
- **Status:** Omnisend MCP is the SKIN365 account, so the BRICKTIME welcome automation must be built by hand; Stripe dashboard still needs seller details/VAT id/invoice numbering.
- **Next:** commit + redeploy stripe-webhook, deploy change-subscription, open PR, build Omnisend automation, test merch terminal order.

## 2026-11-06 — pre-launch test data wiped

- **Changed:** live DB via the SQL editor (the Supabase connector refuses bulk deletes): deleted 5 rentals, 1 merch order (stock unit restored), 21 gift cards, 2 penalties, 1 missing-part request, 1 coupon; reset all 10 subscribers to no subscription. Stripe test data deleted from the Stripe dashboard by the owner.
- **Status:** verified — all transactional tables empty, subscribers reset, 97 products / 6 plans / 4 merch items intact. Duplicate-subscription and unpaid-gift-card follow-ups are moot.
- **Next:** a real end-to-end test purchase on production.

## 2026-11-05 — #96, #97, #98 merged; functions redeployed from main

- **Changed:** merged #97 (after resolving its conflict with #96) and #98 (retargeted to main) into main at `b48260f`. Compared every deployed function with main and redeployed the five that differed: stripe-webhook v16, create-gift-card-checkout v8, lpexpress v6, pause-subscription v2, create-checkout v12.
- **Status:** live functions match main; smoke-tested. Not tested end to end with a real payment.
- **Next:** Stripe cleanup (duplicate subscriptions, older unpaid gift cards), billing-period backfill, a real test purchase.

## 2026-11-05 — #98 cubic review rounds

- **Checkout guard:** create-checkout fails closed (stored subscription checked, Stripe errors rethrown, all pages listed, `incomplete` counted), payment-problem message, 10 s idempotency key.
- **Webhook:** stored-subscription guard on every path and throws on a failed read; billing period never moves back; longer pause block kept; invoice fetched only after a pause; Omnisend retried only on 429/5xx.
- **Gift cards:** row saved before the checkout URL; email first, then activate; pending shown as awaiting payment; admin counts used/pending/expired correctly.
- **Pause:** dates fixed (months-1, clamped day), re-entry guarded, undo save checked, per-request idempotency key, hidden on annual plans.
- **Rentals:** Legenda courier allowed; courier needs name, phone and address; two-code swap blocked; stale-row fallback to checkout; history refresh; monthly/annual renewal label.
- **Status:** pushed to #98; migrations applied live; five changed functions (create-checkout, stripe-webhook, create-gift-card-checkout, lpexpress, pause-subscription) NOT redeployed — waiting for #96/#97/#98 to merge, then compare live with main.
- **Next:** merge #96 → #97 → #98 (retarget to main); redeploy what differs; Stripe cleanup (duplicate subscriptions, older unpaid gift cards); backfill billing periods.

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
- **Next:** set GOOGLE_SERVICE_ACCOUNT_EMAIL / \_PRIVATE_KEY / GA4_PROPERTY_ID=548715432 / GSC_SITE_URL=sc-domain:bricktime.lt in Supabase secrets, then reload /analytics.

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
