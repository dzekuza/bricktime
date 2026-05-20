# Missing Part Requests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let subscribers report missing LEGO pieces on their active rentals; give admins a dedicated page to view and resolve those requests.

**Architecture:** A new Supabase table `missing_part_requests` holds submissions. The customer-facing Account page gets a "Pranešti apie trūkstamą detalę" button per active product that opens a Dialog form. A new admin page `/missing-parts` renders all requests in a DataTable with a "Mark resolved" action.

**Tech Stack:** React 19 + Vite 7 + TypeScript + Tailwind CSS v4 + shadcn/ui (Dialog, Input, Label, Badge) + Supabase (anon client on storefront, service-role client in admin)

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `supabase/migrations/20260518000004_missing_part_requests.sql` | Table DDL + RLS + index |
| Create | `vite-app/src/components/MissingPartDialog.tsx` | Customer form dialog |
| Modify | `vite-app/src/pages/Account.tsx` | Add button + import dialog |
| Create | `admin/src/pages/MissingParts.tsx` | Admin list page |
| Modify | `admin/src/App.tsx` | Add `/missing-parts` route |
| Modify | `admin/src/components/AppSidebar.tsx` | Add nav item |

---

## Task 1: Database migration

**Files:**
- Create: `supabase/migrations/20260518000004_missing_part_requests.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- Missing part requests submitted by subscribers on active rentals.
create table missing_part_requests (
  id            uuid         primary key default gen_random_uuid(),
  subscriber_id uuid         not null references subscribers(id) on delete cascade,
  order_id      uuid         not null references orders(id) on delete cascade,
  product_id    integer      not null references products(id) on delete restrict,
  lego_set_code text         not null,
  part_code     text         not null,
  bag_number    text         not null,
  quantity      integer      not null check (quantity > 0),
  status        text         not null default 'pending' check (status in ('pending', 'resolved')),
  created_at    timestamptz  not null default now(),
  updated_at    timestamptz  not null default now()
);

comment on table missing_part_requests is 'Subscriber reports of missing LEGO pieces in active rentals.';

create trigger missing_part_requests_updated_at
  before update on missing_part_requests
  for each row execute procedure touch_updated_at();

create index idx_mpr_subscriber on missing_part_requests(subscriber_id, created_at desc);
create index idx_mpr_status     on missing_part_requests(status, created_at desc);

alter table missing_part_requests enable row level security;

-- Subscribers can read and insert their own requests; no update/delete from client
create policy "mpr_select_own" on missing_part_requests
  for select using ((select auth.uid()) = subscriber_id);

create policy "mpr_insert_own" on missing_part_requests
  for insert with check ((select auth.uid()) = subscriber_id);
```

- [ ] **Step 2: Push to live database**

```bash
supabase db push
```

Expected: `Applying migration 20260518000004_missing_part_requests.sql... Finished supabase db push.`

- [ ] **Step 3: Verify in Supabase dashboard**

Open Supabase → Table Editor → confirm `missing_part_requests` table exists with all columns and RLS enabled.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260518000004_missing_part_requests.sql
git commit -m "feat: add missing_part_requests table with RLS"
```

---

## Task 2: Install missing shadcn components in vite-app

The form needs `Input` and `Label` which are not yet in `vite-app/src/components/ui/`.

**Files:**
- Create: `vite-app/src/components/ui/input.tsx` (via shadcn CLI)
- Create: `vite-app/src/components/ui/label.tsx` (via shadcn CLI)

- [ ] **Step 1: Add components**

```bash
cd vite-app
pnpm dlx shadcn@latest add input label
```

Expected: `✔ Created 2 files: src/components/ui/input.tsx  src/components/ui/label.tsx`

- [ ] **Step 2: Verify typecheck passes**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add vite-app/src/components/ui/input.tsx vite-app/src/components/ui/label.tsx
git commit -m "chore: add input and label shadcn components to vite-app"
```

---

## Task 3: MissingPartDialog component (vite-app)

**Files:**
- Create: `vite-app/src/components/MissingPartDialog.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
  productId: number
  productTitle: string
  subscriberId: string
}

interface FormState {
  legoSetCode: string
  partCode: string
  bagNumber: string
  quantity: string
}

const empty: FormState = { legoSetCode: "", partCode: "", bagNumber: "", quantity: "" }

export function MissingPartDialog({
  open,
  onOpenChange,
  orderId,
  productId,
  productTitle,
  subscriberId,
}: Props) {
  const [form, setForm] = useState<FormState>(empty)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function field(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const isValid =
    form.legoSetCode.trim() &&
    form.partCode.trim() &&
    form.bagNumber.trim() &&
    Number(form.quantity) > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return
    setSubmitting(true)
    setError(null)
    const { error: err } = await supabase.from("missing_part_requests").insert({
      subscriber_id: subscriberId,
      order_id: orderId,
      product_id: productId,
      lego_set_code: form.legoSetCode.trim(),
      part_code: form.partCode.trim(),
      bag_number: form.bagNumber.trim(),
      quantity: Number(form.quantity),
    })
    setSubmitting(false)
    if (err) {
      setError("Nepavyko išsiųsti. Bandyk dar kartą.")
      return
    }
    setSubmitted(true)
  }

  function handleClose(open: boolean) {
    if (!open) {
      setForm(empty)
      setSubmitted(false)
      setError(null)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="brick-card w-[calc(100vw-2rem)] max-w-[420px] gap-0 border-0 bg-paper p-5 shadow-none sm:p-6">
        <DialogTitle className="heading-display text-d-xs text-ink">
          Trūkstama detalė
        </DialogTitle>
        <DialogDescription className="mt-1.5 text-[13px] leading-[1.6] text-ink/50">
          {productTitle}
        </DialogDescription>

        {submitted ? (
          <div className="mt-5 rounded-2xl border-2 border-brand-mint bg-brand-mint/10 p-5 text-center">
            <p className="font-display text-[22px] text-ink">✓ Išsiųsta!</p>
            <p className="mt-1 text-[13px] text-ink/60">
              Mes susisieksime su tavimi dėl trūkstamos detalės.
            </p>
            <Button
              className="mt-4 rounded-full border-2 border-ink bg-ink text-[13px] font-bold text-paper"
              onClick={() => handleClose(false)}
            >
              Uždaryti
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="label-mono text-ink/50">LEGO set kodas</Label>
                <Input
                  placeholder="pvz. 75192"
                  value={form.legoSetCode}
                  onChange={field("legoSetCode")}
                  className="rounded-xl border-2 border-ink bg-transparent text-[14px] text-ink"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="label-mono text-ink/50">Detalės kodas</Label>
                <Input
                  placeholder="pvz. 3001"
                  value={form.partCode}
                  onChange={field("partCode")}
                  className="rounded-xl border-2 border-ink bg-transparent text-[14px] text-ink"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="label-mono text-ink/50">Maišiuko nr.</Label>
                <Input
                  placeholder="pvz. 3"
                  value={form.bagNumber}
                  onChange={field("bagNumber")}
                  className="rounded-xl border-2 border-ink bg-transparent text-[14px] text-ink"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="label-mono text-ink/50">Kiekis</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="1"
                  value={form.quantity}
                  onChange={field("quantity")}
                  className="rounded-xl border-2 border-ink bg-transparent text-[14px] text-ink"
                />
              </div>
            </div>

            {error && (
              <p className="text-[12px] text-rose-600">{error}</p>
            )}

            <div className="mt-1 flex flex-col gap-2">
              <Button
                type="submit"
                size="lg"
                disabled={!isValid || submitting}
                className="brick-hover-sm w-full rounded-full border-2 border-ink bg-ink text-[15px] font-bold text-paper disabled:opacity-40"
              >
                {submitting ? "Siunčiama…" : "Siųsti pranešimą"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full rounded-full border-2 border-ink bg-transparent text-[15px] font-bold text-ink hover:bg-ink/5"
                onClick={() => handleClose(false)}
                disabled={submitting}
              >
                Atšaukti
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
cd vite-app && pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add vite-app/src/components/MissingPartDialog.tsx
git commit -m "feat: add MissingPartDialog form component"
```

---

## Task 4: Wire button into Account page

**Files:**
- Modify: `vite-app/src/pages/Account.tsx`

- [ ] **Step 1: Add import at top of Account.tsx**

After the existing imports, add:
```tsx
import { MissingPartDialog } from "@/components/MissingPartDialog"
```

- [ ] **Step 2: Add dialog state**

Inside the `Checkout` component, after the existing `useState` declarations, add:
```tsx
const [missingPartOrder, setMissingPartOrder] = useState<RentedOrder | null>(null)
```

This state holds the order for which the dialog is open (`null` = closed).

- [ ] **Step 3: Add button inside the active product card**

Find the block at the end of the product card actions (around line 825-840). Inside the `(order.status === "active" || order.status === "overdue" || order.status === "return_declined")` condition block, add a second button below "Prašyti grąžinimo":

```tsx
{(order.status === "active" || order.status === "overdue") && (
  <button
    onClick={() => setMissingPartOrder(order)}
    className="mt-2 w-full rounded-full border-2 border-ink/30 bg-transparent px-4 py-2.5 text-[13px] font-bold text-ink/60 transition-all hover:border-ink hover:text-ink"
  >
    Pranešti apie trūkstamą detalę
  </button>
)}
```

Place this immediately after the closing `</button>` tag of the return request button, still inside the `mt-auto pt-4` div.

- [ ] **Step 4: Render the dialog**

Before the final closing `</div>` of the component return (after `</section>`), add:

```tsx
{missingPartOrder && user && (
  <MissingPartDialog
    open={missingPartOrder !== null}
    onOpenChange={(open) => { if (!open) setMissingPartOrder(null) }}
    orderId={missingPartOrder.id}
    productId={missingPartOrder.productId}
    productTitle={missingPartOrder.productTitle}
    subscriberId={user.id}
  />
)}
```

- [ ] **Step 5: Typecheck**

```bash
cd vite-app && pnpm typecheck
```

Expected: no errors.

- [ ] **Step 6: Manual smoke test**

1. Start dev server: `pnpm dev`
2. Log in as a subscriber with an active order
3. Go to `/account`
4. Confirm the "Pranešti apie trūkstamą detalę" button appears on active product cards
5. Click it — dialog should open with the product title in the description
6. Fill in all 4 fields and submit
7. Confirm success state shows "✓ Išsiųsta!"
8. Check Supabase Table Editor — row should exist in `missing_part_requests`

- [ ] **Step 7: Commit**

```bash
git add vite-app/src/pages/Account.tsx
git commit -m "feat: add missing part report button to active product cards"
```

---

## Task 5: Admin — MissingParts page

**Files:**
- Create: `admin/src/pages/MissingParts.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { useState, useMemo, useEffect } from 'react'
import { SearchIcon, CheckIcon } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabaseAdmin } from '@/lib/supabase'
import { DataTable, SortableHeader } from '@/components/DataTable'

interface MissingPartRequest {
  id: string
  subscriber_id: string
  order_id: string
  product_id: number
  lego_set_code: string
  part_code: string
  bag_number: string
  quantity: number
  status: 'pending' | 'resolved'
  created_at: string
  subscriberName: string
  subscriberEmail: string
  productTitle: string
}

export function MissingParts() {
  const [items, setItems] = useState<MissingPartRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [resolving, setResolving] = useState<Set<string>>(new Set())

  useEffect(() => {
    Promise.all([
      supabaseAdmin
        .from('missing_part_requests')
        .select('*')
        .order('created_at', { ascending: false }),
      supabaseAdmin.from('subscribers').select('id, name, email'),
      supabaseAdmin.from('products').select('id, title'),
    ]).then(([{ data: requests }, { data: subs }, { data: products }]) => {
      const subMap = Object.fromEntries((subs ?? []).map((s) => [s.id, s]))
      const prodMap = Object.fromEntries((products ?? []).map((p) => [p.id, p]))
      setItems(
        (requests ?? []).map((r) => ({
          ...r,
          subscriberName: subMap[r.subscriber_id]?.name ?? r.subscriber_id,
          subscriberEmail: subMap[r.subscriber_id]?.email ?? '',
          productTitle: prodMap[r.product_id]?.title ?? `#${r.product_id}`,
        }))
      )
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    if (!q) return items
    return items.filter(
      (r) =>
        r.subscriberName.toLowerCase().includes(q) ||
        r.subscriberEmail.toLowerCase().includes(q) ||
        r.productTitle.toLowerCase().includes(q) ||
        r.lego_set_code.toLowerCase().includes(q) ||
        r.part_code.toLowerCase().includes(q)
    )
  }, [items, query])

  async function markResolved(id: string) {
    setResolving((prev) => new Set(prev).add(id))
    await supabaseAdmin
      .from('missing_part_requests')
      .update({ status: 'resolved' })
      .eq('id', id)
    setItems((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'resolved' } : r))
    )
    setResolving((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const columns: ColumnDef<MissingPartRequest>[] = [
    {
      id: 'subscriber',
      accessorKey: 'subscriberName',
      header: ({ column }) => <SortableHeader column={column} label="Subscriber" />,
      cell: ({ row }) => (
        <div>
          <span className="text-sm font-medium">{row.original.subscriberName}</span>
          <br />
          <span className="text-xs text-muted-foreground">{row.original.subscriberEmail}</span>
        </div>
      ),
    },
    {
      id: 'product',
      accessorKey: 'productTitle',
      header: ({ column }) => <SortableHeader column={column} label="Product" />,
      cell: ({ row }) => (
        <span className="text-sm">{row.original.productTitle}</span>
      ),
    },
    {
      accessorKey: 'lego_set_code',
      header: ({ column }) => <SortableHeader column={column} label="Set code" />,
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.lego_set_code}</span>,
    },
    {
      accessorKey: 'part_code',
      header: ({ column }) => <SortableHeader column={column} label="Part code" />,
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.part_code}</span>,
    },
    {
      accessorKey: 'bag_number',
      header: 'Bag',
      cell: ({ row }) => <span className="text-sm">{row.original.bag_number}</span>,
    },
    {
      accessorKey: 'quantity',
      header: 'Qty',
      cell: ({ row }) => <span className="text-sm font-medium">{row.original.quantity}</span>,
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => <SortableHeader column={column} label="Submitted" />,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.original.created_at).toLocaleDateString('lt-LT')}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'resolved' ? 'default' : 'secondary'}>
          {row.original.status === 'resolved' ? 'Resolved' : 'Pending'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) =>
        row.original.status === 'pending' ? (
          <Button
            size="sm"
            variant="outline"
            disabled={resolving.has(row.original.id)}
            onClick={() => markResolved(row.original.id)}
          >
            <CheckIcon className="mr-1 size-3" />
            {resolving.has(row.original.id) ? 'Saving…' : 'Mark resolved'}
          </Button>
        ) : null,
    },
  ]

  const pending = items.filter((r) => r.status === 'pending').length

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Missing Parts</h1>
          {pending > 0 && (
            <p className="text-sm text-muted-foreground">{pending} pending request{pending !== 1 ? 's' : ''}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <span className="text-2xl font-bold">{items.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <span className="text-2xl font-bold text-amber-600">{pending}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Resolved
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <span className="text-2xl font-bold text-green-600">{items.length - pending}</span>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by subscriber, product, set or part code…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <DataTable columns={columns} data={filtered} />
          <p className="text-xs text-muted-foreground">
            Showing {filtered.length} of {items.length} requests
          </p>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
cd admin && pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add admin/src/pages/MissingParts.tsx
git commit -m "feat: add MissingParts admin page"
```

---

## Task 6: Wire admin route + sidebar

**Files:**
- Modify: `admin/src/App.tsx`
- Modify: `admin/src/components/AppSidebar.tsx`

- [ ] **Step 1: Add route in App.tsx**

Add the import at the top with the other page imports:
```tsx
import { MissingParts } from './pages/MissingParts'
```

Add the route inside the authenticated `<Route>` block, after the Coupons route:
```tsx
<Route path="/missing-parts" element={<MissingParts />} />
```

- [ ] **Step 2: Add sidebar nav item in AppSidebar.tsx**

Add `WrenchIcon` to the lucide-react import (check existing icons — add to the same import line).

Add to `navMain` array after the Coupons entry:
```ts
{ label: 'Missing Parts', to: '/missing-parts', icon: WrenchIcon },
```

- [ ] **Step 3: Typecheck**

```bash
cd admin && pnpm typecheck
```

Expected: no errors.

- [ ] **Step 4: Manual smoke test**

1. Start admin dev server: `pnpm dev`
2. Log in as admin
3. Confirm "Missing Parts" appears in the sidebar
4. Navigate to `/missing-parts`
5. Confirm the page loads with the 3 stat cards and an empty table (or rows if requests exist from Task 4 testing)
6. If a pending row exists, click "Mark resolved" — confirm badge changes to "Resolved" and button disappears

- [ ] **Step 5: Commit**

```bash
git add admin/src/App.tsx admin/src/components/AppSidebar.tsx
git commit -m "feat: wire missing-parts route and sidebar nav in admin"
```

---

## Self-Review

**Spec coverage:**
- ✅ Customer can report missing part from active product card
- ✅ Form fields: LEGO set code, part code, bag number, quantity
- ✅ Admin sees all requests with subscriber name/email
- ✅ Admin can mark request resolved (pending → resolved)
- ✅ RLS: subscribers can only see/insert their own requests
- ✅ Admin uses service-role client (bypasses RLS)

**Placeholder scan:** None found.

**Type consistency:** `MissingPartRequest` interface in Task 5 matches all column names from migration in Task 1. `Props` interface in Task 3 matches usage in Task 4.
