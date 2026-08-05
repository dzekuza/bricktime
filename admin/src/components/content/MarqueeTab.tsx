import { useEffect, useState } from "react"
import { PencilIcon, PlusIcon, Trash2Icon, UploadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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

type MarqueeItem = Tables<"home_marquee_items">

interface MarqueeTabProps {
  items: MarqueeItem[]
  onChange: (items: MarqueeItem[]) => void
}

function blank(sortOrder: number): MarqueeItem {
  return {
    id: crypto.randomUUID(),
    text: "",
    avatar_url: null,
    sort_order: sortOrder,
    updated_at: new Date(0).toISOString(),
  }
}

async function uploadToStorage(file: File): Promise<string> {
  const ext = file.name.split(".").pop()
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage
    .from("site-content")
    .upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from("site-content").getPublicUrl(path)
  return data.publicUrl
}

export function MarqueeTab({ items, onChange }: MarqueeTabProps) {
  const [editTarget, setEditTarget] = useState<MarqueeItem | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<MarqueeItem | null>(null)
  const [form, setForm] = useState<MarqueeItem>(blank(items.length))
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (editOpen) setForm(editTarget ?? blank(items.length))
  }, [editOpen, editTarget, items.length])

  function openAdd() {
    setEditTarget(null)
    setEditOpen(true)
  }

  function openEdit(item: MarqueeItem) {
    setEditTarget(item)
    setEditOpen(true)
  }

  async function handleAvatarUpload(file: File) {
    setUploading(true)
    try {
      setForm({ ...form, avatar_url: await uploadToStorage(file) })
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    const isNew = !items.some((i) => i.id === form.id)
    const { error } = isNew
      ? await supabase.from("home_marquee_items").insert(form)
      : await supabase.from("home_marquee_items").update(form).eq("id", form.id)
    if (error) {
      console.error("Failed to save marquee item:", error.message)
      return
    }
    onChange(
      isNew ? [...items, form] : items.map((i) => (i.id === form.id ? form : i))
    )
    setEditOpen(false)
  }

  async function handleDelete(item: MarqueeItem) {
    const { error } = await supabase
      .from("home_marquee_items")
      .delete()
      .eq("id", item.id)
    if (error) {
      console.error("Failed to delete marquee item:", error.message)
      return
    }
    onChange(items.filter((i) => i.id !== item.id))
    setDeleteTarget(null)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Marquee</CardTitle>
          <CardDescription>
            The scrolling text + avatar strip below the hero.
          </CardDescription>
        </div>
        <Button size="sm" onClick={openAdd}>
          <PlusIcon className="mr-1.5 size-3.5" />
          Add item
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-4 rounded-lg border p-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">
                {item.avatar_url ? (
                  <img
                    src={item.avatar_url}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : null}
              </div>
              <p className="truncate text-sm font-medium">{item.text}</p>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openEdit(item)}
              >
                <PencilIcon className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => setDeleteTarget(item)}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No marquee items yet.
          </p>
        )}
      </CardContent>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Edit marquee item" : "Add marquee item"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Text</Label>
              <Input
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Avatar</Label>
              <div className="flex items-center gap-3">
                <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">
                  {form.avatar_url ? (
                    <img
                      src={form.avatar_url}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : null}
                </div>
                <Label className="cursor-pointer">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>
                      <UploadIcon className="mr-1.5 size-3.5" />
                      {uploading ? "Uploading…" : "Upload"}
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleAvatarUpload(f)
                      e.target.value = ""
                    }}
                  />
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!form.text.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete marquee item "{deleteTarget?.text}"?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
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
