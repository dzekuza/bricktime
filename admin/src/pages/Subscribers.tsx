import { useState, useMemo, useEffect } from 'react'
import { MoreHorizontalIcon, SearchIcon, Trash2Icon } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  planColors,
  subscriberStatusColors,
  type Subscriber,
  type SubscriberStatus,
} from '@/data/subscribers'
import { supabaseAdmin } from '@/lib/supabase'

const PLAN_PRICES: Record<string, number> = { nano: 7, mini: 12, standard: 19, pro: 28, mega: 49 }
import { DataTable, SortableHeader, selectionColumn } from '@/components/DataTable'
import { DeleteDialog } from '@/components/DeleteDialog'
import { SubscriberProfileSheet } from '@/components/SubscriberProfileSheet'

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export function Subscribers() {
  const [items, setItems] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deleteTarget, setDeleteTarget] = useState<Subscriber | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [profileTarget, setProfileTarget] = useState<Subscriber | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: subs }, { data: orderRows }] = await Promise.all([
        supabaseAdmin.from('subscribers').select('*').order('joined_at', { ascending: false }),
        supabaseAdmin.from('orders').select('subscriber_id'),
      ])

      const countMap: Record<string, number> = {}
      for (const o of orderRows ?? []) {
        countMap[o.subscriber_id] = (countMap[o.subscriber_id] ?? 0) + 1
      }

      if (subs) {
        setItems(subs.map((s) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          plan: s.plan as Subscriber['plan'],
          status: s.status as SubscriberStatus,
          joined: s.joined_at.split('T')[0],
          monthlySpend: s.status === 'active' ? (PLAN_PRICES[s.plan] ?? 0) : 0,
          setsRented: countMap[s.id] ?? 0,
        })))
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => items.filter((s) => {
    const q = search.toLowerCase()
    return (
      (s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)) &&
      (planFilter === 'all' || s.plan === planFilter) &&
      (statusFilter === 'all' || s.status === statusFilter)
    )
  }), [items, search, planFilter, statusFilter])

  const active = items.filter((s) => s.status === 'active').length
  const mrr = items.filter((s) => s.status === 'active').reduce((sum, s) => sum + s.monthlySpend, 0)
  const churn = items.filter((s) => s.status === 'cancelled').length

  function openProfile(sub: Subscriber) {
    setProfileTarget(sub)
    setProfileOpen(true)
  }

  async function handleSetStatus(ids: string[], status: SubscriberStatus) {
    const { error } = await supabaseAdmin
      .from('subscribers')
      .update({ status, updated_at: new Date().toISOString() })
      .in('id', ids)
    if (error) { console.error('Status update failed:', error.message); return }
    setItems((prev) => prev.map((s) =>
      ids.includes(s.id)
        ? { ...s, status, monthlySpend: status === 'cancelled' || status === 'paused' ? 0 : PLAN_PRICES[s.plan] ?? 0 }
        : s
    ))
    setProfileTarget((prev) =>
      prev && ids.includes(prev.id)
        ? { ...prev, status, monthlySpend: status === 'cancelled' || status === 'paused' ? 0 : PLAN_PRICES[prev.plan] ?? 0 }
        : prev
    )
  }

  async function handleDelete(ids: string[]) {
    const { error } = await supabaseAdmin.from('subscribers').delete().in('id', ids)
    if (error) { console.error('Delete failed:', error.message); return }
    setItems((prev) => prev.filter((s) => !ids.includes(s.id)))
  }

  function openDelete(sub: Subscriber) {
    setDeleteTarget(sub)
    setDeleteOpen(true)
  }

  const columns = useMemo<ColumnDef<Subscriber, unknown>[]>(() => [
    selectionColumn<Subscriber>(),
    {
      id: 'subscriber',
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column}>Subscriber</SortableHeader>,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarFallback className="text-xs">{initials(row.original.name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-sm">{row.original.name}</span>
            <span className="text-xs text-muted-foreground">{row.original.email}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'plan',
      header: 'Plan',
      cell: ({ getValue }) => {
        const v = getValue<Subscriber['plan']>()
        return <Badge className={cn('capitalize', planColors[v])}>{v}</Badge>
      },
      size: 100,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const v = getValue<SubscriberStatus>()
        return <Badge className={cn('capitalize', subscriberStatusColors[v])}>{v}</Badge>
      },
      size: 100,
    },
    {
      accessorKey: 'joined',
      header: ({ column }) => <SortableHeader column={column}>Joined</SortableHeader>,
      cell: ({ getValue }) => <span className="text-sm text-muted-foreground">{getValue<string>()}</span>,
      size: 120,
    },
    {
      accessorKey: 'monthlySpend',
      header: ({ column }) => <SortableHeader column={column} className="justify-end w-full">Monthly</SortableHeader>,
      cell: ({ getValue }) => {
        const v = getValue<number>()
        return (
          <span className="text-sm tabular-nums block text-right">
            {v > 0 ? `€${v}` : <span className="text-muted-foreground">—</span>}
          </span>
        )
      },
      size: 90,
    },
    {
      accessorKey: 'setsRented',
      header: ({ column }) => <SortableHeader column={column} className="justify-end w-full">Sets</SortableHeader>,
      cell: ({ getValue }) => (
        <span className="text-sm tabular-nums block text-right">{getValue<number>()}</span>
      ),
      size: 70,
    },
    {
      id: 'actions',
      size: 50,
      cell: ({ row }) => {
        const sub = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontalIcon className="size-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => openProfile(sub)}>View profile</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => window.open(`mailto:${sub.email}`)}>Send email</DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {sub.status !== 'active' && (
                  <DropdownMenuItem onSelect={() => handleSetStatus([sub.id], 'active')}>Mark as active</DropdownMenuItem>
                )}
                {sub.status !== 'paused' && (
                  <DropdownMenuItem onSelect={() => handleSetStatus([sub.id], 'paused')}>Pause subscription</DropdownMenuItem>
                )}
                {sub.status !== 'cancelled' && (
                  <DropdownMenuItem onSelect={() => handleSetStatus([sub.id], 'cancelled')}>Cancel subscription</DropdownMenuItem>
                )}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => openDelete(sub)}
              >
                Delete account
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Subscribers</h1>
        <p className="text-muted-foreground text-sm">{loading ? 'Loading…' : `${items.length} total members`}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{active}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">MRR</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">€{mrr.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Churned</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{churn}</div></CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search subscribers…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Plan" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All plans</SelectItem>
            <SelectItem value="nano">Nano</SelectItem>
            <SelectItem value="mini">Mini</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="mega">Mega</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        onRowClick={openProfile}
        renderBulkActions={(rows, clear) => (
          <>
            <Button variant="outline" size="sm" onClick={() => { handleSetStatus(rows.map(r => r.id), 'active'); clear() }}>
              Mark active
            </Button>
            <Button variant="outline" size="sm" onClick={() => { handleSetStatus(rows.map(r => r.id), 'paused'); clear() }}>
              Pause
            </Button>
            <Button variant="outline" size="sm" onClick={() => { handleSetStatus(rows.map(r => r.id), 'cancelled'); clear() }}>
              Cancel
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/30 hover:bg-destructive/5"
              onClick={() => { handleDelete(rows.map(r => r.id)); clear() }}
            >
              <Trash2Icon className="size-3.5 mr-1" />
              Delete
            </Button>
          </>
        )}
      />

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {items.length} subscribers
      </p>

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemName={deleteTarget?.name ?? ''}
        onConfirm={() => { if (deleteTarget) { handleDelete([deleteTarget.id]); setDeleteTarget(null) } }}
      />
      <SubscriberProfileSheet
        subscriber={profileTarget}
        open={profileOpen}
        onOpenChange={setProfileOpen}
        onStatusChange={(sub, status) => handleSetStatus([sub.id], status)}
      />
    </div>
  )
}
