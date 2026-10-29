import { useState, useEffect, useMemo } from "react"
import { CheckIcon, StarIcon, Trash2Icon, UndoIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import type { Tables } from "@/lib/supabase"

type Review = Tables<"product_reviews">

interface ReviewRow extends Review {
  authorName: string
  authorEmail: string
  productTitle: string
}

function Stars({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon
          key={n}
          className={`size-3.5 ${n <= value ? "fill-amber-400 text-amber-500" : "text-muted-foreground/40"}`}
        />
      ))}
    </span>
  )
}

export function Reviews() {
  const [rows, setRows] = useState<ReviewRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      const [{ data: reviews }, { data: subs }, { data: products }] =
        await Promise.all([
          supabase
            .from("product_reviews")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase.from("subscribers").select("id, name, email"),
          supabase.from("products").select("id, title"),
        ])
      const subMap = Object.fromEntries((subs ?? []).map((s) => [s.id, s]))
      const productMap = Object.fromEntries(
        (products ?? []).map((p) => [p.id, p.title])
      )
      setRows(
        (reviews ?? []).map((r) => ({
          ...r,
          authorName: subMap[r.subscriber_id]?.name ?? r.subscriber_id,
          authorEmail: subMap[r.subscriber_id]?.email ?? "",
          productTitle: productMap[r.product_id] ?? `#${r.product_id}`,
        }))
      )
      setLoading(false)
    }
    load()
  }, [])

  function withSaving(id: string, fn: () => Promise<void>) {
    setSaving((prev) => new Set(prev).add(id))
    return fn().finally(() =>
      setSaving((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    )
  }

  async function setApproved(id: string, approved: boolean) {
    await withSaving(id, async () => {
      const { error } = await supabase
        .from("product_reviews")
        .update({ approved })
        .eq("id", id)
      if (error) return
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, approved } : r)))
    })
  }

  async function remove(id: string) {
    await withSaving(id, async () => {
      const { error } = await supabase
        .from("product_reviews")
        .delete()
        .eq("id", id)
      if (error) return
      setRows((prev) => prev.filter((r) => r.id !== id))
    })
  }

  const pending = useMemo(() => rows.filter((r) => !r.approved), [rows])
  const approved = useMemo(() => rows.filter((r) => r.approved), [rows])

  function renderReview(r: ReviewRow) {
    return (
      <Card key={r.id}>
        <CardContent className="flex flex-col gap-2 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <Stars value={r.rating} />
              <span className="text-sm font-medium">{r.productTitle}</span>
            </div>
            <Badge variant={r.approved ? "default" : "secondary"}>
              {r.approved ? "approved" : "pending"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {r.authorName}
            {r.authorEmail && ` · ${r.authorEmail}`} ·{" "}
            {new Date(r.created_at).toLocaleString("lt-LT")}
          </p>
          {r.body && <p className="text-sm">{r.body}</p>}
          <div className="mt-1 flex gap-2">
            {r.approved ? (
              <Button
                size="sm"
                variant="outline"
                disabled={saving.has(r.id)}
                onClick={() => setApproved(r.id, false)}
              >
                <UndoIcon className="mr-1 size-3" />
                Unpublish
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={saving.has(r.id)}
                onClick={() => setApproved(r.id, true)}
              >
                <CheckIcon className="mr-1 size-3" />
                Approve
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              disabled={saving.has(r.id)}
              onClick={() => remove(r.id)}
            >
              <Trash2Icon className="mr-1 size-3" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reviews</h1>
        <p className="text-sm text-muted-foreground">
          Approve member ratings before they appear on product pages and the
          landing-page rating.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pt-4 pb-1">
            <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <span className="text-2xl font-bold text-amber-600">
              {pending.length}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pt-4 pb-1">
            <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Published
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <span className="text-2xl font-bold">{approved.length}</span>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <Tabs defaultValue="pending" className="flex flex-col gap-4">
          <TabsList className="w-fit">
            <TabsTrigger value="pending">
              Pending
              {pending.length > 0 && (
                <Badge variant="secondary" className="ml-1.5">
                  {pending.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="flex flex-col gap-3">
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No reviews waiting for approval.
              </p>
            ) : (
              pending.map(renderReview)
            )}
          </TabsContent>
          <TabsContent value="published" className="flex flex-col gap-3">
            {approved.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No published reviews yet.
              </p>
            ) : (
              approved.map(renderReview)
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
