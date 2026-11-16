---
tags: [meta, changelog]
updated: 2026-08-25
---

# Changelog

Chronological log of notable changes to the project. Newest first.
This is a human-curated log — not a mirror of `git log`. Record *why*, not just
*what*; the diff already covers *what*.

## 2026-11-16 — architecture docs refreshed to `a985f7f`

- Incremental run for PRs #111-#114: paid courier rental flow (`create-rental-courier-checkout`, `record_paid_courier_rental`, `usePaidCourierReturn`) added to [[billing-edge]], [[database-module]], [[storefront-shared]], [[storefront-pages]], [[integrations]], [[data-flow]]; merch VAT and gift-card default greeting noted; [[decisions-from-chat]] and [[deepening-candidates]] updated.

## 2026-11-16 — architecture docs generated

- First full architecture pass at `7e98519`: filled the five architecture notes and added [[codebase-map]] (with 6 module notes under `architecture/modules/`), [[integrations]], [[deepening-candidates]] and [[decisions-from-chat]]. Findings: schema drift (tables without CREATE), no `.env.example`, `process-plan-changes` cron not in migrations.

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
