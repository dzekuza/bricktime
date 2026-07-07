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
        })) as unknown as MissingPartRequest[]
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
      header: ({ column }) => <SortableHeader column={column}>Subscriber</SortableHeader>,
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
      header: ({ column }) => <SortableHeader column={column}>Product</SortableHeader>,
      cell: ({ row }) => (
        <span className="text-sm">{row.original.productTitle}</span>
      ),
    },
    {
      accessorKey: 'lego_set_code',
      header: ({ column }) => <SortableHeader column={column}>Set code</SortableHeader>,
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.lego_set_code}</span>,
    },
    {
      accessorKey: 'part_code',
      header: ({ column }) => <SortableHeader column={column}>Part code</SortableHeader>,
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
      header: ({ column }) => <SortableHeader column={column}>Submitted</SortableHeader>,
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
