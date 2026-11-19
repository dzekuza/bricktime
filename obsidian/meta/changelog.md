---
tags: [meta, changelog]
updated: 2026-11-19
---

# Changelog

Chronological log of notable changes to the project. Newest first.

## 2026-11-19 — architecture docs sync (LP parcels, `2677e36`)

- **Changed:** `codebase-map` lpexpress module (orderIds, size/weight, courierPickup, admin `ShipTogetherDialog`/`ParcelOptionsFields`); `synced_commit` now `2677e36`. Cart sections still describe the uncommitted working tree (branch `feat/merch-cart`, not in `2677e36` history). Chats not read.

## 2026-11-19 — architecture docs sync (`81f5a60`→`ba70986`)

- **Changed:** `codebase-map` (cart routes, contexts, `claim_rentals`, `record_merch_cart_order`), `deepening-candidates` #4, `decisions-from-chat`, `integrations`.

## 2026-11-19 — carts: several merch items per payment, several sets per claim

- **Changed:** merch cart (`/merch/krepselis`, one Stripe checkout with `items[]`, `merch_order_items`, `record_merch_cart_order`), set cart (`/rinkiniai/krepselis`, `claim_rentals` all-or-nothing RPC) and a €3 courier fee per cart (`record_paid_courier_rentals`). Migrations and functions are applied/deployed (see [[status]]); review-fix migration `20261119180000` is not applied yet; payments are untested in Stripe test mode.

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
