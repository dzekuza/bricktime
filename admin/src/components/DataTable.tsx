import * as React from 'react'
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

// ── Selection column helper ─────────────────────────────────────────────────
// eslint-disable-next-line react-refresh/only-export-components
export function selectionColumn<TData>(): ColumnDef<TData> {
  return {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() ? 'indeterminate' : false)
        }
        onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(v) => row.toggleSelected(!!v)}
        aria-label="Select row"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  }
}

// ── DataTable ───────────────────────────────────────────────────────────────
interface DataTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData, unknown>[]
  onRowClick?: (row: TData) => void
  renderBulkActions?: (
    selectedRows: TData[],
    clearSelection: () => void,
  ) => React.ReactNode
  className?: string
}

export function DataTable<TData>({
  data,
  columns,
  onRowClick,
  renderBulkActions,
  className,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [rowSelection, setRowSelection] = React.useState({})

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
  })

  const selectedRows = table
    .getFilteredSelectedRowModel()
    .rows.map((r) => r.original)

  const hasSelection = selectedRows.length > 0

  function clearSelection() {
    setRowSelection({})
  }

  return (
    <div className={cn('flex flex-col gap-0', className)}>
      {/* Bulk action toolbar */}
      {hasSelection && renderBulkActions && (
        <div className="flex items-center gap-3 rounded-t-lg border border-b-0 bg-muted/50 px-4 py-2.5">
          <span className="text-sm font-medium text-muted-foreground">
            {selectedRows.length} selected
          </span>
          <div className="flex items-center gap-2">
            {renderBulkActions(selectedRows, clearSelection)}
          </div>
        </div>
      )}

      {/* Table */}
      <div className={cn('overflow-hidden border', hasSelection && renderBulkActions ? 'rounded-b-lg' : 'rounded-lg')}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent">
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.column.getSize() !== 150 ? header.column.getSize() : undefined }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                  className={cn(onRowClick && 'cursor-pointer')}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// ── Sortable header helper ──────────────────────────────────────────────────
import { ArrowUpDownIcon, ArrowUpIcon, ArrowDownIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Column } from '@tanstack/react-table'

export function SortableHeader<TData>({
  column,
  children,
  className,
}: {
  column: Column<TData, unknown>
  children: React.ReactNode
  className?: string
}) {
  const sorted = column.getIsSorted()
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('-ml-3 h-8 gap-1.5 font-medium data-[state=open]:bg-accent', className)}
      onClick={() => column.toggleSorting(sorted === 'asc')}
    >
      {children}
      {sorted === 'asc' ? (
        <ArrowUpIcon className="size-3.5" />
      ) : sorted === 'desc' ? (
        <ArrowDownIcon className="size-3.5" />
      ) : (
        <ArrowUpDownIcon className="size-3.5 opacity-50" />
      )}
    </Button>
  )
}
