---
tags: [backend, email, omnisend, stable]
updated: 2026-11-10
---

# Subscription welcome email

`stripe-webhook` pushes the Omnisend event **`subscription started`** once a
subscription checkout is paid (once per subscription: repeat Stripe deliveries
are skipped by comparing the stored `stripe_subscription_id`). The email itself
is built in the **BRICKTIME** Omnisend account as an automation triggered by
that event, sending immediately. Merge tags are `[[event.<property>]]`.

State (2026-11-13): template **Subscription Started - Welcome**
(`6af724a6c4d0ee03d41d24bf`) and automation `6af725ad48aef24124a68d5b`
(trigger `subscription started`/api, email threshold `all`, sender BRICKTIME,
`lt_LT`) exist and the automation is **enabled**. The API only accepted the
trigger after the first real event arrived, so the first test purchase did not
get an email; it needs a new purchase to verify.

**Checked 2026-11-18 via Omnisend MCP:** automation enabled, trigger `subscription started`/api, template stored with `[[event.*]]` tags (render preview shows them as `{{event_*}}`, same as the working gift-card email). No `subscription started` event exists yet for the two test contacts, so delivery is still unverified; needs one real test purchase. A contact that has unsubscribed (e.g. the 2026-11-15 test address) will not receive it.

## Event properties → email fields

| Email field | Event property | Example |
|---|---|---|
| Planas | `planName` | Mėgėjas |
| Būsena | `status` | Aktyvi |
| Aktyvavimo data | `activatedAt` | 2026-11-10 |
| Kitas mokėjimas | `nextPaymentAt` | 2026-12-10 |
| Prenumeratos kaina (€/mėn.) | `monthlyPrice` | 24.99 (recurring list price per month, incl. delivery, before one-off discounts) |
| Button "Rinktis LEGO® rinkinį" | `catalogUrl` | https://www.bricktime.lt/archive |

Also sent: `planKey`, `billing` (`monthly`/`annual`), `homeDelivery`, `amountPaid`
(first invoice after discounts). Lookups that fail leave `planName`,
`nextPaymentAt` or `monthlyPrice` as empty strings.

## Copy

Subject: *Sveiki atvykę į BRICK TIME! Jūsų prenumerata aktyvi.* Body and the
LEGO® disclaimer are the owner's text; keep them verbatim in the template.
