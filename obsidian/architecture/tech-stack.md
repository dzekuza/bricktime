---
tags: [architecture]
updated: 2026-11-18
---

# Tech Stack

Versions from `package.json` at `9b4413c`. Update with a [[changelog]] entry when dependencies change.

## Core
| Package | Version | Why |
|---------|---------|-----|
| react / react-dom | ^19.2.4 | UI |
| vite, @vitejs/plugin-react | ^7.3.1, ^5.2.0 | build and dev server |
| typescript | ~5.9.3 | types |
| react-router-dom | ^7.14.2 | client routing (imported from `react-router-dom`, unlike the Hydrogen rule in the global `CLAUDE.md`) |

## UI
| Package | Version | Why |
|---------|---------|-----|
| tailwindcss, @tailwindcss/vite | ^4.2.1 | styling, no config file |
| radix-ui, shadcn, class-variance-authority, clsx, tailwind-merge, tw-animate-css | see file | shadcn `radix-nova` primitives |
| gsap, @gsap/react | ^3.15.0, ^2.1.2 | animation |
| lucide-react | ^1.14.0 | icons |
| react-helmet-async | ^3.0.0 | SEO tags |
| dompurify | ^3.4.15 | sanitising CMS HTML (`ExpandableHtml`) |
| jspdf | ^4.2.1 | gift card PDF |
| react-grab | ^0.1.32 | TODO: unknown purpose |

## Data & backend
| Package | Version | Why |
|---------|---------|-----|
| @supabase/supabase-js | ^2.105.1 | auth, data, function invoke |
| Supabase (Postgres, Auth, Edge Functions, pg_cron, vault) | hosted | backend; functions run on Deno and import `stripe@14.21.0` (API `2024-06-20`) from esm.sh |

## Tooling
| Package | Version | Why |
|---------|---------|-----|
| eslint, typescript-eslint, plugins | ^9.39.4 | lint |
| prettier, prettier-plugin-tailwindcss | ^3.8.1 | format |
| Deno tests | built in | `_shared/plan-change_test.ts`, `plan-schedule_test.ts` |

## Deliberately NOT used
| Package | Why not | Use instead |
|---------|---------|-------------|
| TanStack Query, React Hook Form, Zod | not installed (global defaults, but absent here) | `useState`/hooks and direct `supabase` calls |
| Next.js / server components | project is a Vite SPA | edge functions for server work |
| `@stripe/stripe-js` | not installed; Checkout is a redirect | Stripe Checkout URLs from edge functions |

## Related
[[system-overview]] · [[changelog]]
