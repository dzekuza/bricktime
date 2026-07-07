import { useState, useMemo } from 'react'
import { PlusIcon, SearchIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { Label } from '@/components/ui/label'
import { DataTable, SortableHeader } from '@/components/DataTable'
import { mockMerch, type MerchItem, type MerchType, type MerchStatus } from '@/data/merch'

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

interface FormState {
  name: string
  type: MerchType
  price: string
  sizes: string[]
  stock: string
  status: MerchStatus
}

const emptyForm = (): FormState => ({
  name: '',
  type: 't-shirt',
  price: '',
  sizes: ['S', 'M', 'L', 'XL'],
  stock: '0',
  status: 'draft',
})

export function Merch() {
  const [items, setItems] = useState<MerchItem[]>(mockMerch)
  const [query, setQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    if (!q) return items
    return items.filter((item) => item.name.toLowerCase().includes(q) || item.type.includes(q))
  }, [items, query])

  function openAdd() {
    setEditingId(null)
    setForm(emptyForm())
    setDialogOpen(true)
  }

  function openEdit(item: MerchItem) {
    setEditingId(item.id)
    setForm({
      name: item.name,
      type: item.type,
      price: String(item.price),
      sizes: item.sizes,
      stock: String(item.stock),
      status: item.status,
    })
    setDialogOpen(true)
  }

  function toggleSize(size: string) {
    setForm((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size) ? prev.sizes.filter((s) => s !== size) : [...prev.sizes, size],
    }))
  }

  function saveItem() {
    const base: Omit<MerchItem, 'id' | 'created_at'> = {
      name: form.name.trim(),
      type: form.type,
      price: Number(form.price) || 0,
      sizes: form.sizes,
      stock: Number(form.stock) || 0,
      status: form.status,
    }
    if (editingId) {
      setItems((prev) => prev.map((i) => (i.id === editingId ? { ...i, ...base } : i)))
    } else {
      const newItem: MerchItem = {
        ...base,
        id: String(Date.now()),
        created_at: new Date().toISOString(),
      }
      setItems((prev) => [newItem, ...prev])
    }
    setDialogOpen(false)
  }

  function deleteItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const columns: ColumnDef<MerchItem>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column}>Name</SortableHeader>,
      cell: ({ row }) => <span className="font-medium text-sm">{row.original.name}</span>,
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: 'price',
      header: ({ column }) => <SortableHeader column={column}>Price</SortableHeader>,
      cell: ({ row }) => <span className="text-sm">€{row.original.price}</span>,
    },
    {
      accessorKey: 'sizes',
      header: 'Sizes',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.sizes.join(', ')}</span>
      ),
    },
    {
      accessorKey: 'stock',
      header: ({ column }) => <SortableHeader column={column}>Stock</SortableHeader>,
      cell: ({ row }) => (
        <span className={`text-sm font-medium ${row.original.stock === 0 ? 'text-muted-foreground' : ''}`}>
          {row.original.stock}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'active' ? 'default' : 'secondary'} className="capitalize">
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(row.original)}>
            <PencilIcon className="size-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => deleteItem(row.original.id)}
          >
            <Trash2Icon className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  const activeCount = items.filter((i) => i.status === 'active').length
  const draftCount = items.filter((i) => i.status === 'draft').length

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Merch</h1>
          <p className="text-sm text-muted-foreground">{items.length} product{items.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openAdd}>
          <PlusIcon className="mr-2 size-4" />
          Add product
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <span className="text-2xl font-bold">{items.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <span className="text-2xl font-bold text-green-600">{activeCount}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Draft</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <span className="text-2xl font-bold text-muted-foreground">{draftCount}</span>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search merch…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <DataTable columns={columns} data={filtered} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit product' : 'Add product'}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="merch-name">Name</Label>
              <Input
                id="merch-name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. BRICKTIME Classic Hoodie"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v as MerchType }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="t-shirt">T-shirt</SelectItem>
                    <SelectItem value="hoodie">Hoodie</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v as MerchStatus }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="merch-price">Price (€)</Label>
                <Input
                  id="merch-price"
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                  placeholder="29"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="merch-stock">Stock</Label>
                <Input
                  id="merch-stock"
                  type="number"
                  min={0}
                  value={form.stock}
                  onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Sizes</Label>
              <div className="flex flex-wrap gap-2">
                {ALL_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleSize(size)}
                    className={`rounded border px-3 py-1 text-sm font-medium transition-colors ${
                      form.sizes.includes(size)
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-muted-foreground hover:border-foreground'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveItem} disabled={!form.name.trim()}>
              {editingId ? 'Save changes' : 'Add product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
