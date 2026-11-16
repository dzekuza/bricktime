---
tags: [architecture]
updated: 2026-11-16
---

# System Overview

The big picture of `bricks` (BRICKTIME): what it is, how a request flows, and the mental model to hold while working on it. Facts here were read from code at commit `7e98519`; see [[codebase-map]] for the module catalog.

## What it is

BRICKTIME (https://www.bricktime.lt) is a Lithuanian LEGO **rental subscription**. A member picks a plan tier (Nano to Mega, plus "mystery" plans) that gives a monthly € **budget** (`plans.credits`), claims catalog products (`/archive`) whose summed value stays within the budget, holds several sets at once, and returns them to free budget. Merch (hoodie, t-shirt) and gift cards are sold as one-off Stripe payments. Copy is Lithuanian. Two web apps share one Supabase project: the customer storefront (`src/`) and the admin dashboard (`admin/`). Deployment is Vercel (storefront + admin, one build) with edge functions and migrations on Supabase.

## Mental model

The browser talks to Supabase directly for reads and for most member-owned writes, and **row-level security plus database triggers are the enforcement layer** (for example a member inserts their own `orders` row from `Checkout.tsx` and `guard_member_order_insert` / `assert_product_available` validate it). Anything that touches money, Stripe, LP Express shipping, Omnisend or needs the service role goes through a Supabase **Edge Function** (Deno). Stripe is the source of truth for subscription state; `stripe-webhook` mirrors it into `subscribers`, and the browser never trusts redirect URL params, it polls the row via `waitForSubscriberBilling` ([[data-flow]]).

## Request lifecycle

1. Browser loads the Vite SPA (`index.html` -> `src/main.tsx` -> `src/App.tsx`); Vercel rewrites every path to `/index.html` (`vercel.json`), `/admin/*` to the admin build.
2. `ComingSoonGate` (`VITE_SITE_ACCESS_CODE`) blocks the public site until an access code is stored; `vite dev` is never gated.
3. `react-router-dom` routes to a page in `src/pages/`; pages read Supabase with the anon client (`src/lib/supabase.ts`) and call edge functions with `supabase.functions.invoke`.
4. Edge functions authenticate the caller from the JWT (not from the body), call Stripe / LP Express / Omnisend / Google, and write with the service role.
5. Stripe calls back into `stripe-webhook`, which updates `subscribers`, gift cards, merch orders, penalties and pushes Omnisend events.
6. `pg_cron` jobs call `lpexpress-sync` and (per migration comment) `process-plan-changes`.

There are no Server Components; everything is client-rendered React 19.

## Boundaries

| Concern | Owned by | Notes |
|---------|----------|-------|
| Routing | `src/App.tsx` | 22 routes, flat, see [[routing]] |
| UI | `src/pages/`, `src/components/` | see [[component-conventions]], [[storefront-pages]], [[storefront-shared]] |
| Data (reads, member writes) | Supabase client + RLS + triggers | see [[data-flow]], [[database-module]] |
| Money / subscription state | edge functions + Stripe | see [[billing-edge]] |
| Shipping, gifts, merch, misc | edge functions | see [[fulfilment-edge]] |
| Admin | `admin/` (separate Vite app in the same repo) | see [[admin-module]] |
| Secrets | edge function env (`Deno.env`) only | see [[environment-variables]] |

## Related

[[tech-stack]] · [[folder-structure]] · [[data-flow]] · [[integrations]] · [[deepening-candidates]]
