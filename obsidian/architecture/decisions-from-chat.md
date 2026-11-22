---
tags: [architecture, decisions]
updated: 2026-11-20
---

# Decisions from chat

Dated decisions, constraints and agreements from the WhatsApp group and CRM tasks that shape the architecture. Each: source, affected module.

> [!warning] Not read this run
> This automated run skipped WhatsApp and CRM reading by instruction, so no chat-sourced decisions are recorded yet. The entries below come from the vault's own notes and code comments and are marked as such.

| Date | Decision | Source | Module |
|---|---|---|---|
| 2026-11-13 | Plan changes show the charge before it happens; swapped subscriptions carry 21% inclusive VAT; invoices render in Lithuanian | [[changelog]] (vault, not chat) | [[codebase-map]] Billing functions |
| 2026-11-10 | Merch uses the same delivery model as subscriptions: terminal free, courier +3 EUR | [[changelog]] (vault, not chat) | One-off checkouts |
| 2026-11 | Cancelling waits until every set is returned; the fee keeps running meanwhile | code comment `cancel-subscription/index.ts:23` | Billing functions |
| 2026-11 | Customer cannot cancel or switch plans in the Stripe portal; both stay in the app | code comment `create-billing-portal/index.ts:12` | Billing functions |
| 2026-11 | Pause blocks rentals immediately; the paid current month is not refunded | [[status]] blockers | Billing functions, Database |
| 2026-11-19 | Set cart claims are all-or-nothing in one transaction; the existing rental guard stays the single rule source; paid courier fee not supported in the cart | [[session-log]] (vault, not chat) | Database (`claim_rentals`), Pages |
| 2026-11-19 | Merch checkout takes several lines in one Stripe session (max 6 lines, qty ≤10) | [[changelog]] (vault, not chat) | One-off checkouts, Stripe webhook |

Chat sources to review next run: Bricktime group `120363429156450686@g.us`, CRM project `7bdc2530-a76a-4751-aa77-7801cc91cb21`.
