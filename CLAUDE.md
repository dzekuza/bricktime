# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Structure

This repo contains two independent Vite apps under `/Users/rysardgvozdovic/Desktop/projects/bricks/`:

- **`vite-app/`** — Customer-facing landing page and rental flow
- **`admin/`** — Admin dashboard (products, subscribers, orders, plans, settings)

Both apps share the same stack but are completely separate projects with their own `package.json`, `node_modules`, and `vite.config.ts`. Run commands from within each app's directory.

## Commands

```bash
# Development
pnpm dev          # start dev server (run from vite-app/ or admin/)
pnpm build        # tsc -b && vite build
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint .
pnpm format       # prettier --write "**/*.{ts,tsx}"
pnpm preview      # serve production build
```

## Stack

Both apps: **React 19 + Vite 7 + TypeScript + Tailwind CSS v4 + shadcn/ui**

- shadcn style: `radix-nova`, CSS variables, Lucide icons — configured via `components.json`
- Path alias: `@/` → `src/`
- **admin only**: TanStack Table v8 (via shared `DataTable` component), Recharts

## vite-app Architecture

**Landing page + customer flow.** No backend — all data is static/mocked.

Routes in `App.tsx`:
- `/` → `Home` — assembles all landing sections (Nav, Hero, Marquee, HowItWorks, WhatsInside, Plans, Testimonials, FAQ, BigCTA, Footer)
- `/archive` → products listing
- `/plans` → subscription plans page
- `/account` → account with LEGO-head avatar picker (`public/avatars/`)
- `/subscribe`, `/checkout` → subscription/rental flow pages

**Animations**: GSAP is used throughout. `src/hooks/useReveal.ts` handles scroll-reveal. Section components use GSAP hover animations with highlighted heading spans.

**Fonts**:
- Body: Space Grotesk + JetBrains Mono (Google Fonts, loaded in `index.css`)
- Display: Bricolage Grotesque variable font (self-hosted at `public/BricolageGrotesque.ttf`)
- Brand logo SVG: `public/bricktime.svg`

## Admin Architecture

**Internal dashboard.** No backend — mock data lives in `src/data/` (orders.ts, products.ts, subscribers.ts).

All routes nest under `AppLayout` (sidebar + layout shell via `AppSidebar`).

Key components:
- `DataTable.tsx` — shared TanStack Table wrapper used by Products, Subscribers, Orders pages
- `ProductEditDialog.tsx` — tabbed sheet supporting both add and edit modes
- `OrderDetailSheet.tsx` — slide-over with live status sync
- `SubscriberProfileSheet.tsx` — subscriber detail with account info

## UI Conventions

- shadcn components live in `src/components/ui/` — add new ones via `pnpm dlx shadcn@latest add <component>`
- Tailwind v4 is configured via the `@tailwindcss/vite` plugin (no `tailwind.config.js` file)
- `src/lib/utils.ts` exports the `cn()` helper (clsx + tailwind-merge)
