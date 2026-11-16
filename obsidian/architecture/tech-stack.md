---
tags: [architecture]
updated: 2026-11-16
---

# Tech Stack

Every dependency and **why it is here**. Versions are the ranges in `package.json` (storefront) at `7e98519`. Update this note whenever a dependency changes, and add a [[changelog]] entry.

## Core

| Package | Version | Why |
|---------|---------|-----|
| react / react-dom | ^19.2.4 | SPA UI |
| vite + @vitejs/plugin-react | ^7.3.1 / ^5.2.0 | dev server and build (not Next.js; the global default stack does not apply here) |
| typescript | ~5.9.3 | `tsc -b` with project references |
| react-router-dom | ^7.14.2 | client routing in `src/App.tsx` |

## UI

| Package | Version | Why |
|---------|---------|-----|
| tailwindcss + @tailwindcss/vite | ^4.2.1 | styling, no config file (tokens in `src/index.css`) |
| radix-ui, shadcn, class-variance-authority, clsx, tailwind-merge, tw-animate-css | ^1.4.3 / ^4.6.0 / ... | primitives in `src/components/ui/` (13 files) |
| lucide-react | ^1.14.0 | icons |
| gsap + @gsap/react | ^3.15.0 / ^2.1.2 | reveal and brand animations (`useReveal`, Hero, LegoWalker) |
| react-helmet-async | ^3.0.0 | per-page SEO in `components/Seo.tsx` |
| dompurify | ^3.4.15 | sanitising admin-authored HTML (legal pages, `ExpandableHtml`) |
| jspdf | ^4.2.1 | gift card PDF in `lib/gift-card-pdf.ts` |
| @fontsource-variable/geist | ^5.2.8 | font |

## Data & backend

| Package | Version | Why |
|---------|---------|-----|
| @supabase/supabase-js | ^2.105.1 | auth, DB, storage, `functions.invoke` |
| Stripe (edge functions) | `stripe@14.21.0` via esm.sh, API `2024-06-20` | subscriptions, one-off checkout, invoices, billing portal |
| @supabase/supabase-js (edge) | `@2` via esm.sh (unpinned) | service-role client in functions |
| Deno runtime | Supabase Edge | functions; `deno.lock` in root |

TanStack Query and React Hook Form + Zod, the global defaults, are **not** used here (no dependency); data is fetched in `useEffect` hooks and pages (see [[data-flow]]).

## Tooling

| Package | Version | Why |
|---------|---------|-----|
| eslint (+ typescript-eslint, react-hooks, react-refresh) | ^9.39.4 | lint |
| prettier (+ tailwind plugin) | ^3.8.1 | format |
| react-grab | ^0.1.32 | dev-only element picker, dynamically imported in `src/main.tsx` when `import.meta.env.DEV` |
| pnpm | lockfile `pnpm-lock.yaml` (and a stale `package-lock.json`) | package manager |

Admin app (`admin/package.json`): same React/Vite/Tailwind/Supabase versions, plus `recharts ^3.8.0` for charts.

## Deliberately NOT used

| Package | Why not | Use instead |
|---------|---------|-------------|
| Next.js | project is a Vite SPA | `src/pages/` + react-router |
| TanStack Query | not adopted | `useEffect` + local state, [[data-flow]] |
| Server-side Supabase (`@supabase/ssr`) | no server rendering | browser client + edge functions |

## Related

[[system-overview]] · [[changelog]]
