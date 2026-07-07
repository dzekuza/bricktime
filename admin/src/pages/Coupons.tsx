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
import type { Tables } from '@/lib/supabase'
import { DataTable, SortableHeader } from '@/components/DataTable'

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
    discount_type: c.discount_type as 'percentage' | 'fixed',
    duration_months: c.duration_months != null ? String(c.duration_months) : '',
    discount_value: String(c.discount_value),
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
    try {
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
      setDialogOpen(false)
      load()
    } catch (err) {
      console.error('Failed to save coupon:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(coupon: Coupon) {
    try {
      await supabaseAdmin.from('coupons').update({ active: !coupon.active }).eq('id', coupon.id)
      load()
    } catch (err) {
      console.error('Failed to toggle coupon:', err)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await supabaseAdmin.from('coupons').delete().eq('id', deleteTarget.id)
      setDeleteTarget(null)
      load()
    } catch (err) {
      console.error('Failed to delete coupon:', err)
    }
  }

  const columns = useMemo<ColumnDef<Coupon>[]>(() => [
    {
      accessorKey: 'code',
      header: ({ column }) => <SortableHeader column={column}>Code</SortableHeader>,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
