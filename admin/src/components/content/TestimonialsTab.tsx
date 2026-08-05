import { useEffect, useState } from "react"
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { HeadingEditor } from "@/components/content/HeadingEditor"
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

type HomeContent = Tables<"home_content">
type Testimonial = Tables<"home_testimonials">

interface TestimonialsTabProps {
  content: HomeContent
  onChangeContent: (content: HomeContent) => void
  items: Testimonial[]
  onChange: (items: Testimonial[]) => void
}

function blank(sortOrder: number): Testimonial {
  return {
    id: crypto.randomUUID(),
    quote: "",
    name: "",
    meta: "",
    avatar_color: "#FB4903",
    initials: "",
    bg: "#F5F1EB",
    sort_order: sortOrder,
    updated_at: new Date(0).toISOString(),
  }
}

export function TestimonialsTab({
  content,
  onChangeContent,
  items,
  onChange,
}: TestimonialsTabProps) {
  const [savingHeading, setSavingHeading] = useState(false)
  const [savedHeading, setSavedHeading] = useState(false)
  const [editTarget, setEditTarget] = useState<Testimonial | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null)
  const [form, setForm] = useState<Testimonial>(blank(items.length))

  useEffect(() => {
    if (editOpen) setForm(editTarget ?? blank(items.length))
  }, [editOpen, editTarget, items.length])

  function setHeading<K extends keyof HomeContent>(
    key: K,
    value: HomeContent[K]
  ) {
    onChangeContent({ ...content, [key]: value })
  }

  async function handleSaveHeading() {
    setSavingHeading(true)
    const { id, updated_at, ...fields } = content
    void updated_at
    const { error } = await supabase
      .from("home_content")
      .update(fields)
      .eq("id", id)
    setSavingHeading(false)
    if (error) {
      console.error("Failed to save heading:", error.message)
      return
    }
    setSavedHeading(true)
    setTimeout(() => setSavedHeading(false), 2000)
  }

  function openAdd() {
    setEditTarget(null)
    setEditOpen(true)
  }

  function openEdit(t: Testimonial) {
    setEditTarget(t)
    setEditOpen(true)
  }

  async function handleSave() {
    const isNew = !items.some((t) => t.id === form.id)
    const { error } = isNew
      ? await supabase.from("home_testimonials").insert(form)
      : await supabase.from("home_testimonials").update(form).eq("id", form.id)
    if (error) {
      console.error("Failed to save testimonial:", error.message)
      return
    }
    onChange(
      isNew ? [...items, form] : items.map((t) => (t.id === form.id ? form : t))
    )
    setEditOpen(false)
  }

  async function handleDelete(t: Testimonial) {
    const { error } = await supabase
      .from("home_testimonials")
      .delete()
      .eq("id", t.id)
    if (error) {
      console.error("Failed to delete testimonial:", error.message)
      return
    }
    onChange(items.filter((i) => i.id !== t.id))
    setDeleteTarget(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Heading</CardTitle>
          <CardDescription>The "Testimonials" section title.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <HeadingEditor
            label="Heading"
            value={content.testimonials_heading}
            onChange={(v) => setHeading("testimonials_heading", v)}
            rows={2}
          />
          <div className="flex items-center gap-3">
            <Button onClick={handleSaveHeading} disabled={savingHeading}>
              {savingHeading
                ? "Saving…"
                : savedHeading
                  ? "Saved!"
                  : "Save heading"}
            </Button>
            {savedHeading && (
              <Badge
                variant="outline"
                className="border-green-200 text-green-600"
              >
                Changes saved
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Testimonials</CardTitle>
            <CardDescription>
              Customer quotes shown in the scrolling carousel.
            </CardDescription>
          </div>
          <Button size="sm" onClick={openAdd}>
            <PlusIcon className="mr-1.5 size-3.5" />
            Add testimonial
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {items.map((t) => (
            <div
              key={t.id}
              className="flex items-start justify-between gap-4 rounded-lg border p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                  style={{ background: t.avatar_color }}
                >
                  {t.initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {t.name} — {t.meta}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t.quote}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                  <PencilIcon className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteTarget(t)}
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No testimonials yet.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Edit testimonial" : "Add testimonial"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Quote</Label>
              <Textarea
                rows={3}
                value={form.quote}
                onChange={(e) => setForm({ ...form, quote: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Meta line</Label>
                <Input
                  value={form.meta}
                  onChange={(e) => setForm({ ...form, meta: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Initials</Label>
                <Input
                  value={form.initials}
                  maxLength={2}
                  onChange={(e) =>
                    setForm({ ...form, initials: e.target.value.toUpperCase() })
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Avatar color</Label>
                <Input
                  type="color"
                  value={form.avatar_color}
                  onChange={(e) =>
                    setForm({ ...form, avatar_color: e.target.value })
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Card background</Label>
                <Input
                  type="color"
                  value={form.bg}
                  onChange={(e) => setForm({ ...form, bg: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.quote.trim() || !form.name.trim()}
            >
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
              Delete testimonial from "{deleteTarget?.name}"?
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
    </div>
  )
}
