---
tags: [meta, changelog]
updated: 2026-11-22
---

# Changelog

Chronological log of notable changes to the project. Newest first.

## 2026-11-22 — WhatsApp admin alerts: orders, forms, delivery check (stacked on PR #150)

- **Added:** DB triggers (migration `20261122130000`) queue alerts for merch orders, set rentals (one per cart), Mystery Box requests, return requests, the missing-part form, bought gift cards and product reviews; orders created by an admin do not alert. Per-day caps on member-triggered kinds, extra index migration `20261122130100`. Admin card lists every kind and has a "Send test alert" button plus the latest alerts with status. Verified on a scratch Postgres: apply, behaviour, rollback, reapply.
- **Not covered:** penalties paid, waitlist signups, community posts, and true delivery receipts (status `sent` means the provider accepted it).

## 2026-11-22 — WhatsApp admin alerts (PR #150)

- **Added:** outbox table `admin_notifications` (migration `20261122120000`), `subscribers` insert trigger, per-minute cron `send-admin-notifications`, edge function of the same name, `_shared/whatsapp.ts` (Meta Cloud API or Twilio), `_shared/admin-notifications.ts`, and `stripe-webhook` enqueues for subscription started, payment failed and cancelled. Admin Settings > Notifications card writes the `admin_whatsapp` site setting (off by default).
- **Secrets:** `ADMIN_WHATSAPP_TO` plus either `WHATSAPP_TOKEN`/`WHATSAPP_PHONE_NUMBER_ID` (Meta) or `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/`TWILIO_WHATSAPP_FROM` (Twilio). Not merged or deployed yet.

## 2026-11-22 — architecture docs synced to `3d5f1be`

- **Updated:** `architecture/codebase-map.md` (`synced_commit` 3d5f1be). Only code change since `f3554ce`: admin favicon/title (`admin/index.html`, `admin/public/vite.svg`); no map facts changed. Chats skipped.

## 2026-11-20 — architecture docs synced to `f3554ce`

- **Updated:** `architecture/codebase-map.md` (`synced_commit` f3554ce). Only change since `ccd3b5d` was `OrderTracking.tsx` and `RentedOrderCard.tsx` label contrast (`text-ink/50` to `/60`); no map facts changed. Chats skipped.

## 2026-11-20 — architecture docs synced to `ccd3b5d`

- **Updated:** `architecture/codebase-map.md` (`synced_commit` ccd3b5d): `lpexpress-sync` now reads `eventDate` then `date` (#145 merged), so browser and edge function agree; countdown format `Nd Nh Nmin`. Other changes were styling only. Chats skipped.

## 2026-11-20 — architecture docs synced to `9b75241`

- **Updated:** `codebase-map.md` (`synced_commit` 9b75241): `OrderTracking` now reads `eventDate ?? date` and uses brand badge styles; `lpexpress-sync` still reads `date` only. Chats skipped.

## 2026-11-20 — architecture docs synced to `bbaacca`

- **Updated:** `codebase-map.md` (`synced_commit` bbaacca): `MerchCard` keeps 4:3 without an image; skeleton matches (`Merch.tsx:98,170`). Only code change since 68c7931. Chats skipped.

## 2026-11-20 — architecture docs synced to `68c7931`

- **Updated:** `architecture/codebase-map.md` (`synced_commit` 68c7931). Correction: `d3eaefa` (lpexpress-sync `eventDate`) lives on `fix/lp-sync-event-date`, not in this HEAD; the `lpexpress-sync` row now describes HEAD (`eventDate()` reads `date`, `:46`; `Deno.serve` `:57`). `MerchCard` image frame `aspect-[4/5]` / `md:aspect-[4/3]`. Chats skipped.

## 2026-11-20 — architecture docs synced to `d3eaefa`

- **Updated:** `architecture/codebase-map.md` (`synced_commit` d3eaefa; `lpexpress-sync` line ref and `eventDate` timestamp note; `LpTrackingEvent.eventDate` added in `_shared/lpexpress.ts`). Chats skipped.

## 2026-11-20 — architecture docs synced to `6ad2d2b`

- **Updated:** `architecture/codebase-map.md` (`synced_commit` 6ad2d2b; credits-reset rows no longer branch-only after PR #143 merge; `6ad2d2b` changed only merch card image ratio in `src/pages/Merch.tsx`). Chats skipped.

## 2026-11-20 — architecture docs synced to `357879a`

- **Updated:** `architecture/codebase-map.md` (`synced_commit` 357879a; credits-reset rows flagged branch-only; `357879a` only removed the merch card description in `src/pages/Merch.tsx`). Chats skipped.

## 2026-11-20 — architecture docs synced to `179d56d`

- **Updated:** `architecture/codebase-map.md` (credits reset at next charge: `useCreditsReset`, `CreditsResetNotice`, migration `20261121100000`). Chats skipped.

## 2026-11-20 — architecture docs synced to `b388322`

- **Updated:** `architecture/codebase-map.md` (`b388322` landed: rejected-session record, admin plan label, aria-pressed; stripe-webhook line refs refreshed). Chats skipped.

## 2026-11-20 — architecture docs synced to `f6d2c81`

- **Updated:** `architecture/codebase-map.md` (Mystery Box review fixes, `rejected_checkout_sessions`), `architecture/integrations.md`. Chats skipped.

## 2026-11-20 — architecture docs synced to `d985cd2`

- **Updated:** `architecture/codebase-map.md` (Mystery Box request flow), `architecture/integrations.md`. Chats skipped.

## 2026-11-20 — architecture docs synced to `7a7362c`

- **Updated:** `architecture/codebase-map.md`: `lpexpress-sync` unfamiliar-state logging, cron 60 s timeout, admin `SetPicker`. Chats skipped.

## 2026-11-20 — architecture docs synced to `03e2ea6`

- **Updated:** `architecture/codebase-map.md`: gate hook 5 s timeout, `site_settings` admin policies split per command. Chats skipped.

## 2026-11-20 — architecture docs synced to `de535e2`

- **Updated:** `architecture/codebase-map.md`: `site_settings` table and RLS, `useSiteGateEnabled`, admin `ComingSoonGateCard`. Chats and CRM skipped (automated run).

## 2026-11-20 — architecture docs synced to `e75e3cf`

- **Updated:** `architecture/codebase-map.md`: admin `CreateOrderDialog`, storefront Mystery Box blur (`MysteryLock`, `isMysteryHidden`), column `orders.is_mystery`. Chats and CRM skipped (automated run).

## 2026-11-20 — architecture docs synced to `10f692e`

- **Updated:** `architecture/codebase-map.md` lpexpress module (return size reuses outbound `orders.lp_parcel_size`; line numbers; admin prefill).

## 2026-11-20 — architecture docs synced to `6fe244d`

- **Updated:** `architecture/codebase-map.md` (lpexpress return sizing, `useProductRatings`/`RatingBadge`), `deepening-candidates.md` #6 note.

## 2026-11-20 — product shipping size

- **Added:** `products.shipping_size`, admin select, return label sized from it (`lpexpress` v14).

## 2026-11-19 — architecture docs sync (`48bf10a`)

- **Changed:** map for admin courier override + manual shipping code (`48bf10a`: `lpexpress` `set-tracking`, `deliveryMethod`) and merch quantity selector (`0f1ad3d`, PR #132); `synced_commit` `48bf10a`. Chats and CRM skipped (automated run).

## 2026-11-19 — architecture docs sync (`4492cd5`)

- **Changed:** map row for admin `OrderLabelCell` (`25f1161`, PR #131); `synced_commit` `4492cd5`. Chats and CRM skipped (automated run).

## 2026-11-19 — architecture docs sync (`f0a5ea7`)

- **Changed:** map: admin merch list item lines and rental "ordered together" label (`f842908`); `synced_commit` `f0a5ea7`. Chats and CRM skipped (automated run).

## 2026-11-19 — architecture docs sync (`a03770e`)

- **Changed:** map: `orders.cart_id` + index (migrations `20261119210000/210100`), cart grouping in admin Orders/OrderDetailSheet, merch item lines; `synced_commit` `a03770e`. Chats and CRM skipped (automated run).

## 2026-11-19 — architecture docs sync (`2f9b09a`)

- **Changed:** login moved from the Nav popover to the logged-out `Account` view (`AvatarLink`); map note added, `Account.tsx` line refs refreshed; `synced_commit` `2f9b09a`. Chats and CRM not read (automated run).

## 2026-11-19 — architecture docs sync (`52c4de3`)

- **Changed:** map branch note replaced by merge state (PRs #124, #125, #126 merged), LP Express line refs fixed, candidate #7 branch remark removed; `synced_commit` `52c4de3`. Chats and CRM not read (automated run).

## 2026-11-19 — product images converted to WebP

- **Changed:** product images in Storage resized to 1600 px WebP and `products` repointed (535 MB -> 16 MB); new admin and community uploads are resized the same way (PR #126). Originals kept for now; revert script in `supabase/rollbacks/`.

## 2026-11-19 — architecture docs sync (`1aaa744`, branch `perf/image-optimisation`)

- **Changed:** one note in the map for `1aaa744` (gallery upload fix, merch skeleton); `synced_commit` `1aaa744`. Chats and CRM not read.

## 2026-11-19 — architecture docs sync (`53383b4`, branch `perf/image-optimisation`)

- **Changed:** map gets `optimiseImage` and a branch-divergence note (`41678c5` is not an ancestor of HEAD); candidate #7 rewritten; `synced_commit` `53383b4`. Chats and CRM not read (automated run).

## 2026-11-19 — architecture docs sync (`7634f18..41678c5`)

- **Changed:** `codebase-map` (removed `optimiseImage`, cart round-3 notes, migrations applied), `deepening-candidates` #7 rewritten, `synced_commit` `41678c5`. Chats and CRM not read (automated run).

## 2026-11-19 — architecture docs sync (`fde922b..7634f18`)

- **Changed:** `codebase-map` lib table (+`optimiseImage`), `deepening-candidates` #7, `synced_commit` is `7634f18`. Source change: `perf: shrink uploaded images and lazy-load catalogue cards`. Chats and CRM not read (automated run).

## 2026-11-19 — architecture docs check (`a82d3e4..fde922b`)

- **Changed:** only `synced_commit` is now `fde922b`. Source changes were a type regeneration (adds `record_paid_courier_rentals`, already in the map) and a formatting/`Button` change in `ProfileEditDialog.tsx`; no module or interface changed. Chats and CRM not read (automated run).

## 2026-11-19 — architecture docs sync (carts, `a82d3e4`)

- **Changed:** `codebase-map` cart paragraph, `record_paid_courier_rentals`, `claim_rentals` redefinition, order_id index; deepening candidate 4 refreshed; `synced_commit` now `a82d3e4`. Chats and CRM not read (automated run).

## 2026-11-19 — architecture docs sync (LP parcels, `2677e36`)

- **Changed:** `codebase-map` lpexpress module (orderIds, size/weight, courierPickup, admin `ShipTogetherDialog`/`ParcelOptionsFields`); `synced_commit` now `2677e36`. Cart sections still describe the uncommitted working tree (branch `feat/merch-cart`, not in `2677e36` history). Chats not read.

## 2026-11-19 — architecture docs sync (`81f5a60`→`ba70986`)

- **Changed:** `codebase-map` (cart routes, contexts, `claim_rentals`, `record_merch_cart_order`), `deepening-candidates` #4, `decisions-from-chat`, `integrations`.

## 2026-11-19 — carts: several merch items per payment, several sets per claim

- **Changed:** merch cart (`/merch/krepselis`, one Stripe checkout with `items[]`, `merch_order_items`, `record_merch_cart_order`), set cart (`/rinkiniai/krepselis`, `claim_rentals` all-or-nothing RPC) and a €3 courier fee per cart (`record_paid_courier_rentals`). Migrations and functions are applied/deployed (see [[status]]); review-fix and index migrations (`20261119180000`, `20261119190000`) are applied too; payments are untested in Stripe test mode.

## 2026-11-19 — LP shipping: parcel size/weight and shared parcels

- **Changed:** admin can pick locker size / courier weight when generating a label and ship several of one customer's sets in one LP parcel (shared `lp_parcel_id`/`lp_barcode`); `cancel` applies to the whole parcel. Grouped returns not yet.

## 2026-11-18 — architecture docs incremental (automated, 6)

- **Changed:** vault only. `codebase-map.md` synced_commit `ba8c33b` → `81f5a60`: `CancelSubscriptionDialog`, `PlanChangeConfirm` breakdown, `useCredits` pruned, `used_credits` redefined (20261118120000), orphans deleted.
- **Open:** chats/CRM not read (skipped by instruction).

## 2026-11-18 — architecture docs incremental (automated, 5)

- **Changed:** vault only. `codebase-map.md` synced_commit `195f18a` → `ba8c33b`; Account plan buttons for members without a plan now go to `/subscribe`.
- **Open:** chats/CRM not read (skipped by instruction).

## 2026-11-18 — architecture docs incremental (automated, 4)

- **Changed:** vault only. `codebase-map.md` synced_commit `1186250` → `195f18a`; Pages note rewritten (plan changes moved from Account to Checkout, two orphan components); candidate 1 evidence updated.
- **Open:** chats/CRM not read (skipped by instruction).

This is a human-curated log — not a mirror of `git log`. Record _why_, not just
_what_; the diff already covers _what_.

## 2026-11-18 — architecture docs incremental (automated, 3)

- **Changed:** vault only. `codebase-map.md` synced_commit `1e55c31` → `1186250`; documented upgrade-to-checkout routing, plan-only checkout success URL, admin `fetchPlanPrices`.
- **Open:** chats/CRM not read (skipped by instruction).

## 2026-11-18 — architecture docs incremental sync (2)

- `codebase-map` synced to `1e55c31`: webhook re-reads the live subscription; `refreshProfile` memoised on user id.

## 2026-11-18 — architecture docs incremental sync

- `codebase-map` synced to `ec425ae`: added `VatNote` (price-includes-VAT note on 4 surfaces).

## 2026-11-18 — architecture docs first full pass

- Added `codebase-map`, `integrations`, `deepening-candidates`, `decisions-from-chat`; filled the five architecture notes from code at `9b4413c`. Chats not read.

## 2026-11-18 — admin cancel reaches Stripe, account page fixes

- Admin "Cancel subscription" now cancels the Stripe subscription through the new `admin-cancel-subscription` function; a status-only update left Stripe billing and blocked re-subscribing. `Account.tsx` now shows a fresh purchase without a reload and the payments-card plan button scrolls to the picker.

## 2026-11-13 — plan-change confirmation, Checkout locale

- Plan changes show what will be charged before it happens; the swapped subscription carries 21% VAT and invoices render in Lithuanian.
- Stripe Checkout sessions send `locale: "lt"`: Checkout writes its page language onto the customer, which was flipping invoices to English.

## 2026-11-10 — VAT, welcome email, merch delivery

- Subscription and plan-change invoices carry 21% inclusive VAT and render in Lithuanian; the price shown to customers is unchanged because prices were already gross.
- Merch got the same delivery model as subscriptions (terminal free, courier +3 EUR) and stores it on `merch_orders`.
- Landing "active sets" now counts copies (stock), not catalog rows.

## 2026-08-25 — vault initialised

- Project brain scaffolded from the shared `.project-brain` template: vault,
  root shims (`AGENTS.md` / `CLAUDE.md` / `.cursorrules`), and the three Claude
  Code hooks that keep this vault in sync.
