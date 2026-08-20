import { useState, useEffect, useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { CheckIcon, XIcon, EyeOffIcon, EyeIcon, FlagIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import type { Tables } from "@/lib/supabase"
import { DataTable, SortableHeader } from "@/components/DataTable"

type FeedItem = Tables<"feed_items">
type Report = Tables<"reports">

interface SubscriberRef {
  name: string
  email: string
}

interface FeedItemRow extends FeedItem {
  subscriberName: string
  subscriberEmail: string
}

interface ReportRow extends Report {
  reporterName: string
  feedItem: FeedItem | null
  authorName: string
}

export function Community() {
  const [feedItems, setFeedItems] = useState<FeedItemRow[]>([])
  const [reports, setReports] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Set<string>>(new Set())

  async function load() {
    setLoading(true)
    const [{ data: items }, { data: reportRows }, { data: subs }] =
      await Promise.all([
        supabase
          .from("feed_items")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("reports")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("subscribers").select("id, name, email"),
      ])

    const subMap = Object.fromEntries(
      (subs ?? []).map((s) => [s.id, s as SubscriberRef])
    )
    const itemsList = items ?? []
    const itemMap = Object.fromEntries(itemsList.map((i) => [i.id, i]))

    setFeedItems(
      itemsList.map((i) => ({
        ...i,
        subscriberName: subMap[i.subscriber_id]?.name ?? i.subscriber_id,
        subscriberEmail: subMap[i.subscriber_id]?.email ?? "",
      }))
    )

    setReports(
      (reportRows ?? []).map((r) => {
        const feedItem = itemMap[r.feed_item_id] ?? null
        return {
          ...r,
          reporterName: subMap[r.reporter_id]?.name ?? r.reporter_id,
          feedItem,
          authorName: feedItem
            ? (subMap[feedItem.subscriber_id]?.name ?? feedItem.subscriber_id)
            : "—",
        }
      })
    )
    setLoading(false)
  }

  useEffect(() => {
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

  async function setPhotoStatus(id: string, status: "approved" | "rejected") {
    await withSaving(id, async () => {
      await supabase.from("feed_items").update({ status }).eq("id", id)
      setFeedItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status } : i))
      )
    })
  }

  async function toggleHidden(id: string, hidden: boolean) {
    await withSaving(id, async () => {
      await supabase
        .from("feed_items")
        .update({ is_hidden: hidden })
        .eq("id", id)
      setFeedItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, is_hidden: hidden } : i))
      )
    })
  }

  async function resolveReport(
    id: string,
    status: "resolved" | "dismissed",
    hideContent: boolean,
    feedItemId?: string
  ) {
    await withSaving(id, async () => {
      if (hideContent && feedItemId) {
        await supabase
          .from("feed_items")
          .update({ is_hidden: true })
          .eq("id", feedItemId)
        setFeedItems((prev) =>
          prev.map((i) => (i.id === feedItemId ? { ...i, is_hidden: true } : i))
        )
      }
      await supabase
        .from("reports")
        .update({ status, resolved_at: new Date().toISOString() })
        .eq("id", id)
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      )
    })
  }

  const pendingPhotos = useMemo(
    () =>
      feedItems.filter(
        (i) => i.type === "build_photo" && i.status === "pending"
      ),
    [feedItems]
  )
  const openReports = useMemo(
    () => reports.filter((r) => r.status === "open"),
    [reports]
  )

  const feedColumns: ColumnDef<FeedItemRow>[] = [
    {
      accessorKey: "subscriberName",
      header: ({ column }) => (
        <SortableHeader column={column}>Subscriber</SortableHeader>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {row.original.subscriberName}
          </span>
          <span className="text-xs text-muted-foreground">
            {row.original.subscriberEmail}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => <Badge variant="outline">{row.original.type}</Badge>,
    },
    {
      accessorKey: "body",
      header: "Content",
      cell: ({ row }) => (
        <span className="line-clamp-2 max-w-xs text-sm text-muted-foreground">
          {row.original.body || (row.original.image_url ? "(photo)" : "—")}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === "approved"
              ? "default"
              : row.original.status === "pending"
                ? "secondary"
                : "destructive"
          }
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "is_hidden",
      header: "Hidden",
      cell: ({ row }) =>
        row.original.is_hidden ? (
          <Badge variant="destructive">Hidden</Badge>
        ) : null,
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <SortableHeader column={column}>Created</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.original.created_at).toLocaleDateString("lt-LT")}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          disabled={saving.has(row.original.id)}
          onClick={() => toggleHidden(row.original.id, !row.original.is_hidden)}
        >
          {row.original.is_hidden ? (
            <EyeIcon className="size-4" />
          ) : (
            <EyeOffIcon className="size-4" />
          )}
        </Button>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Community</h1>
        <p className="text-sm text-muted-foreground">
          Moderate build photos, reports and the activity feed.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pt-4 pb-1">
            <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Pending photos
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <span className="text-2xl font-bold text-amber-600">
              {pendingPhotos.length}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pt-4 pb-1">
            <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Open reports
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <span className="text-2xl font-bold text-destructive">
              {openReports.length}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pt-4 pb-1">
            <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Total posts
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <span className="text-2xl font-bold">{feedItems.length}</span>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <Tabs defaultValue="photos" className="flex flex-col gap-4">
          <TabsList className="w-fit">
            <TabsTrigger value="photos">
              Photo review
              {pendingPhotos.length > 0 && (
                <Badge variant="secondary" className="ml-1.5">
                  {pendingPhotos.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reports">
              Reports
              {openReports.length > 0 && (
                <Badge variant="secondary" className="ml-1.5">
                  {openReports.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="feed">All posts</TabsTrigger>
          </TabsList>

          <TabsContent value="photos">
            {pendingPhotos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No photos waiting for review.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pendingPhotos.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt=""
                        className="aspect-video w-full object-cover"
                      />
                    )}
                    <CardContent className="flex flex-col gap-2 pt-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {item.subscriberName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.subscriberEmail}
                        </span>
                      </div>
                      {item.body && (
                        <p className="text-sm text-muted-foreground">
                          {item.body}
                        </p>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleString("lt-LT")}
                      </span>
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          disabled={saving.has(item.id)}
                          onClick={() => setPhotoStatus(item.id, "approved")}
                        >
                          <CheckIcon className="mr-1 size-3" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          disabled={saving.has(item.id)}
                          onClick={() => setPhotoStatus(item.id, "rejected")}
                        >
                          <XIcon className="mr-1 size-3" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reports">
            {reports.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reports yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {reports.map((r) => (
                  <Card key={r.id}>
                    <CardContent className="flex flex-col gap-2 pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FlagIcon className="size-4 text-destructive" />
                          <span className="text-sm font-medium">
                            Reported by {r.reporterName}
                          </span>
                        </div>
                        <Badge
                          variant={
                            r.status === "open"
                              ? "secondary"
                              : r.status === "resolved"
                                ? "default"
                                : "outline"
                          }
                        >
                          {r.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Post by {r.authorName} ·{" "}
                        {new Date(r.created_at).toLocaleString("lt-LT")}
                      </p>
                      {r.feedItem?.body && (
                        <blockquote className="border-l-2 pl-3 text-sm text-muted-foreground italic">
                          {r.feedItem.body}
                        </blockquote>
                      )}
                      {r.feedItem?.image_url && (
                        <img
                          src={r.feedItem.image_url}
                          alt=""
                          className="max-h-40 w-fit rounded-md object-cover"
                        />
                      )}
                      {r.feedItem?.is_hidden && (
                        <Badge variant="destructive" className="w-fit">
                          Content hidden
                        </Badge>
                      )}
                      {r.status === "open" && (
                        <div className="mt-2 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            disabled={saving.has(r.id)}
                            onClick={() =>
                              resolveReport(
                                r.id,
                                "resolved",
                                true,
                                r.feed_item_id
                              )
                            }
                          >
                            <EyeOffIcon className="mr-1 size-3" />
                            Hide post &amp; resolve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={saving.has(r.id)}
                            onClick={() =>
                              resolveReport(r.id, "dismissed", false)
                            }
                          >
                            Dismiss
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="feed">
            <DataTable columns={feedColumns} data={feedItems} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
