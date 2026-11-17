---
tags: [meta, changelog]
updated: 2026-08-25
---

# Changelog

Chronological log of notable changes to the project. Newest first.
This is a human-curated log — not a mirror of `git log`. Record *why*, not just
*what*; the diff already covers *what*.

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
