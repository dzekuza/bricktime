import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"

import { DataTable } from "@/components/DataTable"
import { DashboardTableCard } from "@/components/dashboard/DashboardTableCard"
import { Badge } from "@/components/ui/badge"
import { orderStatusColors } from "@/data/orders"
import type { RecentOrder } from "@/hooks/use-dashboard-tables"
import { formatShortDate } from "@/lib/format-date"
import { cn } from "@/lib/utils"

interface RecentOrdersCardProps {
  orders: RecentOrder[]
  loading: boolean
}

export function RecentOrdersCard({ orders, loading }: RecentOrdersCardProps) {
  const columns = useMemo<ColumnDef<RecentOrder, unknown>[]>(
    () => [
      { accessorKey: "customer", header: "Customer" },
      { accessorKey: "product", header: "Set" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={cn("capitalize", orderStatusColors[row.original.status])}
          >
            {row.original.status.replace(/_/g, " ")}
          </Badge>
        ),
      },
      {
        accessorKey: "dueDate",
        header: "Due",
        cell: ({ row }) => formatShortDate(row.original.dueDate),
      },
    ],
    []
  )

  return (
    <DashboardTableCard
      title="Recent orders"
      description="Latest rentals and their status"
      href="/orders"
      linkLabel="View all orders"
      loading={loading}
    >
      <DataTable
        caption="Recent orders"
        columns={columns}
        data={orders}
      />
    </DashboardTableCard>
  )
}
