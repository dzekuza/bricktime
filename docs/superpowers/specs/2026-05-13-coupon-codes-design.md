# Coupon Codes — Design Spec

**Date:** 2026-05-13  
**Scope:** Admin coupon management + Subscribe page redemption

---

## Overview

Admins create coupon codes with configurable discount type, value, duration, usage cap, and expiry. Users enter a code on the `/subscribe` page before confirming a plan; the discount is reflected in the price summary.

---

## Data Model

New Supabase table: `coupons`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK, `gen_random_uuid()` |
| `code` | `text` | Unique, uppercase |
| `discount_type` | `text` | `'percentage'` or `'fixed'` |
| `discount_value` | `numeric` | % value or € amount |
| `duration_months` | `int \| null` | null = applies forever |
| `max_uses` | `int \| null` | null = unlimited |
| `uses_count` | `int` | Default 0, incremented on redemption |
| `expires_at` | `timestamptz \| null` | null = no expiry |
| `active` | `boolean` | Default true; admin can toggle off |
| `created_at` | `timestamptz` | Default now() |

RLS: Allow anon SELECT (so vite-app can validate). All writes go through `supabaseAdmin` (service role).

Redemption increment: Supabase RPC function `redeem_coupon(code text)` — increments `uses_count` by 1, returns the coupon row. Called when user confirms subscription.

---

## Admin — Coupons Page

**New file:** `admin/src/pages/Coupons.tsx`

**Wired into:**
- `admin/src/App.tsx` — add route `/coupons`
- `admin/src/components/AppSidebar.tsx` — add nav item "Coupons" with `TicketIcon` between Orders and Settings

**Page layout:**
- Header: "Coupons" title + "New Coupon" button (orange, pill)
- Table columns: Code (monospace pill), Type (% or € badge), Discount, Duration, Uses (count / max or ∞), Expires, Active toggle, Edit / Delete icons
- Active/inactive is an inline toggle switch (not a badge) — toggles `active` field via `supabaseAdmin`
- Delete shows a confirmation before removing

**Create / Edit dialog:**
- Sheet or Dialog (follow `ProductEditDialog` pattern)
- Fields: Code (text, auto-uppercased), Type (select: Percentage / Fixed), Value (number), Duration months (number, placeholder "blank = forever"), Max uses (number, placeholder "blank = unlimited"), Expires (date input), Active (checkbox/toggle)
- Save writes via `supabaseAdmin.from('coupons').upsert()`

---

## Subscribe Page — Coupon Redemption

**File:** `vite-app/src/pages/Subscribe.tsx`

**Placement:** Below the selected plan's price line, above the CTA button — wherever the plan confirmation summary is rendered. Added inline (no new component file needed, Subscribe.tsx is already large but this is contained state).

**UX flow:**
1. User selects a plan — price summary becomes visible
2. Below price: text input (monospace, `COUPON CODE` placeholder) + "Apply" button
3. On Apply:
   - Fetch from Supabase: `supabase.from('coupons').select('*').eq('code', code.toUpperCase()).single()`
   - Validate: `active`, not expired (`expires_at` null or > now), not maxed (`max_uses` null or `uses_count < max_uses`)
   - Invalid → red error text below input ("Code not found", "Code expired", "Code limit reached")
   - Valid → green success banner ("✓ WELCOME20 applied — 20% off first month"), discount line appears in price summary, input collapses
4. "Remove" link in success banner clears the coupon state
5. On "Prenumeruoti →" click: call `redeem_coupon(code)` RPC to increment uses_count, then proceed

**State needed (local):**
```ts
const [couponInput, setCouponInput] = useState('')
const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
const [couponError, setCouponError] = useState<string | null>(null)
const [couponLoading, setCouponLoading] = useState(false)
```

**Discount calculation:**
- Percentage: `discountedPrice = price * (1 - discount_value / 100)`
- Fixed: `discountedPrice = Math.max(0, price - discount_value)`
- Show original price struck through, discounted price, "for N months" label if `duration_months` set

---

## Out of Scope

- Coupon codes applied to existing subscribers mid-cycle (billing change)
- Per-plan coupon restrictions (any code works on any plan)
- Coupon analytics / usage history view
