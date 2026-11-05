import { useCallback, useEffect, useMemo, useState } from "react"
import { SearchIcon } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DataTable,
  SortableHeader,
  selectionColumn,
} from "@/components/DataTable"
import { MerchOrderDetailSheet } from "@/components/MerchOrderDetailSheet"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import {
  MERCH_ORDER_STATUS_LABEL,
  MERCH_ORDER_STATUS_VARIANT,
  type MerchOrder,
  type MerchOrderPatch,
  type MerchOrderStatus,
} from "@/lib/merch-orders"
import { cn } from "@/lib/utils"

export function MerchOrdersPanel() {
  const [orders, setOrders] = useState<MerchOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [detailTarget, setDetailTarget] = useState<MerchOrder | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("merch_orders")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) {
      setLoadError(error.message)
    } else {
      setLoadError(null)
      setOrders(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function updateOrders(ids: string[], patch: MerchOrderPatch) {
    const { error } = await supabase
      .from("merch_orders")
      .update(patch)
      .in("id", ids)
    if (error) {
      console.error("Merch order update failed:", error.message)
      return false
    }
    setOrders((prev) =>
      prev.map((o) => (ids.includes(o.id) ? { ...o, ...patch } : o))
    )
    setDetailTarget((prev) =>
      prev && ids.includes(prev.id) ? { ...prev, ...patch } : prev
    )
    return true
  }

  function markShipped(ids: string[]) {
    return updateOrders(ids, {
      status: "shipped",
      shipped_at: new Date().toISOString(),
    })
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return orders.filter(
      (o) =>
        (statusFilter === "all" || o.status === statusFilter) &&
        (String(o.order_number).includes(q) ||
          o.item_name.toLowerCase().includes(q) ||
          (o.buyer_name ?? "").toLowerCase().includes(q) ||
          (o.buyer_email ?? "").toLowerCase().includes(q))
    )
  }, [orders, search, statusFilter])

  const toShip = orders.filter((o) => o.status === "paid").length
  const shipped = orders.filter((o) => o.status === "shipped").length
  const revenue = orders
    .filter((o) => o.status !== "cancelled" && o.status !== "refunded")
    .reduce((sum, o) => sum + Number(o.amount), 0)

  const columns = useMemo<ColumnDef<MerchOrder>[]>(
    () => [
      selectionColumn<MerchOrder>(),
      {
        accessorKey: "order_number",
        header: ({ column }) => (
          <SortableHeader column={column}>#</SortableHeader>
        ),
        cell: ({ getValue }) => (
          <span className="text-sm font-medium tabular-nums">
            #{getValue<number>()}
          </span>
        ),
        size: 80,
      },
      {
        accessorKey: "buyer_name",
        header: "Customer",
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">
              {row.original.buyer_name ?? "—"}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {row.original.buyer_email ?? ""}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "item_name",
        header: "Item",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.item_name}{" "}
            <span className="text-muted-foreground">· {row.original.size}</span>
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const status = getValue<MerchOrderStatus>()
          return (
            <Badge variant={MERCH_ORDER_STATUS_VARIANT[status]}>
              {MERCH_ORDER_STATUS_LABEL[status]}
            </Badge>
          )
        },
        size: 130,
      },
      {
        accessorKey: "created_at",
        header: ({ column }) => (
          <SortableHeader column={column}>Placed</SortableHeader>
        ),
        cell: ({ getValue }) => (
          <span className="text-sm">
            {new Date(getValue<string>()).toLocaleDateString("lt-LT")}
          </span>
        ),
        size: 110,
      },
      {
        accessorKey: "amount",
        header: ({ column }) => (
          <SortableHeader column={column} className="w-full justify-end">
            Amount
          </SortableHeader>
        ),
        cell: ({ getValue }) => (
          <span className="block text-right text-sm tabular-nums">
            €{Number(getValue<number>()).toFixed(2)}
          </span>
        ),
        size: 90,
      },
    ],
    []
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="To ship" value={toShip} isHighlighted={toShip > 0} />
        <StatCard label="Shipped" value={shipped} />
        <StatCard label="Revenue" value={`€${revenue.toFixed(2)}`} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm min-w-[200px] flex-1">
          <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search merch orders…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(Object.keys(MERCH_ORDER_STATUS_LABEL) as MerchOrderStatus[]).map(
              (s) => (
                <SelectItem key={s} value={s}>
                  {MERCH_ORDER_STATUS_LABEL[s]}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      {loadError && (
        <p className="text-sm text-destructive">
          Could not load merch orders: {loadError}
        </p>
      )}

      <DataTable
        data={filtered}
        columns={columns}
        onRowClick={(order) => {
          setDetailTarget(order)
          setIsDetailOpen(true)
        }}
        renderBulkActions={(rows, clear) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void markShipped(rows.map((r) => r.id))
              clear()
            }}
          >
            Mark shipped
          </Button>
        )}
      />

      <p className="text-xs text-muted-foreground">
        {loading
          ? "Loading…"
          : `Showing ${filtered.length} of ${orders.length} merch orders`}
      </p>

      <MerchOrderDetailSheet
        order={detailTarget}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onSave={(order, patch) => updateOrders([order.id], patch)}
      />
    </div>
  )
}

function StatCard({
  label,
  value,
  isHighlighted = false,
}: {
  label: string
  value: number | string
  isHighlighted?: boolean
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "text-2xl font-bold",
            isHighlighted && "text-amber-600"
          )}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  )
}
