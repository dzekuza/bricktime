# Coupon Codes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add coupon code management to the admin dashboard and a coupon redemption field on the Subscribe page.

**Architecture:** A new `coupons` Supabase table stores codes with discount type, value, duration, usage cap, and expiry. The admin gets a new Coupons page (table + create/edit dialog) wired into the existing sidebar and routing. The vite-app Subscribe page gets an inline coupon input that validates against Supabase and shows a live price preview.

**Tech Stack:** React 19, TypeScript, Tailwind v4, shadcn/ui, Supabase (anon + service-role clients), TanStack Table (admin only)

---

## File Map

| File | Action | Purpose |
|---|---|---|
| Supabase dashboard | SQL run | Create `coupons` table + `redeem_coupon` RPC |
| `admin/src/lib/database.types.ts` | Modify | Add `coupons` table Row/Insert/Update types |
| `vite-app/src/lib/database.types.ts` | Modify | Same — keep both in sync |
| `admin/src/pages/Coupons.tsx` | Create | Coupons table + create/edit dialog |
| `admin/src/App.tsx` | Modify | Add `/coupons` route |
| `admin/src/components/AppSidebar.tsx` | Modify | Add "Coupons" nav item |
| `vite-app/src/pages/Subscribe.tsx` | Modify | Add coupon input + validation + price preview |

---

## Task 1: Create Supabase table and RPC

**Files:**
- Supabase SQL editor (dashboard.supabase.com)
- Modify: `admin/src/lib/database.types.ts`
- Modify: `vite-app/src/lib/database.types.ts`

- [ ] **Step 1: Run this SQL in the Supabase dashboard SQL editor**

```sql
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric not null check (discount_value > 0),
  duration_months int null,
  max_uses int null,
  uses_count int not null default 0,
  expires_at timestamptz null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.coupons enable row level security;
create policy "anon can read coupons" on public.coupons
  for select using (true);

create or replace function public.redeem_coupon(p_code text)
returns void language plpgsql security definer as $$
begin
  update public.coupons
  set uses_count = uses_count + 1
  where code = upper(p_code)
    and active = true
    and (expires_at is null or expires_at > now())
    and (max_uses is null or uses_count < max_uses);
  if not found then
    raise exception 'coupon_invalid';
  end if;
end;
$$;
```

- [ ] **Step 2: Add `coupons` types to `admin/src/lib/database.types.ts`**

Find the `Tables` object and add a `coupons` entry (alphabetically, e.g. before `achievements`):

```ts
coupons: {
  Row: {
    id: string
    code: string
    discount_type: 'percentage' | 'fixed'
    discount_value: number
    duration_months: number | null
    max_uses: number | null
    uses_count: number
    expires_at: string | null
    active: boolean
    created_at: string
  }
  Insert: {
    id?: string
    code: string
    discount_type: 'percentage' | 'fixed'
    discount_value: number
    duration_months?: number | null
    max_uses?: number | null
    uses_count?: number
    expires_at?: string | null
    active?: boolean
    created_at?: string
  }
  Update: {
    id?: string
    code?: string
    discount_type?: 'percentage' | 'fixed'
    discount_value?: number
    duration_months?: number | null
    max_uses?: number | null
    uses_count?: number
    expires_at?: string | null
    active?: boolean
    created_at?: string
  }
  Relationships: []
}
```

- [ ] **Step 3: Copy the same `coupons` block to `vite-app/src/lib/database.types.ts`**

Same insertion — keep both files in sync.

- [ ] **Step 4: Typecheck both apps**

```bash
cd admin && pnpm typecheck
cd ../vite-app && pnpm typecheck
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add admin/src/lib/database.types.ts vite-app/src/lib/database.types.ts
git commit -m "feat: add coupons table types to database.types.ts"
```

---

## Task 2: Admin — Coupons page

**Files:**
- Create: `admin/src/pages/Coupons.tsx`

- [ ] **Step 1: Check shadcn components are installed**

```bash
cd admin
ls src/components/ui/alert-dialog.tsx 2>/dev/null && echo "alert-dialog ok" || pnpm dlx shadcn@latest add alert-dialog
ls src/components/ui/switch.tsx 2>/dev/null && echo "switch ok" || pnpm dlx shadcn@latest add switch
```

- [ ] **Step 2: Create `admin/src/pages/Coupons.tsx`**

```tsx
import { useState, useEffect, useMemo } from 'react'
import { PlusIcon, PencilIcon, Trash2Icon, TicketIcon } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { DataTable, SortableHeader } from '@/components/DataTable'
import type { Tables } from '@/lib/database.types'

type Coupon = Tables<'coupons'>

type CouponForm = {
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: string
  duration_months: string
  max_uses: string
  expires_at: string
  active: boolean
}

const emptyForm = (): CouponForm => ({
  code: '',
  discount_type: 'percentage',
  discount_value: '',
  duration_months: '',
  max_uses: '',
  expires_at: '',
  active: true,
})

function couponToForm(c: Coupon): CouponForm {
  return {
    code: c.code,
    discount_type: c.discount_type,
    discount_value: String(c.discount_value),
    duration_months: c.duration_months != null ? String(c.duration_months) : '',
    max_uses: c.max_uses != null ? String(c.max_uses) : '',
    expires_at: c.expires_at ? c.expires_at.slice(0, 10) : '',
    active: c.active,
  }
}

export function Coupons() {
  const [items, setItems] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Coupon | null>(null)
  const [form, setForm] = useState<CouponForm>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })
    setItems(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditTarget(null)
    setForm(emptyForm())
    setDialogOpen(true)
  }

  function openEdit(coupon: Coupon) {
    setEditTarget(coupon)
    setForm(couponToForm(coupon))
    setDialogOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    const payload = {
      code: form.code.trim().toUpperCase(),
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      duration_months: form.duration_months ? parseInt(form.duration_months) : null,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      active: form.active,
    }
    if (editTarget) {
      await supabaseAdmin.from('coupons').update(payload).eq('id', editTarget.id)
    } else {
      await supabaseAdmin.from('coupons').insert(payload)
    }
    setSaving(false)
    setDialogOpen(false)
    load()
  }

  async function handleToggleActive(coupon: Coupon) {
    await supabaseAdmin.from('coupons').update({ active: !coupon.active }).eq('id', coupon.id)
    load()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await supabaseAdmin.from('coupons').delete().eq('id', deleteTarget.id)
    setDeleteTarget(null)
    load()
  }

  const columns = useMemo<ColumnDef<Coupon>[]>(() => [
    {
      accessorKey: 'code',
      header: ({ column }) => <SortableHeader column={column} label="Code" />,
      cell: ({ row }) => (
        <span className="font-mono rounded bg-foreground px-1.5 py-0.5 text-xs text-background tracking-wide">
          {row.original.code}
        </span>
      ),
    },
    {
      accessorKey: 'discount_type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.discount_type === 'percentage' ? '%' : '€'}
        </Badge>
      ),
    },
    {
      accessorKey: 'discount_value',
      header: 'Discount',
      cell: ({ row }) =>
        row.original.discount_type === 'percentage'
          ? `${row.original.discount_value}%`
          : `€${Number(row.original.discount_value).toFixed(2)}`,
    },
    {
      accessorKey: 'duration_months',
      header: 'Duration',
      cell: ({ row }) =>
        row.original.duration_months != null ? `${row.original.duration_months} mo` : 'Forever',
    },
    {
      id: 'uses',
      header: 'Uses',
      cell: ({ row }) => {
        const c = row.original
        return `${c.uses_count} / ${c.max_uses ?? '∞'}`
      },
    },
    {
      accessorKey: 'expires_at',
      header: 'Expires',
      cell: ({ row }) =>
        row.original.expires_at
          ? new Date(row.original.expires_at).toLocaleDateString()
          : '—',
    },
    {
      accessorKey: 'active',
      header: 'Active',
      cell: ({ row }) => (
        <Switch
          checked={row.original.active}
          onCheckedChange={() => handleToggleActive(row.original)}
        />
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => openEdit(row.original)}>
            <PencilIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleteTarget(row.original)}
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      ),
    },
  ], [])

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TicketIcon className="size-5" />
          <h1 className="text-xl font-semibold">Coupons</h1>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon className="size-4" />
          New Coupon
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Codes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <DataTable columns={columns} data={items} />
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Coupon' : 'New Coupon'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Code</Label>
              <Input
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="WELCOME20"
                className="font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Type</Label>
                <Select
                  value={form.discount_type}
                  onValueChange={v => setForm(f => ({ ...f, discount_type: v as 'percentage' | 'fixed' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Value</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.discount_value}
                  onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))}
                  placeholder={form.discount_type === 'percentage' ? '20' : '5.00'}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Duration months <span className="text-muted-foreground text-xs">(blank = forever)</span></Label>
              <Input
                type="number"
                min="1"
                value={form.duration_months}
                onChange={e => setForm(f => ({ ...f, duration_months: e.target.value }))}
                placeholder="1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Max uses <span className="text-muted-foreground text-xs">(blank = ∞)</span></Label>
                <Input
                  type="number"
                  min="1"
                  value={form.max_uses}
                  onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                  placeholder="100"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Expires</Label>
                <Input
                  type="date"
                  value={form.expires_at}
                  onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="active-toggle"
                checked={form.active}
                onCheckedChange={v => setForm(f => ({ ...f, active: v }))}
              />
              <Label htmlFor="active-toggle">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.code.trim() || !form.discount_value}
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete coupon?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.code}</strong>. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
```

- [ ] **Step 3: Typecheck**

```bash
cd admin && pnpm typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add admin/src/pages/Coupons.tsx
git commit -m "feat: add admin Coupons page with table, create/edit dialog, toggle, delete"
```

---

## Task 3: Wire admin routing and sidebar

**Files:**
- Modify: `admin/src/App.tsx`
- Modify: `admin/src/components/AppSidebar.tsx`

- [ ] **Step 1: Add route in `admin/src/App.tsx`**

Add the import at the top with the other page imports:
```ts
import { Coupons } from '@/pages/Coupons'
```

Add the route inside the auth-guarded `<Route>` block, after the Orders route:
```tsx
<Route path="/coupons" element={<Coupons />} />
```

- [ ] **Step 2: Add nav item in `admin/src/components/AppSidebar.tsx`**

Add `TicketIcon` to the existing lucide-react import line:
```ts
import {
  LayoutDashboardIcon,
  PackageIcon,
  UsersIcon,
  CreditCardIcon,
  ShoppingCartIcon,
  SettingsIcon,
  BrickWallIcon,
  LogOutIcon,
  TicketIcon,
} from 'lucide-react'
```

Add to the `navMain` array after the Orders entry:
```ts
{ label: 'Coupons', to: '/coupons', icon: TicketIcon },
```

- [ ] **Step 3: Typecheck**

```bash
cd admin && pnpm typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add admin/src/App.tsx admin/src/components/AppSidebar.tsx
git commit -m "feat: wire Coupons page into admin routing and sidebar nav"
```

---

## Task 4: Subscribe page — coupon input and price preview

**Files:**
- Modify: `vite-app/src/pages/Subscribe.tsx`

The file is ~1008 lines. The plan touches two areas: state/function declarations near the top of the component, and the JSX where plan price and CTA button render.

- [ ] **Step 1: Add supabase import if not already present**

At the top of `Subscribe.tsx`, ensure this import exists:
```ts
import { supabase } from '@/lib/supabase'
```

- [ ] **Step 2: Add coupon state inside the component**

Find the block of `useState` declarations near the top of `Subscribe()`. Add:
```ts
const [couponInput, setCouponInput] = useState('')
const [appliedCoupon, setAppliedCoupon] = useState<{
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  duration_months: number | null
} | null>(null)
const [couponError, setCouponError] = useState<string | null>(null)
const [couponLoading, setCouponLoading] = useState(false)
```

- [ ] **Step 3: Add `applyCoupon` and `getDiscountedPrice` inside the component**

After the state declarations, add:
```ts
async function applyCoupon() {
  const code = couponInput.trim().toUpperCase()
  if (!code) return
  setCouponLoading(true)
  setCouponError(null)

  const { data, error } = await supabase
    .from('coupons')
    .select('code, discount_type, discount_value, duration_months, max_uses, uses_count, expires_at, active')
    .eq('code', code)
    .single()

  setCouponLoading(false)

  if (error || !data) { setCouponError('Code not found'); return }
  if (!data.active) { setCouponError('This code is inactive'); return }
  if (data.expires_at && new Date(data.expires_at) < new Date()) { setCouponError('This code has expired'); return }
  if (data.max_uses != null && data.uses_count >= data.max_uses) { setCouponError('This code has reached its usage limit'); return }

  setAppliedCoupon({
    code: data.code,
    discount_type: data.discount_type,
    duration_months: data.duration_months,
    discount_value: Number(data.discount_value),
  })
  setCouponInput('')
}

function getDiscountedPrice(basePrice: number): number {
  if (!appliedCoupon) return basePrice
  if (appliedCoupon.discount_type === 'percentage') {
    return Math.max(0, basePrice * (1 - appliedCoupon.discount_value / 100))
  }
  return Math.max(0, basePrice - appliedCoupon.discount_value)
}
```

- [ ] **Step 4: Add the coupon input block in JSX**

In the JSX, find the element that displays a plan's price (look for `monthlyPrice` or similar). Directly below the price element and above the CTA/subscribe button, add:

```tsx
{/* Coupon input */}
<div className="mt-4 flex flex-col gap-2">
  {appliedCoupon ? (
    <div className="flex items-center gap-2 rounded-xl border-2 border-ink bg-brand-mint/20 px-4 py-3 text-sm font-semibold text-ink">
      <span className="flex-1">
        ✓ {appliedCoupon.code} —{' '}
        {appliedCoupon.discount_type === 'percentage'
          ? `${appliedCoupon.discount_value}% off`
          : `€${appliedCoupon.discount_value} off`}
        {appliedCoupon.duration_months != null
          ? ` for ${appliedCoupon.duration_months} month${appliedCoupon.duration_months > 1 ? 's' : ''}`
          : ' forever'}
      </span>
      <button
        className="label-mono text-ink/50 hover:text-ink"
        onClick={() => setAppliedCoupon(null)}
      >
        Remove
      </button>
    </div>
  ) : (
    <div className="flex gap-2">
      <input
        className="flex-1 rounded-xl border-2 border-ink bg-paper px-4 py-2.5 font-mono text-[13px] uppercase placeholder:normal-case placeholder:text-ink/30 focus:outline-none"
        placeholder="Coupon code"
        value={couponInput}
        onChange={e => { setCouponInput(e.target.value); setCouponError(null) }}
        onKeyDown={e => e.key === 'Enter' && applyCoupon()}
      />
      <Button
        variant="outline"
        className="rounded-xl border-2 border-ink font-semibold"
        onClick={applyCoupon}
        disabled={couponLoading || !couponInput.trim()}
      >
        {couponLoading ? '…' : 'Apply'}
      </Button>
    </div>
  )}
  {couponError && (
    <p className="label-mono text-[11px] text-red-500">{couponError}</p>
  )}
</div>
```

- [ ] **Step 5: Update price display to show discounted price**

Find where `monthlyPrice` is rendered in JSX (there may be a monthly/annual toggle — update both). Replace the plain price span with:

```tsx
{appliedCoupon ? (
  <span>
    <span className="line-through opacity-40">€{plan.monthlyPrice}</span>{' '}
    <span className="text-green-600 font-bold">
      €{getDiscountedPrice(plan.monthlyPrice).toFixed(2)}
    </span>
    {appliedCoupon.duration_months != null && (
      <span className="label-mono ml-1 text-[10px] text-ink/50">
        first {appliedCoupon.duration_months} mo
      </span>
    )}
  </span>
) : (
  <span>€{plan.monthlyPrice}</span>
)}
```

For `annualPrice` (if displayed), apply the same pattern using `getDiscountedPrice(plan.annualPrice)`.

- [ ] **Step 6: Typecheck**

```bash
cd vite-app && pnpm typecheck
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add vite-app/src/pages/Subscribe.tsx
git commit -m "feat: add coupon code input and live price preview to Subscribe page"
```

---

## Open Item

The Subscribe page confirm button currently mocks subscription creation. The `redeem_coupon(code)` RPC should be called at that point to increment `uses_count`. Wire it when real billing/subscription creation is implemented:

```ts
// Call this when subscription is confirmed:
await supabase.rpc('redeem_coupon', { p_code: appliedCoupon.code })
```
