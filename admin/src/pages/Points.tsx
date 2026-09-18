import { useState, useEffect, useMemo } from "react"
import { AwardIcon, SearchIcon } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { supabase } from "@/lib/supabase"
import type { Tables } from "@/lib/supabase"
import type { Database } from "@/lib/database.types"
import { planLabels, planColors, type Plan } from "@/data/subscribers"
import { DataTable, SortableHeader } from "@/components/DataTable"

type LeaderboardRow = Database["public"]["Views"]["leaderboard"]["Row"]
type Achievement = Tables<"achievements">
type UserAchievement = Tables<"user_achievements">

export function Points() {
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const [detailTarget, setDetailTarget] = useState<LeaderboardRow | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [unlocked, setUnlocked] = useState<UserAchievement[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase
        .from("leaderboard")
        .select("*")
        .order("rank", { ascending: true }),
      supabase.from("achievements").select("*"),
    ]).then(([{ data: lb }, { data: ach }]) => {
      setRows(lb ?? [])
      setAchievements(ach ?? [])
      setLoading(false)
    })
  }, [])

  const achievementMap = useMemo(
    () => Object.fromEntries(achievements.map((a) => [a.id, a])),
    [achievements]
  )

  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        (r.name ?? "").toLowerCase().includes(search.toLowerCase())
      ),
    [rows, search]
  )

  const totalMembers = rows.length
  const totalPointsAwarded = rows.reduce(
    (sum, r) => sum + (r.total_points ?? 0),
    0
  )
  const topScore = rows[0]?.total_points ?? 0

  function openDetail(row: LeaderboardRow) {
    if (!row.subscriber_id) return
    setDetailTarget(row)
    setDetailOpen(true)
    setDetailLoading(true)
    supabase
      .from("user_achievements")
      .select("*")
      .eq("subscriber_id", row.subscriber_id)
      .order("unlocked_at", { ascending: false })
      .then(({ data }) => {
        setUnlocked(data ?? [])
        setDetailLoading(false)
      })
  }

  // Cross-check: the leaderboard view's `total_points` should equal the sum
  // of points on the member's actually-unlocked achievements. A mismatch
  // means the view's fan-out/aggregation is off (this has happened before,
  // see 20260827000505_fix_leaderboard_point_fanout.sql).
  const detailSum = unlocked.reduce(
    (sum, ua) => sum + (achievementMap[ua.achievement_id]?.points ?? 0),
    0
  )
  const detailMismatch =
    detailTarget != null && detailSum !== (detailTarget.total_points ?? 0)

  const columns = useMemo<ColumnDef<LeaderboardRow>[]>(
    () => [
      {
        accessorKey: "rank",
        header: ({ column }) => (
          <SortableHeader column={column}>Rank</SortableHeader>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            {row.original.rank ? `#${row.original.rank}` : "–"}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <SortableHeader column={column}>Member</SortableHeader>
        ),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.name ?? "–"}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {row.original.subscriber_id}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "tier",
        header: "Plan",
        cell: ({ row }) =>
          row.original.tier ? (
            <Badge
              variant="outline"
              style={{
                borderColor: planColors[row.original.tier as Plan],
                color: planColors[row.original.tier as Plan],
              }}
            >
              {planLabels[row.original.tier as Plan] ?? row.original.tier}
            </Badge>
          ) : (
            "–"
          ),
      },
      {
        accessorKey: "achievement_count",
        header: ({ column }) => (
          <SortableHeader column={column}>Badges</SortableHeader>
        ),
        cell: ({ row }) => row.original.achievement_count ?? 0,
      },
      {
        accessorKey: "total_points",
        header: ({ column }) => (
          <SortableHeader column={column}>Points</SortableHeader>
        ),
        cell: ({ row }) => (
          <span className="font-semibold">
            {row.original.total_points ?? 0}
          </span>
        ),
      },
    ],
    []
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-2">
        <AwardIcon className="size-5" />
        <h1 className="text-xl font-semibold">Points</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ranked members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total points awarded
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPointsAwarded}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Top score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topScore}</div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search members…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <DataTable
              columns={columns}
              data={filtered}
              onRowClick={openDetail}
            />
          )}
        </CardContent>
      </Card>

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{detailTarget?.name ?? "Member"}</SheetTitle>
            <SheetDescription>
              Unlocked achievements and point breakdown for this member.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 px-4 pb-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  Leaderboard total
                </p>
                <p className="text-xl font-bold">
                  {detailTarget?.total_points ?? 0}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  Sum of unlocked badges
                </p>
                <p
                  className={
                    detailMismatch
                      ? "text-xl font-bold text-destructive"
                      : "text-xl font-bold"
                  }
                >
                  {detailSum}
                </p>
              </div>
            </div>
            {detailMismatch && (
              <p className="text-xs text-destructive">
                Mismatch — the leaderboard total doesn't match the sum of this
                member's unlocked achievement points. The leaderboard view may
                need investigating.
              </p>
            )}

            {detailLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : unlocked.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No achievements unlocked yet.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {unlocked.map((ua) => {
                  const def = achievementMap[ua.achievement_id]
                  return (
                    <div
                      key={ua.achievement_id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{def?.icon ?? "🏅"}</span>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {def?.label ?? ua.achievement_id}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {ua.unlocked_at
                              ? new Date(ua.unlocked_at).toLocaleDateString()
                              : "–"}
                          </span>
                        </div>
                      </div>
                      <Badge variant="secondary">+{def?.points ?? 0}</Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
