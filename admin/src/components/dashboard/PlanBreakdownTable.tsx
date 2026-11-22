import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"

import { DataTable } from "@/components/DataTable"
import { DashboardTableSection } from "@/components/dashboard/DashboardTableSection"
import { Badge } from "@/components/ui/badge"
import { planColors, planLabels } from "@/data/subscribers"
import type { PlanBreakdownRow } from "@/hooks/use-dashboard-tables"
import { cn } from "@/lib/utils"

interface PlanBreakdownTableProps {
  plans: PlanBreakdownRow[]
  loading: boolean
}

export function PlanBreakdownTable({ plans, loading }: PlanBreakdownTableProps) {
  const columns = useMemo<ColumnDef<PlanBreakdownRow, unknown>[]>(
    () => [
      {
        accessorKey: "plan",
        header: "Plan",
        cell: ({ row }) => (
          <Badge className={cn(planColors[row.original.plan])}>
            {planLabels[row.original.plan]}
          </Badge>
        ),
      },
      { accessorKey: "active", header: "Active" },
      { accessorKey: "paused", header: "Paused" },
      {
        accessorKey: "monthlyRevenue",
        header: "Revenue / month",
        cell: ({ row }) => `€${row.original.monthlyRevenue.toLocaleString()}`,
      },
    ],
    []
  )

  return (
    <DashboardTableSection
      title="Subscriptions by plan"
      description="Active and paused members per plan"
      href="/plans"
      linkLabel="View plans"
      loading={loading}
    >
      <DataTable caption="Subscriptions by plan" columns={columns} data={plans} />
    </DashboardTableSection>
  )
}
