---
tags: [architecture]
updated: 2026-11-18
---

# System Overview

The big picture of `bricks` — what it is, how a request flows, and the mental
model to hold while working on it. Module catalog: [[codebase-map]].

## What it is

BRICKTIME: a Lithuanian LEGO-rental subscription storefront. Members pick a tier (Nano → Mega) that gives a monthly € budget, claim catalog sets within that budget, hold several at once (Σ value ≤ budget) and return them to free budget. Copy is Lithuanian. Also sells merch and gift cards and has a community feed with achievements. Vite SPA on Vercel (`vercel.json` rewrites everything to `/index.html`, `/admin/*` to the separate admin app), Supabase for auth, data, edge functions and cron, Stripe for payments, LP Express (Unisend) for parcel lockers and couriers, Omnisend for email.

## Mental model

The browser is a thin React SPA that reads and writes Supabase directly under RLS. Anything that touches money or a carrier goes through a Deno edge function (service role, Stripe, LP Express). Paid state reaches the database **only** through `stripe-webhook`; pages therefore wait for the webhook (`src/lib/wait-for-subscriber.ts`) instead of assuming a purchase succeeded. Budget rules (held value vs plan credits) live in SQL (`used_credits`, `held_brick_value`, order triggers) and in `supabase/functions/_shared/`.

## Request lifecycle

Browser → React Router route (`src/App.tsx`) → page in `src/pages/` → either `supabase.from(...)`/`.rpc(...)` (RLS-protected) or `supabase.functions.invoke(...)` → edge function → Stripe/LP Express → Stripe webhook → database → page re-reads the subscriber row. There are no server components; everything renders client-side.

## Boundaries

| Concern | Owned by | Notes |
|---------|----------|-------|
| Routing | `src/App.tsx` | 22 routes (incl. 404), Lithuanian slugs for help pages |
| UI | `src/components/`, `src/pages/` | see [[component-conventions]]; pages are very large |
| Data | Supabase tables/RPCs, `src/hooks/` | see [[data-flow]] |
| Money | `supabase/functions/` + `stripe-webhook` | see [[integrations]] |
| Shipping | LP Express module | see [[integrations]] |
| Secrets | edge function env (`Deno.env`) | see [[environment-variables]] |
| Admin | `admin/` separate app | not documented here |

## Related

[[tech-stack]] · [[folder-structure]] · [[data-flow]] · [[codebase-map]] · [[deepening-candidates]]
