import { useState, useEffect, useMemo, useRef } from "react"
import {
  PlusIcon,
  SearchIcon,
  PencilIcon,
  Trash2Icon,
  UploadIcon,
  XIcon,
  Loader2Icon,
  ImageIcon,
} from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { DataTable, SortableHeader } from "@/components/DataTable"
import { DeleteDialog } from "@/components/DeleteDialog"
import type { MerchItem, MerchType, MerchStatus } from "@/data/merch"

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"]

const STATUS_LABEL: Record<MerchStatus, string> = {
  draft: "Draft",
  "coming-soon": "Coming soon",
  active: "Active",
}

interface FormState {
  name: string
  slug: string
  type: MerchType
  price: string
  sizes: string[]
  stock: Record<string, string>
  status: MerchStatus
  bg: string
  imageUrl: string | null
  imageUrls: string[]
}

const emptyForm = (): FormState => ({
  name: "",
  slug: "",
  type: "t-shirt",
  price: "",
  sizes: ["S", "M", "L", "XL"],
  stock: { S: "0", M: "0", L: "0", XL: "0" },
  status: "draft",
  bg: "#001B21",
  imageUrl: null,
  imageUrls: [],
})

/** merch_items.slug is `not null unique`, so a new row needs one derived up front. */
function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

async function uploadMerchImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop()
  const path = `merch/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage
    .from("site-content")
    .upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from("site-content").getPublicUrl(path)
  return data.publicUrl
}

export function Merch() {
  const [items, setItems] = useState<MerchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [heroUploading, setHeroUploading] = useState(false)
  const [galleryUploading, setGalleryUploading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<MerchItem | null>(null)

  const heroInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data, error: loadError } = await supabase
      .from("merch_items")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
    if (loadError) {
      setError(loadError.message)
    } else {
      setError(null)
      setItems((data ?? []) as MerchItem[])
    }
    setLoading(false)
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    if (!q) return items
    return items.filter(
      (item) => item.name.toLowerCase().includes(q) || item.type.includes(q)
    )
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
      slug: item.slug,
      type: item.type,
      price: String(item.price),
      sizes: item.sizes,
      stock: Object.fromEntries(
        item.sizes.map((size) => [size, String(item.stock[size] ?? 0)])
      ),
      status: item.status,
      bg: item.bg,
      imageUrl: item.image_url,
      imageUrls: item.image_urls ?? [],
    })
    setDialogOpen(true)
  }

  function toggleSize(size: string) {
    setForm((prev) => {
      if (prev.sizes.includes(size)) {
        const stock = { ...prev.stock }
        delete stock[size]
        return { ...prev, sizes: prev.sizes.filter((s) => s !== size), stock }
      }
      return {
        ...prev,
        sizes: [...prev.sizes, size],
        stock: { ...prev.stock, [size]: prev.stock[size] ?? "0" },
      }
    })
  }

  function setSizeStock(size: string, value: string) {
    setForm((prev) => ({ ...prev, stock: { ...prev.stock, [size]: value } }))
  }

  async function handleHeroFile(file: File) {
    setHeroUploading(true)
    try {
      const url = await uploadMerchImage(file)
      setForm((f) => ({ ...f, imageUrl: url }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed")
    } finally {
      setHeroUploading(false)
    }
  }

  async function handleGalleryFiles(files: File[]) {
    setGalleryUploading(true)
    try {
      const urls = await Promise.all(files.map(uploadMerchImage))
      setForm((f) => ({ ...f, imageUrls: [...f.imageUrls, ...urls] }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed")
    } finally {
      setGalleryUploading(false)
    }
  }

  function removeGalleryImage(url: string) {
    setForm((f) => ({ ...f, imageUrls: f.imageUrls.filter((u) => u !== url) }))
  }

  async function saveItem() {
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      slug: form.slug || slugify(form.name),
      type: form.type,
      price: Number(form.price) || 0,
      sizes: form.sizes,
      stock: Object.fromEntries(
        form.sizes.map((size) => [size, Number(form.stock[size]) || 0])
      ),
      status: form.status,
      bg: form.bg,
      image_url: form.imageUrl,
      image_urls: form.imageUrls,
    }
    const { error: saveError } = editingId
      ? await supabase.from("merch_items").update(payload).eq("id", editingId)
      : await supabase.from("merch_items").insert(payload)
    setSaving(false)
    if (saveError) {
      setError(saveError.message)
      return
    }
    setError(null)
    setDialogOpen(false)
    load()
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    const { error: deleteError } = await supabase
      .from("merch_items")
      .delete()
      .eq("id", deleteTarget.id)
    setDeleteTarget(null)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    load()
  }

  const columns: ColumnDef<MerchItem>[] = [
    {
      id: "image",
      header: "",
      cell: ({ row }) =>
        row.original.image_url ? (
          <img
            src={row.original.image_url}
            alt={row.original.name}
            className="size-9 rounded border object-cover"
          />
        ) : (
          <div className="flex size-9 items-center justify-center rounded border text-muted-foreground">
            <ImageIcon className="size-4" />
          </div>
        ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortableHeader column={column}>Name</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: "price",
      header: ({ column }) => (
        <SortableHeader column={column}>Price</SortableHeader>
      ),
      cell: ({ row }) => <span className="text-sm">€{row.original.price}</span>,
    },
    {
      accessorKey: "sizes",
      header: "Sizes",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.sizes.join(", ")}
        </span>
      ),
    },
    {
      id: "stock",
      accessorFn: (item) =>
        Object.values(item.stock).reduce((sum, n) => sum + n, 0),
      header: ({ column }) => (
        <SortableHeader column={column}>Stock</SortableHeader>
      ),
      cell: ({ row }) => {
        const total = Object.values(row.original.stock).reduce(
          (sum, n) => sum + n,
          0
        )
        const breakdown = row.original.sizes
          .map((size) => `${size}: ${row.original.stock[size] ?? 0}`)
          .join(", ")
        return (
          <span
            title={breakdown}
            className={`text-sm font-medium ${total === 0 ? "text-muted-foreground" : ""}`}
          >
            {total}
          </span>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={row.original.status === "active" ? "default" : "secondary"}
          className="capitalize"
        >
          {STATUS_LABEL[row.original.status]}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => openEdit(row.original)}
          >
            <PencilIcon className="size-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleteTarget(row.original)}
          >
            <Trash2Icon className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  const activeCount = items.filter((i) => i.status === "active").length
  const draftCount = items.filter((i) => i.status === "draft").length

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Merch</h1>
          <p className="text-sm text-muted-foreground">
            {items.length} product{items.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={openAdd}>
          <PlusIcon className="mr-2 size-4" />
          Add product
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pt-4 pb-1">
            <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <span className="text-2xl font-bold">{items.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pt-4 pb-1">
            <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <span className="text-2xl font-bold text-green-600">
              {activeCount}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pt-4 pb-1">
            <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Draft
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <span className="text-2xl font-bold text-muted-foreground">
              {draftCount}
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search merch…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <DataTable columns={columns} data={filtered} />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit product" : "Add product"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="merch-name">Name</Label>
              <Input
                id="merch-name"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g. BRICKTIME Classic Hoodie"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>
                Main image{" "}
                <span className="text-xs text-muted-foreground">
                  (shown in the shop listing and as the default product photo)
                </span>
              </Label>
              {form.imageUrl ? (
                <div className="flex items-center gap-3">
                  <img
                    src={form.imageUrl}
                    alt="Product"
                    className="size-16 rounded-lg border object-cover"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setForm((f) => ({ ...f, imageUrl: null }))}
                  >
                    <XIcon className="mr-1.5 size-3.5" />
                    Remove
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={heroUploading}
                  onClick={() => heroInputRef.current?.click()}
                >
                  {heroUploading ? (
                    <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />
                  ) : (
                    <UploadIcon className="mr-1.5 size-3.5" />
                  )}
                  {heroUploading ? "Uploading…" : "Upload image"}
                </Button>
              )}
              <input
                ref={heroInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ""
                  if (file) handleHeroFile(file)
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>
                Gallery{" "}
                <span className="text-xs text-muted-foreground">
                  (extra photos on the product page)
                </span>
              </Label>
              {form.imageUrls.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.imageUrls.map((url) => (
                    <div key={url} className="relative">
                      <img
                        src={url}
                        alt="Gallery"
                        className="size-16 rounded-lg border object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(url)}
                        className="absolute -top-1.5 -right-1.5 rounded-full border bg-background p-0.5 text-muted-foreground hover:text-destructive"
                        aria-label="Remove image"
                      >
                        <XIcon className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={galleryUploading}
                onClick={() => galleryInputRef.current?.click()}
              >
                {galleryUploading ? (
                  <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <UploadIcon className="mr-1.5 size-3.5" />
                )}
                {galleryUploading ? "Uploading…" : "Add photos"}
              </Button>
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? [])
                  e.target.value = ""
                  if (files.length) handleGalleryFiles(files)
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, type: v as MerchType }))
                  }
                >
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
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, status: v as MerchStatus }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="coming-soon">Coming soon</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="merch-price">Price (€)</Label>
              <Input
                id="merch-price"
                type="number"
                min={0}
                value={form.price}
                onChange={(e) =>
                  setForm((p) => ({ ...p, price: e.target.value }))
                }
                placeholder="29"
              />
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
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-foreground"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {form.sizes.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <Label>Stock per size</Label>
                <div className="grid grid-cols-3 gap-3">
                  {form.sizes.map((size) => (
                    <div key={size} className="flex flex-col gap-1.5">
                      <Label
                        htmlFor={`merch-stock-${size}`}
                        className="text-xs text-muted-foreground"
                      >
                        {size}
                      </Label>
                      <Input
                        id={`merch-stock-${size}`}
                        type="number"
                        min={0}
                        value={form.stock[size] ?? "0"}
                        onChange={(e) => setSizeStock(size, e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveItem} disabled={!form.name.trim() || saving}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Add product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        itemName={deleteTarget?.name ?? ""}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
