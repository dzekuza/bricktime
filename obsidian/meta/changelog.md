---
tags: [meta, changelog]
updated: 2026-08-25
---

# Changelog

Chronological log of notable changes to the project. Newest first.
This is a human-curated log — not a mirror of `git log`. Record *why*, not just
*what*; the diff already covers *what*.

## 2026-11-10 — VAT, welcome email, merch delivery

- Subscription and plan-change invoices carry 21% inclusive VAT and render in Lithuanian; the price shown to customers is unchanged because prices were already gross.
- Merch got the same delivery model as subscriptions (terminal free, courier +3 EUR) and stores it on `merch_orders`.
- Landing "active sets" now counts copies (stock), not catalog rows.

## 2026-08-25 — vault initialised

- Project brain scaffolded from the shared `.project-brain` template: vault,
  root shims (`AGENTS.md` / `CLAUDE.md` / `.cursorrules`), and the three Claude
  Code hooks that keep this vault in sync.
