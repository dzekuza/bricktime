import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"

import { DataTable } from "@/components/DataTable"
import { TableSection } from "@/components/TableSection"
import { Badge } from "@/components/ui/badge"
import {
  planColors,
  planLabels,
  subscriberStatusColors,
} from "@/data/subscribers"
import type { RecentCustomer } from "@/hooks/use-dashboard-tables"
import { formatShortDate } from "@/lib/format-date"
import { cn } from "@/lib/utils"

interface RecentCustomersTableProps {
  customers: RecentCustomer[]
  loading: boolean
}

export function RecentCustomersTable({
  customers,
  loading,
}: RecentCustomersTableProps) {
  const columns = useMemo<ColumnDef<RecentCustomer, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Customer",
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">{row.original.name}</span>
            <span className="text-xs text-muted-foreground">
              {row.original.email}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "plan",
        header: "Plan",
        cell: ({ row }) => (
          <Badge className={cn(planColors[row.original.plan])}>
            {planLabels[row.original.plan]}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={cn("capitalize", subscriberStatusColors[row.original.status])}
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: "joinedAt",
        header: "Joined",
        cell: ({ row }) => formatShortDate(row.original.joinedAt),
      },
    ],
    []
  )

  return (
    <TableSection
      title="New customers"
      description="Most recent sign-ups"
      href="/subscribers"
      linkLabel="View all customers"
      loading={loading}
    >
      <DataTable caption="New customers" columns={columns} data={customers} />
    </TableSection>
  )
}
