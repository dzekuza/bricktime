import { useEffect, useState } from "react"
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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

type FaqItem = Tables<"faq_items">

interface FaqQuestionsTabProps {
  items: FaqItem[]
  onChange: (items: FaqItem[]) => void
}

function blank(sortOrder: number): FaqItem {
  return {
    id: crypto.randomUUID(),
    question: "",
    answer: "",
    sort_order: sortOrder,
    updated_at: new Date(0).toISOString(),
  }
}

export function FaqQuestionsTab({ items, onChange }: FaqQuestionsTabProps) {
  const [editTarget, setEditTarget] = useState<FaqItem | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<FaqItem | null>(null)
  const [form, setForm] = useState<FaqItem>(blank(items.length))

  useEffect(() => {
    if (editOpen) setForm(editTarget ?? blank(items.length))
  }, [editOpen, editTarget, items.length])

  function openAdd() {
    setEditTarget(null)
    setEditOpen(true)
  }

  function openEdit(item: FaqItem) {
    setEditTarget(item)
    setEditOpen(true)
  }

  async function handleSaveItem() {
    const isNew = !items.some((i) => i.id === form.id)
    const { error } = isNew
      ? await supabase.from("faq_items").insert(form)
      : await supabase.from("faq_items").update(form).eq("id", form.id)
    if (error) {
      console.error("Failed to save FAQ item:", error.message)
      return
    }
    onChange(
      isNew ? [...items, form] : items.map((i) => (i.id === form.id ? form : i))
    )
    setEditOpen(false)
  }

  async function handleDelete(item: FaqItem) {
    const { error } = await supabase
      .from("faq_items")
      .delete()
      .eq("id", item.id)
    if (error) {
      console.error("Failed to delete FAQ item:", error.message)
      return
    }
    onChange(items.filter((i) => i.id !== item.id))
    setDeleteTarget(null)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>FAQ questions</CardTitle>
          <CardDescription>
            Shared accordion content — reused on Home, Subscribe, and the /help
            FAQ page. Editing here updates it everywhere at once.
          </CardDescription>
        </div>
        <Button size="sm" onClick={openAdd}>
          <PlusIcon className="mr-1.5 size-3.5" />
          Add question
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between gap-4 rounded-lg border p-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{item.question}</p>
              <p className="truncate text-xs text-muted-foreground">
                {item.answer}
              </p>
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
            No questions yet.
          </p>
        )}
      </CardContent>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Edit question" : "Add question"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Question</Label>
              <Input
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Answer</Label>
              <Textarea
                rows={4}
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveItem}
              disabled={!form.question.trim() || !form.answer.trim()}
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
              Delete "{deleteTarget?.question}"?
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
