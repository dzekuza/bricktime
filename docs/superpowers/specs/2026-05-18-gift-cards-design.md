# Gift Cards Feature — Design Spec

**Date:** 2026-05-18  
**Project:** bricks / vite-app + Supabase  
**Status:** Approved, ready for implementation

---

## Overview

Users can purchase gift cards in fixed denominations (€20, €30, €50, €80, €100, €200) for anyone. The recipient receives a unique code by email and it is also shown on-screen. The code can later be entered at the Subscribe or Merch checkout to apply a discount.

---

## 1. Page — `/gift-cards`

**Structure** (mirrors existing Merch page style):

- **Hero** — `brick-card` on dark background, breadcrumb `BRICKTIME / Dovanų kortelės`, display heading, short description.
- **Denomination grid** — 6 tiles in a responsive grid (1 → 2 → 3 columns). Each tile shows the amount prominently plus a short tagline. Uses `brick-card brick-card-hover`.
- **Purchase form** — appears below the grid when a denomination is selected (no modal). Fields:
  - Recipient email (required)
  - Personal message (optional, max 140 chars)
  - Buyer email (required, for Stripe receipt)
  - "Pirkti dovanų kortelę →" button (triggers `create-gift-card-checkout`)
- **Success state** — shown when `?payment=success` is in the URL. Displays:
  - Large "✓" confirmation
  - The unique code in a monospace box with a copy button
  - Recipient email it was sent to
  - Note that an email has also been sent to the recipient

---

## 2. Database — `gift_cards` table

```sql
create table gift_cards (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,         -- 12-char uppercase alphanumeric
  amount_cents  int not null,                 -- e.g. 2000 = €20
  recipient_email text not null,
  buyer_email   text not null,
  message       text,
  status        text not null default 'active', -- active | used | expired
  stripe_session_id text,
  redeemed_by_user_id uuid references auth.users(id),
  redeemed_at   timestamptz,
  expires_at    timestamptz not null,         -- now() + 1 year
  created_at    timestamptz not null default now()
);
```

RLS: public insert is blocked; edge functions use service role. Read access: authenticated user can read their own redeemed cards. Admins can read all.

---

## 3. Edge Functions

### `create-gift-card-checkout`
- **Input:** `{ amountCents, recipientEmail, buyerEmail, message, successUrl, cancelUrl }`
- **Action:** Creates a Stripe Checkout session in `payment` mode for the given amount. Stores a pending row in `gift_cards` (status `active`, code generated here).
- **Output:** `{ url }` — Stripe hosted checkout URL.

Code generation: 12-char uppercase alphanumeric (`XXXX-XXXX-XXXX` format), generated with `crypto.randomUUID()` trimmed and formatted server-side.

### `verify-gift-card`
- **Input:** `{ code }`
- **Output:** `{ valid: boolean, amountCents: number, status: string }` or error.
- **Purpose:** Called at checkout (Subscribe / Merch) to validate before applying. Does not consume the card.
- **Note:** Actual redemption (marking `used`, applying discount) is a follow-up task scoped to the checkout integration.

---

## 4. Email Delivery

After `create-gift-card-checkout` creates the Stripe session and stores the code, the success page (`?payment=success`) calls a lightweight endpoint (or uses `finalize-gift-card` edge function) that:
1. Emails the recipient their code + message via Supabase's SMTP / Resend integration.
2. Emails the buyer a receipt summary.

If email setup is not yet wired, show the code prominently on-screen as the fallback.

---

## 5. Nav

Add "Dovanų kortelės" link to `Nav.tsx` alongside existing Merch/Bendruomenė links, pointing to `/gift-cards`.

---

## 6. Out of Scope (this iteration)

- Checkout-side redemption UI (code entry field on Subscribe / Merch checkout pages)
- Partial redemption (card used for less than its full value)
- Admin panel gift card management page
- Gift card expiry enforcement beyond DB column

---

## 7. File Plan

| File | Action |
|------|--------|
| `vite-app/src/pages/GiftCards.tsx` | New page |
| `vite-app/src/App.tsx` | Add `/gift-cards` route |
| `vite-app/src/components/Nav.tsx` | Add nav link |
| `supabase/migrations/YYYYMMDD_gift_cards.sql` | New migration |
| `supabase/functions/create-gift-card-checkout/index.ts` | New edge function |
| `supabase/functions/verify-gift-card/index.ts` | New edge function |
