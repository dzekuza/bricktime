import { useState, useEffect, useMemo, useRef } from "react"
import {
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  FlagIcon,
  UsersIcon,
  UploadIcon,
  XIcon,
  Loader2Icon,
} from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
import type { Tables } from "@/lib/supabase"
import { DataTable, SortableHeader } from "@/components/DataTable"

type Challenge = Tables<"challenges">
type ChallengeCompletion = Tables<"challenge_completions">

type ChallengeMetric = Challenge["metric"]

type ChallengeForm = {
  title: string
  description: string
  metric: ChallengeMetric
  target_value: string
  reward_label: string
  reward_image_url: string | null
  starts_at: string
  ends_at: string
  is_active: boolean
}

async function uploadRewardImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop()
  const path = `challenge-rewards/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage
    .from("site-content")
    .upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from("site-content").getPublicUrl(path)
  return data.publicUrl
}

interface ProgressRow {
  subscriberId: string
  name: string
  progress: number
  completion: ChallengeCompletion | null
}

const METRICS: { value: ChallengeMetric; label: string }[] = [
  { value: "checkins", label: "Check-ins" },
  { value: "checkin_streak", label: "Check-in streak (consecutive days)" },
  { value: "comments_written", label: "Comments written" },
  { value: "photos_shared", label: "Photos shared (approved)" },
  { value: "likes_received", label: "Likes received" },
  { value: "membership_days", label: "Membership age (days)" },
]

function toDatetimeLocal(iso: string): string {
  return iso.slice(0, 16)
}

const emptyForm = (): ChallengeForm => {
  const now = new Date()
  const inMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  return {
    title: "",
    description: "",
    metric: "likes_received",
    target_value: "20",
    reward_label: "",
    reward_image_url: null,
    starts_at: toDatetimeLocal(now.toISOString()),
    ends_at: toDatetimeLocal(inMonth.toISOString()),
    is_active: true,
  }
}

function challengeToForm(c: Challenge): ChallengeForm {
  return {
    title: c.title,
    description: c.description ?? "",
    metric: c.metric,
    target_value: String(c.target_value),
    reward_label: c.reward_label ?? "",
    reward_image_url: c.reward_image_url,
    starts_at: toDatetimeLocal(c.starts_at),
    ends_at: toDatetimeLocal(c.ends_at),
    is_active: c.is_active,
  }
}

export function Challenges() {
  const [items, setItems] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Challenge | null>(null)
  const [form, setForm] = useState<ChallengeForm>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Challenge | null>(null)

  const [progressTarget, setProgressTarget] = useState<Challenge | null>(null)
  const [progressRows, setProgressRows] = useState<ProgressRow[]>([])
  const [progressLoading, setProgressLoading] = useState(false)
  const [granting, setGranting] = useState<Set<string>>(new Set())
  const [rewardImageUploading, setRewardImageUploading] = useState(false)
  const rewardImageInputRef = useRef<HTMLInputElement>(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from("challenges")
      .select("*")
      .order("starts_at", { ascending: false })
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

  function openEdit(challenge: Challenge) {
    setEditTarget(challenge)
    setForm(challengeToForm(challenge))
    setDialogOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        metric: form.metric,
        target_value: parseInt(form.target_value),
        reward_label: form.reward_label.trim() || null,
        reward_image_url: form.reward_image_url,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: new Date(form.ends_at).toISOString(),
        is_active: form.is_active,
      }
      if (editTarget) {
        await supabase
          .from("challenges")
          .update(payload)
          .eq("id", editTarget.id)
      } else {
        await supabase.from("challenges").insert(payload)
      }
      setDialogOpen(false)
      load()
    } catch (err) {
      console.error("Failed to save challenge:", err)
    } finally {
      setSaving(false)
    }
  }

  async function handleRewardImageFile(file: File) {
    setRewardImageUploading(true)
    try {
      const url = await uploadRewardImage(file)
      setForm((f) => ({ ...f, reward_image_url: url }))
    } finally {
      setRewardImageUploading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await supabase.from("challenges").delete().eq("id", deleteTarget.id)
      setDeleteTarget(null)
      load()
    } catch (err) {
      console.error("Failed to delete challenge:", err)
    }
  }

  // No trigger auto-computes challenge progress (unlike achievements) — it's
  // recomputed live from feed_items/feed_likes each time an admin opens a
  // challenge, since completion/reward is a manual admin decision, not an
  // automatic grant.
  async function openParticipants(challenge: Challenge) {
    setProgressTarget(challenge)
    setProgressLoading(true)
    try {
      const [{ data: subs }, { data: completions }] = await Promise.all([
        supabase.from("subscribers").select("id, name, joined_at"),
        supabase
          .from("challenge_completions")
          .select("*")
          .eq("challenge_id", challenge.id),
      ])

      const completionMap = new Map(
        (completions ?? []).map((c) => [c.subscriber_id, c])
      )

      const counts = await countByMetric(challenge)

      const rows: ProgressRow[] = (subs ?? [])
        .map((s) => ({
          subscriberId: s.id,
          name: s.name,
          progress: counts.get(s.id) ?? 0,
          completion: completionMap.get(s.id) ?? null,
        }))
        .filter((r) => r.progress > 0 || r.completion)
        .sort((a, b) => b.progress - a.progress)

      setProgressRows(rows)
    } finally {
      setProgressLoading(false)
    }
  }

  async function countByMetric(
    challenge: Challenge
  ): Promise<Map<string, number>> {
    const counts = new Map<string, number>()
    const bump = (id: string, by = 1) =>
      counts.set(id, (counts.get(id) ?? 0) + by)

    if (challenge.metric === "likes_received") {
      const [{ data: allItems }, { data: likes }] = await Promise.all([
        supabase.from("feed_items").select("id, subscriber_id"),
        supabase
          .from("feed_likes")
          .select("feed_item_id, created_at")
          .gte("created_at", challenge.starts_at)
          .lte("created_at", challenge.ends_at),
      ])
      const ownerMap = new Map(
        (allItems ?? []).map((i) => [i.id, i.subscriber_id])
      )
      for (const like of likes ?? []) {
        const owner = ownerMap.get(like.feed_item_id)
        if (owner) bump(owner)
      }
      return counts
    }

    if (challenge.metric === "membership_days") {
      const { data: subs } = await supabase
        .from("subscribers")
        .select("id, joined_at")
      const now = Date.now()
      for (const s of subs ?? []) {
        if (!s.joined_at) continue
        const days = Math.floor(
          (now - new Date(s.joined_at).getTime()) / (1000 * 60 * 60 * 24)
        )
        counts.set(s.id, days)
      }
      return counts
    }

    const typeForMetric: Record<string, string> = {
      checkins: "checkin",
      checkin_streak: "checkin",
      comments_written: "comment",
      photos_shared: "build_photo",
    }
    const type = typeForMetric[challenge.metric]
    let query = supabase
      .from("feed_items")
      .select("subscriber_id, created_at")
      .eq("type", type)
      .gte("created_at", challenge.starts_at)
      .lte("created_at", challenge.ends_at)
    if (challenge.metric === "photos_shared") {
      query = query.eq("status", "approved")
    }
    const { data: rows } = await query

    if (challenge.metric !== "checkin_streak") {
      for (const row of rows ?? []) bump(row.subscriber_id)
      return counts
    }

    // Longest run of distinct calendar days with a checkin, within the window.
    const daysBySubscriber = new Map<string, Set<string>>()
    for (const row of rows ?? []) {
      const day = row.created_at.slice(0, 10)
      const set = daysBySubscriber.get(row.subscriber_id) ?? new Set<string>()
      set.add(day)
      daysBySubscriber.set(row.subscriber_id, set)
    }
    for (const [subscriberId, days] of daysBySubscriber) {
      const sorted = [...days].sort()
      let longest = 1
      let current = 1
      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1])
        const cur = new Date(sorted[i])
        const diffDays = Math.round(
          (cur.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
        )
        current = diffDays === 1 ? current + 1 : 1
        longest = Math.max(longest, current)
      }
      counts.set(subscriberId, longest)
    }
    return counts
  }

  async function markComplete(subscriberId: string) {
    if (!progressTarget) return
    setGranting((prev) => new Set(prev).add(subscriberId))
    try {
      const { data } = await supabase
        .from("challenge_completions")
        .upsert(
          {
            challenge_id: progressTarget.id,
            subscriber_id: subscriberId,
            reward_granted: true,
          },
          { onConflict: "challenge_id,subscriber_id" }
        )
        .select()
        .single()

      if (data) {
        setProgressRows((prev) =>
          prev.map((r) =>
            r.subscriberId === subscriberId ? { ...r, completion: data } : r
          )
        )
      }
    } catch (err) {
      console.error("Failed to grant challenge reward:", err)
    } finally {
      setGranting((prev) => {
        const next = new Set(prev)
        next.delete(subscriberId)
        return next
      })
    }
  }

  const columns = useMemo<ColumnDef<Challenge>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => (
          <SortableHeader column={column}>Title</SortableHeader>
        ),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.title}</span>
            {row.original.reward_label && (
              <span className="text-xs text-muted-foreground">
                {row.original.reward_label}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "metric",
        header: "Goal",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.metric} ≥ {row.original.target_value}
          </span>
        ),
      },
      {
        accessorKey: "starts_at",
        header: "Window",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {new Date(row.original.starts_at).toLocaleDateString("lt-LT")} –{" "}
            {new Date(row.original.ends_at).toLocaleDateString("lt-LT")}
          </span>
        ),
      },
      {
        accessorKey: "is_active",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.is_active ? "default" : "outline"}>
            {row.original.is_active ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              title="Participants & progress"
              onClick={() => openParticipants(row.original)}
            >
              <UsersIcon className="size-4" />
            </Button>
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
          <FlagIcon className="size-5" />
          <h1 className="text-xl font-semibold">Challenges</h1>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon className="size-4" />
          New Challenge
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Time-boxed goals</CardTitle>
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
              {editTarget ? "Edit Challenge" : "New Challenge"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="Surink 20 patinka per mėnesį"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Įkelk statybą ir surink 20 patinka iki mėnesio pabaigos"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Metric</Label>
                <Select
                  value={form.metric}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, metric: v as ChallengeMetric }))
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
                <Label>Target</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.target_value}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, target_value: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>
                Reward{" "}
                <span className="text-xs text-muted-foreground">
                  (shown to members; granted manually, not automatically)
                </span>
              </Label>
              <Input
                value={form.reward_label}
                onChange={(e) =>
                  setForm((f) => ({ ...f, reward_label: e.target.value }))
                }
                placeholder="+50 taškų"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>
                Reward image{" "}
                <span className="text-xs text-muted-foreground">
                  (optional — shown to members alongside the reward)
                </span>
              </Label>
              {form.reward_image_url ? (
                <div className="flex items-center gap-3">
                  <img
                    src={form.reward_image_url}
                    alt="Reward"
                    className="size-16 rounded-lg border object-cover"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setForm((f) => ({ ...f, reward_image_url: null }))
                    }
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
                  disabled={rewardImageUploading}
                  onClick={() => rewardImageInputRef.current?.click()}
                >
                  {rewardImageUploading ? (
                    <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />
                  ) : (
                    <UploadIcon className="mr-1.5 size-3.5" />
                  )}
                  {rewardImageUploading ? "Uploading…" : "Upload image"}
                </Button>
              )}
              <input
                ref={rewardImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ""
                  if (file) handleRewardImageFile(file)
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Starts</Label>
                <Input
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, starts_at: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Ends</Label>
                <Input
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ends_at: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, is_active: checked }))
                }
              />
              <Label>Active</Label>
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
                !form.title.trim() ||
                !form.target_value ||
                !form.starts_at ||
                !form.ends_at
              }
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!progressTarget}
        onOpenChange={(open) => !open && setProgressTarget(null)}
      >
        <DialogContent className="max-h-[70vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{progressTarget?.title} — progress</DialogTitle>
          </DialogHeader>
          {progressLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : progressRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No activity within this challenge's window yet.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {progressRows.map((row) => (
                <div
                  key={row.subscriberId}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{row.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {row.progress} / {progressTarget?.target_value}
                    </span>
                  </div>
                  {row.completion ? (
                    <Badge>Rewarded</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={
                        granting.has(row.subscriberId) ||
                        row.progress < (progressTarget?.target_value ?? 0)
                      }
                      onClick={() => markComplete(row.subscriberId)}
                    >
                      Mark complete &amp; reward
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete challenge?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <strong>{deleteTarget?.title}</strong> and any completion records
              for it. This cannot be undone.
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
