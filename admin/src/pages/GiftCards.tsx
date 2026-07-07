import { useState, useMemo, useEffect } from 'react'
import { SearchIcon, GiftIcon } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabaseAdmin } from '@/lib/supabase'
import { DataTable, SortableHeader } from '@/components/DataTable'
import type { Tables } from '@/lib/database.types'

type GiftCard = Tables<'gift_cards'>

type StatusVariant = 'default' | 'secondary' | 'destructive' | 'outline'

function statusBadge(status: string, expiresAt: string): { label: string; variant: StatusVariant } {
  if (status === 'redeemed') return { label: 'Išnaudota', variant: 'secondary' }
  if (new Date(expiresAt) < new Date()) return { label: 'Pasibaigusi', variant: 'destructive' }
  return { label: 'Aktyvi', variant: 'default' }
}

function fmt(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('lt-LT')
}

function euros(cents: number) {
  return `€${(cents / 100).toFixed(2)}`
}

const columns: ColumnDef<GiftCard>[] = [
  {
    accessorKey: 'code',
    header: ({ column }) => <SortableHeader column={column}>Kodas</SortableHeader>,
    cell: ({ row }) => (
      <span className="font-mono text-xs tracking-widest">{row.original.code}</span>
    ),
  },
  {
    accessorKey: 'amount_cents',
    header: ({ column }) => <SortableHeader column={column}>Suma</SortableHeader>,
    cell: ({ row }) => (
      <span className="font-semibold">{euros(row.original.amount_cents)}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Būsena',
    cell: ({ row }) => {
      const { label, variant } = statusBadge(row.original.status, row.original.expires_at)
      return <Badge variant={variant}>{label}</Badge>
    },
  },
  {
    accessorKey: 'buyer_email',
    header: ({ column }) => <SortableHeader column={column}>Pirkėjas</SortableHeader>,
    cell: ({ row }) => <span className="text-sm">{row.original.buyer_email}</span>,
  },
  {
    accessorKey: 'recipient_email',
    header: ({ column }) => <SortableHeader column={column}>Gavėjas</SortableHeader>,
    cell: ({ row }) => <span className="text-sm">{row.original.recipient_email}</span>,
  },
  {
    accessorKey: 'message',
    header: 'Žinutė',
    cell: ({ row }) => {
      const msg = row.original.message
      if (!msg) return <span className="text-muted-foreground">—</span>
      return (
        <span className="max-w-[200px] truncate block text-sm" title={msg}>
          {msg}
        </span>
      )
    },
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => <SortableHeader column={column}>Sukurta</SortableHeader>,
    cell: ({ row }) => <span className="text-sm text-muted-foreground">{fmt(row.original.created_at)}</span>,
  },
  {
    accessorKey: 'expires_at',
    header: ({ column }) => <SortableHeader column={column}>Galioja iki</SortableHeader>,
    cell: ({ row }) => {
      const expired = new Date(row.original.expires_at) < new Date() && row.original.status !== 'redeemed'
      return (
        <span className={`text-sm ${expired ? 'text-destructive' : 'text-muted-foreground'}`}>
          {fmt(row.original.expires_at)}
        </span>
      )
    },
  },
  {
    accessorKey: 'redeemed_at',
    header: ({ column }) => <SortableHeader column={column}>Išnaudota</SortableHeader>,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{fmt(row.original.redeemed_at)}</span>
    ),
  },
]

export function GiftCards() {
  const [items, setItems] = useState<GiftCard[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    supabaseAdmin
      .from('gift_cards')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('Failed to load gift cards:', error.message)
        if (data) setItems(data)
        setLoading(false)
      })
  }, [])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    if (!q) return items
    return items.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.buyer_email.toLowerCase().includes(q) ||
        c.recipient_email.toLowerCase().includes(q) ||
        (c.message ?? '').toLowerCase().includes(q)
    )
  }, [items, query])

  const total = items.length
  const active = items.filter((c) => c.status !== 'redeemed' && new Date(c.expires_at) >= new Date()).length
  const redeemed = items.filter((c) => c.status === 'redeemed').length
  const totalRevenue = items.reduce((sum, c) => sum + c.amount_cents, 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <GiftIcon className="size-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Dovanų kortelės</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground tracking-wide">Iš viso</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground tracking-wide">Aktyvios</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground tracking-wide">Išnaudotos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{redeemed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground tracking-wide">Pajamos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{euros(totalRevenue)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Ieškoti pagal kodą, el. paštą..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Kraunama…</p>
      ) : (
        <>
          <DataTable columns={columns} data={filtered} />
          <p className="text-xs text-muted-foreground">{filtered.length} įrašų</p>
        </>
      )}
    </div>
  )
}
