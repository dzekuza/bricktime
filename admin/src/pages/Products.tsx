import { useState, useMemo, useEffect } from "react"
import {
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  tierColors,
  tierLabels,
  statusColors,
  type Product,
  type Tier,
  type ProductStatus,
} from "@/data/products"
import {
  DataTable,
  SortableHeader,
  selectionColumn,
} from "@/components/DataTable"
import { ProductEditDialog } from "@/components/ProductEditDialog"
import { DeleteDialog } from "@/components/DeleteDialog"
import { supabase } from "@/lib/supabase"

export function Products() {
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [tierFilter, setTierFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const [editTarget, setEditTarget] = useState<Product | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    supabase
      .from("products")
      .select(
        "id, title, subtitle, description, category, year, bricks, minifigs, build_time, value, price, min_age, stock, rating, tier, status, image_url, gallery, faq, bags, story, minifig, compatibility, release_date, early_access_tiers, early_access_hours, isDangerous"
      )
      .order("id")
      .then(({ data, error }) => {
        if (error) console.error("Failed to load products:", error.message)
        if (data) setItems(data as unknown as Product[])
        setLoading(false)
      })
  }, [])

  const filtered = useMemo(
    () =>
      items.filter((p) => {
        const matchesSearch =
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.category.toLowerCase().includes(search.toLowerCase())
        const matchesTier = tierFilter === "all" || p.tier === tierFilter
        const matchesStatus =
          statusFilter === "all" || p.status === statusFilter
        return matchesSearch && matchesTier && matchesStatus
      }),
    [items, search, tierFilter, statusFilter]
  )

  async function handleSave(updated: Product) {
    const { id, ...fields } = updated
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbFields = fields as any
    if (items.some((p) => p.id === id)) {
      const { error } = await supabase
        .from("products")
        .update(dbFields)
        .eq("id", id)
      if (error) {
        console.error("Update failed:", error.message)
        return
      }
      setItems((prev) => prev.map((p) => (p.id === id ? updated : p)))
    } else {
      const { data, error } = await supabase
        .from("products")
        .insert({ id, ...dbFields })
        .select()
        .single()
      if (error) {
        console.error("Insert failed:", error.message)
        return
      }
      if (data) setItems((prev) => [data as unknown as Product, ...prev])
    }
  }

  async function handleDuplicate(product: Product) {
    const maxId = Math.max(...items.map((p) => p.id))
    const newProduct = {
      ...product,
      id: maxId + 1,
      title: `${product.title} (copy)`,
      status: "available" as ProductStatus,
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
      .from("products")
      .insert(newProduct as any)
      .select()
      .single()
    if (error) {
      console.error("Duplicate failed:", error.message)
      return
    }
    if (data) setItems((prev) => [data as unknown as Product, ...prev])
  }

  async function handleSetStatus(ids: number[], status: ProductStatus) {
    const { error } = await supabase
      .from("products")
      .update({ status })
      .in("id", ids)
    if (error) {
      console.error("Status update failed:", error.message)
      return
    }
    setItems((prev) =>
      prev.map((p) => (ids.includes(p.id) ? { ...p, status } : p))
    )
  }

  async function handleDelete(ids: number[]) {
    const { error } = await supabase.from("products").delete().in("id", ids)
    if (error) {
      console.error("Delete failed:", error.message)
      return
    }
    setItems((prev) => prev.filter((p) => !ids.includes(p.id)))
  }

  function openEdit(product: Product) {
    setEditTarget(product)
    setEditOpen(true)
  }

  function openDelete(product: Product) {
    setDeleteTarget(product)
    setDeleteOpen(true)
  }

  const columns = useMemo<ColumnDef<Product, unknown>[]>(
    () => [
      selectionColumn<Product>(),
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-muted-foreground">
            #{getValue<number>()}
          </span>
        ),
        size: 60,
      },
      {
        id: "product",
        accessorKey: "title",
        header: ({ column }) => (
          <SortableHeader column={column}>Product</SortableHeader>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            {row.original.image_url && (
              <img
                src={row.original.image_url}
                alt=""
                className="size-9 shrink-0 rounded object-cover"
              />
            )}
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">{row.original.title}</span>
              <span className="text-xs text-muted-foreground">
                {row.original.subtitle}
              </span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: ({ column }) => (
          <SortableHeader column={column}>Category</SortableHeader>
        ),
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "bricks",
        header: ({ column }) => (
          <SortableHeader column={column} className="w-full justify-end">
            Bricks
          </SortableHeader>
        ),
        cell: ({ getValue }) => (
          <span className="block text-right text-sm tabular-nums">
            {getValue<number>()}
          </span>
        ),
        size: 80,
      },
      {
        accessorKey: "price",
        header: ({ column }) => (
          <SortableHeader column={column} className="w-full justify-end">
            Price
          </SortableHeader>
        ),
        cell: ({ getValue }) => {
          const v = getValue<number | null | undefined>()
          return (
            <span className="block text-right text-sm tabular-nums">
              {v != null ? `€${v}` : "—"}
            </span>
          )
        },
        size: 90,
      },
      {
        accessorKey: "stock",
        header: ({ column }) => (
          <SortableHeader column={column} className="w-full justify-end">
            Stock
          </SortableHeader>
        ),
        cell: ({ getValue }) => {
          const v = getValue<number | undefined>() ?? 0
          return (
            <span
              className={cn(
                "block text-right text-sm tabular-nums",
                v === 0 && "text-destructive"
              )}
            >
              {v}
            </span>
          )
        },
        size: 80,
      },
      {
        accessorKey: "minifigs",
        header: "Minifigs",
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "rating",
        header: ({ column }) => (
          <SortableHeader column={column}>Rating</SortableHeader>
        ),
        cell: ({ getValue }) => {
          const v = getValue<string | undefined>()
          return v ? (
            <span className="text-sm tabular-nums">★ {v}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )
        },
        size: 90,
      },
      {
        accessorKey: "tier",
        header: "Tier",
        cell: ({ getValue }) => {
          const v = getValue<Tier>()
          return (
            <Badge className={cn("capitalize", tierColors[v])}>
              {tierLabels[v]}
            </Badge>
          )
        },
        size: 100,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const v = getValue<ProductStatus>()
          return (
            <Badge className={cn("capitalize", statusColors[v])}>
              {v.replace("_", " ")}
            </Badge>
          )
        },
        size: 110,
      },
      {
        id: "actions",
        size: 50,
        cell: ({ row }) => {
          const product = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontalIcon className="size-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuItem onSelect={() => openEdit(product)}>
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleDuplicate(product)}>
                    Duplicate
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  {product.status !== "available" && (
                    <DropdownMenuItem
                      onSelect={() =>
                        handleSetStatus([product.id], "available")
                      }
                    >
                      Mark as available
                    </DropdownMenuItem>
                  )}
                  {product.status !== "sold_out" && (
                    <DropdownMenuItem
                      onSelect={() => handleSetStatus([product.id], "sold_out")}
                    >
                      Mark as sold out
                    </DropdownMenuItem>
                  )}
                  {product.status !== "limited" && (
                    <DropdownMenuItem
                      onSelect={() => handleSetStatus([product.id], "limited")}
                    >
                      Mark as limited
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => openDelete(product)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
    ],
    [items]
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">
            {items.length} sets in catalogue
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <PlusIcon data-icon="inline-start" />
          Add product
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm min-w-[200px] flex-1">
          <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tiers</SelectItem>
            <SelectItem value="nano">Mėgėjas</SelectItem>
            <SelectItem value="mini">Kūrėjas</SelectItem>
            <SelectItem value="standard">Meistras</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="mega">Legenda</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="sold_out">Sold out</SelectItem>
            <SelectItem value="limited">Limited</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-muted-foreground">
          Loading products…
        </div>
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          onRowClick={openEdit}
          renderBulkActions={(rows, clear) => (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleSetStatus(
                    rows.map((r) => r.id),
                    "available"
                  )
                  clear()
                }}
              >
                Mark available
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleSetStatus(
                    rows.map((r) => r.id),
                    "sold_out"
                  )
                  clear()
                }}
              >
                Mark sold out
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleSetStatus(
                    rows.map((r) => r.id),
                    "limited"
                  )
                  clear()
                }}
              >
                Mark limited
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-destructive/30 text-destructive hover:bg-destructive/5"
                onClick={() => {
                  handleDelete(rows.map((r) => r.id))
                  clear()
                }}
              >
                <Trash2Icon className="mr-1 size-3.5" />
                Delete
              </Button>
            </>
          )}
        />
      )}

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {items.length} products
      </p>

      <ProductEditDialog
        product={null}
        open={addOpen}
        onOpenChange={setAddOpen}
        onSave={handleSave}
        nextId={items.length ? Math.max(...items.map((p) => p.id)) + 1 : 1}
      />
      <ProductEditDialog
        product={editTarget}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={handleSave}
      />
      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemName={deleteTarget?.title ?? ""}
        onConfirm={() => {
          if (deleteTarget) {
            handleDelete([deleteTarget.id])
            setDeleteTarget(null)
          }
        }}
      />
    </div>
  )
}
