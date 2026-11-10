---
tags: [backend, email, omnisend, stable]
updated: 2026-11-10
---

# Subscription welcome email

`stripe-webhook` pushes the Omnisend event **`subscription started`** once a
subscription checkout is paid (once per subscription: repeat Stripe deliveries
are skipped by comparing the stored `stripe_subscription_id`). The email itself
is built in the **BRICKTIME** Omnisend account as an automation triggered by
that event, sending immediately. The Omnisend MCP in Claude Code is connected to
a different brand (SKIN365), so this is done by hand in the dashboard.

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
