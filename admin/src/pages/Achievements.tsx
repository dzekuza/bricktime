import { useState, useEffect, useMemo } from "react"
import { PlusIcon, PencilIcon, Trash2Icon, TrophyIcon } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { supabase } from "@/lib/supabase"
import type { Tables, Enums } from "@/lib/supabase"
import { DataTable, SortableHeader } from "@/components/DataTable"

type Achievement = Tables<"achievements">
type AchievementCategory = Enums<"achievement_category">

type AchievementMetric =
  | "none"
  | "checkins"
  | "checkin_streak"
  | "comments_written"
  | "photos_shared"
  | "likes_received"
  | "membership_days"

type AchievementForm = {
  id: string
  label: string
  description: string
  points: string
  category: AchievementCategory
  icon: string
  color: string
  metric: AchievementMetric
  threshold: string
}

const CATEGORIES: AchievementCategory[] = [
  "activity",
  "social",
  "collector",
  "loyalty",
]

const METRICS: { value: AchievementMetric; label: string }[] = [
  { value: "none", label: "None (manual award only)" },
  { value: "checkins", label: "Check-ins (total)" },
  { value: "checkin_streak", label: "Check-in streak (consecutive days)" },
  { value: "comments_written", label: "Comments written" },
  { value: "photos_shared", label: "Photos shared (approved)" },
  { value: "likes_received", label: "Likes received (across all photos)" },
  { value: "membership_days", label: "Membership age (days)" },
]

const emptyForm = (): AchievementForm => ({
  id: "",
  label: "",
  description: "",
  points: "",
  category: "activity",
  icon: "",
  color: "#5C4ADE",
  metric: "none",
  threshold: "",
})

function achievementToForm(a: Achievement): AchievementForm {
  return {
    id: a.id,
    label: a.label,
    description: a.description,
    points: String(a.points),
    category: a.category,
    icon: a.icon,
    color: a.color,
    metric: (a.metric as AchievementMetric | null) ?? "none",
    threshold: a.threshold ? String(a.threshold) : "",
  }
}

function slugify(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

export function Achievements() {
  const [items, setItems] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Achievement | null>(null)
  const [form, setForm] = useState<AchievementForm>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Achievement | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from("achievements")
      .select("*")
      .order("points", { ascending: true })
    setItems(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  function openCreate() {
    setEditTarget(null)
    setForm(emptyForm())
    setDialogOpen(true)
  }

  function openEdit(achievement: Achievement) {
    setEditTarget(achievement)
    setForm(achievementToForm(achievement))
    setDialogOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        label: form.label.trim(),
        description: form.description.trim(),
        points: parseInt(form.points),
        category: form.category,
        icon: form.icon.trim(),
        color: form.color,
        metric: form.metric === "none" ? null : form.metric,
        threshold:
          form.metric === "none" || !form.threshold
            ? null
            : parseInt(form.threshold),
      }
      if (editTarget) {
        await supabase
          .from("achievements")
          .update(payload)
          .eq("id", editTarget.id)
      } else {
        await supabase
          .from("achievements")
          .insert({ ...payload, id: form.id.trim() })
      }
      setDialogOpen(false)
      load()
    } catch (err) {
      console.error("Failed to save achievement:", err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await supabase.from("achievements").delete().eq("id", deleteTarget.id)
      setDeleteTarget(null)
      load()
    } catch (err) {
      console.error("Failed to delete achievement:", err)
    }
  }

  const columns = useMemo<ColumnDef<Achievement>[]>(
    () => [
      {
        id: "icon",
        header: "",
        cell: ({ row }) => <span className="text-xl">{row.original.icon}</span>,
      },
      {
        accessorKey: "label",
        header: ({ column }) => (
          <SortableHeader column={column}>Label</SortableHeader>
        ),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.label}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {row.original.id}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.category}</Badge>
        ),
      },
      {
        accessorKey: "points",
        header: ({ column }) => (
          <SortableHeader column={column}>Points</SortableHeader>
        ),
        cell: ({ row }) => `+${row.original.points}`,
      },
      {
        accessorKey: "metric",
        header: "Unlock",
        cell: ({ row }) =>
          row.original.metric ? (
            <span className="text-xs text-muted-foreground">
              {row.original.metric} ≥ {row.original.threshold}
            </span>
          ) : (
            <Badge variant="secondary">Manual</Badge>
          ),
      },
      {
        accessorKey: "color",
        header: "Color",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span
              className="size-4 rounded-full border border-border"
              style={{ background: row.original.color }}
            />
            <span className="font-mono text-xs text-muted-foreground">
              {row.original.color}
            </span>
          </div>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openEdit(row.original)}
            >
              <PencilIcon className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteTarget(row.original)}
            >
              <Trash2Icon className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    []
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrophyIcon className="size-5" />
          <h1 className="text-xl font-semibold">Rewards</h1>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon className="size-4" />
          New Achievement
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Achievement Catalog</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <DataTable columns={columns} data={items} />
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Edit Achievement" : "New Achievement"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Label</Label>
              <Input
                value={form.label}
                onChange={(e) => {
                  const label = e.target.value
                  setForm((f) => ({
                    ...f,
                    label,
                    id: editTarget ? f.id : slugify(label),
                  }))
                }}
                placeholder="Kasdienė apsilankymas"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>
                Id{" "}
                <span className="text-xs text-muted-foreground">
                  (slug, used as the primary key)
                </span>
              </Label>
              <Input
                value={form.id}
                onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
                placeholder="daily_checkin"
                className="font-mono"
                disabled={!!editTarget}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Aplankyk puslapį bet kurią dieną"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      category: v as AchievementCategory,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Points</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.points}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, points: e.target.value }))
                  }
                  placeholder="10"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>
                  Auto-unlock metric{" "}
                  <span className="text-xs text-muted-foreground">
                    (evaluated from real activity)
                  </span>
                </Label>
                <Select
                  value={form.metric}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, metric: v as AchievementMetric }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METRICS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Threshold</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.threshold}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, threshold: e.target.value }))
                  }
                  placeholder="10"
                  disabled={form.metric === "none"}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>
                  Icon{" "}
                  <span className="text-xs text-muted-foreground">(emoji)</span>
                </Label>
                <Input
                  value={form.icon}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, icon: e.target.value }))
                  }
                  placeholder="🔥"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, color: e.target.value }))
                    }
                    className="size-9 shrink-0 cursor-pointer rounded-md border border-input"
                  />
                  <Input
                    value={form.color}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, color: e.target.value }))
                    }
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                saving ||
                !form.id.trim() ||
                !form.label.trim() ||
                !form.points ||
                (form.metric !== "none" && !form.threshold)
              }
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete achievement?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <strong>{deleteTarget?.label}</strong>. Any subscribers who
              unlocked it will lose the record. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
