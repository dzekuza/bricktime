import { useEffect, useState } from "react"
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { supabase, type Tables } from "@/lib/supabase"

type Category = Tables<"product_categories">

function blank(sortOrder: number): Category {
  return {
    name: "",
    sort_order: sortOrder,
    active: true,
    created_at: new Date(0).toISOString(),
  }
}

export function CategoriesTab() {
  const [items, setItems] = useState<Category[]>([])
  const [usage, setUsage] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [form, setForm] = useState<Category>(blank(0))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    const [{ data: cats }, { data: products }] = await Promise.all([
      supabase.from("product_categories").select("*").order("sort_order"),
      supabase.from("products").select("category"),
    ])
    setItems(cats ?? [])
    // Products per category, so the admin can see what a rename or a
    // deactivation would affect before doing it.
    const counts: Record<string, number> = {}
    for (const p of products ?? []) {
      if (p.category) counts[p.category] = (counts[p.category] ?? 0) + 1
    }
    setUsage(counts)
    setLoading(false)
  }

  useEffect(() => {
    if (editOpen) {
      setForm(editTarget ?? blank((items.at(-1)?.sort_order ?? 0) + 10))
      setError(null)
    }
  }, [editOpen, editTarget, items])

  async function handleSave() {
    const name = form.name.trim()
    if (!name) {
      setError("Name cannot be empty.")
      return
    }

    const isNew = editTarget === null
    const { error: err } = isNew
      ? await supabase.from("product_categories").insert({ ...form, name })
      : // The name is the primary key and products.category references it with
        // ON UPDATE CASCADE, so renaming here moves every product with it.
        await supabase
          .from("product_categories")
          .update({ ...form, name })
          .eq("name", editTarget.name)

    if (err) {
      setError(
        err.code === "23505"
          ? "A category with that name already exists."
          : `Could not save: ${err.message}`
      )
      return
    }
    setEditOpen(false)
    await load()
  }

  async function handleDelete(item: Category) {
    const { error: err } = await supabase
      .from("product_categories")
      .delete()
      .eq("name", item.name)

    if (err) {
      // ON DELETE RESTRICT — the category still has products on it.
      setError(
        err.code === "23503"
          ? `"${item.name}" is still used by ${usage[item.name] ?? 0} product(s). Move them to another category first.`
          : `Could not delete: ${err.message}`
      )
      setDeleteTarget(null)
      return
    }
    setDeleteTarget(null)
    await load()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            Themes shown in the storefront filter and the product form.
            Renaming one moves every product on it automatically.
          </CardDescription>
        </div>
        <Button
          onClick={() => {
            setEditTarget(null)
            setEditOpen(true)
          }}
        >
          <PlusIcon className="mr-2 size-4" />
          New category
        </Button>
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        {error && (
          <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories yet.</p>
        ) : (
          items.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium">{item.name}</span>
                <Badge variant="secondary">
                  {usage[item.name] ?? 0} products
                </Badge>
                {!item.active && <Badge variant="outline">Hidden</Badge>}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditTarget(item)
                    setEditOpen(true)
                  }}
                >
                  <PencilIcon className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteTarget(item)}
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Edit category" : "New category"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {editTarget && (usage[editTarget.name] ?? 0) > 0 && (
                <p className="text-xs text-muted-foreground">
                  Renaming moves {usage[editTarget.name]} product(s) to the new
                  name.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="category-order">Sort order</Label>
              <Input
                id="category-order"
                type="number"
                value={form.sort_order}
                onChange={(e) =>
                  setForm({ ...form, sort_order: Number(e.target.value) })
                }
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first in the storefront filter.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label>Visible in storefront</Label>
                <Switch
                  checked={form.active}
                  onCheckedChange={(v) => setForm({ ...form, active: v })}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                When off, the theme leaves the filter but its products keep it.
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (usage[deleteTarget.name] ?? 0) > 0
                ? `"${deleteTarget.name}" is used by ${usage[deleteTarget.name]} product(s), so it cannot be deleted. Hide it instead.`
                : `"${deleteTarget?.name}" will be deleted permanently.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
