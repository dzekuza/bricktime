import { useEffect, useState } from "react"
import { MousePointerClickIcon, EyeIcon, UsersIcon, TargetIcon } from "lucide-react"
import { Line, LineChart, CartesianGrid, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { DataTable } from "@/components/DataTable"
import { supabase } from "@/lib/supabase"
import type { ColumnDef } from "@tanstack/react-table"

interface GaData {
  totals: { sessions: number; users: number; conversions: number }
  series: { date: string; sessions: number; users: number }[]
}

interface GscRow {
  query?: string
  page?: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

interface GscData {
  totals: { clicks: number; impressions: number; ctr: number; position: number }
  series: { date: string; clicks: number; impressions: number }[]
  topQueries: GscRow[]
  topPages: GscRow[]
}

interface AnalyticsResponse {
  ga: GaData | null
  gaError: string | null
  gsc: GscData | null
  gscError: string | null
  error?: string
}

const gaChartConfig = {
  sessions: { label: "Sesijos", color: "var(--chart-1)" },
  users: { label: "Vartotojai", color: "var(--chart-2)" },
} satisfies ChartConfig

const gscChartConfig = {
  clicks: { label: "Paspaudimai", color: "var(--chart-1)" },
  impressions: { label: "Rodymai", color: "var(--chart-3)" },
} satisfies ChartConfig

const queryColumns: ColumnDef<GscRow>[] = [
  { accessorKey: "query", header: "Užklausa" },
  { accessorKey: "clicks", header: "Paspaudimai" },
  { accessorKey: "impressions", header: "Rodymai" },
  {
    accessorKey: "ctr",
    header: "CTR",
    cell: ({ row }) => `${(row.original.ctr * 100).toFixed(1)}%`,
  },
  {
    accessorKey: "position",
    header: "Pozicija",
    cell: ({ row }) => row.original.position.toFixed(1),
  },
]

const pageColumns: ColumnDef<GscRow>[] = [
  {
    accessorKey: "page",
    header: "Puslapis",
    cell: ({ row }) => (
      <span className="max-w-md truncate block">{row.original.page}</span>
    ),
  },
  { accessorKey: "clicks", header: "Paspaudimai" },
  { accessorKey: "impressions", header: "Rodymai" },
  {
    accessorKey: "ctr",
    header: "CTR",
    cell: ({ row }) => `${(row.original.ctr * 100).toFixed(1)}%`,
  },
]

function formatDate(dateStr: string) {
  // GA4/GSC return dates as YYYYMMDD or YYYY-MM-DD
  const normalized = dateStr.includes("-")
    ? dateStr
    : `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
  return new Date(normalized).toLocaleDateString("lt-LT", { month: "short", day: "numeric" })
}

export function Analytics() {
  const [days, setDays] = useState("28")
  const [data, setData] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      const { data: result, error: invokeError } = await supabase.functions.invoke<AnalyticsResponse>(
        "get-analytics",
        { body: { days: Number(days) } }
      )
      if (cancelled) return
      if (invokeError) {
        setError(invokeError.message)
      } else if (result?.error) {
        setError(result.error)
      } else {
        setData(result ?? null)
      }
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [days])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analitika</h1>
          <p className="text-muted-foreground text-sm">
            Srautas ir paieškos rezultatai iš Google Analytics ir Search Console
          </p>
        </div>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Paskutinės 7 d.</SelectItem>
            <SelectItem value="28">Paskutinės 28 d.</SelectItem>
            <SelectItem value="90">Paskutinės 90 d.</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Nepavyko įkelti duomenų</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!error && data?.gaError && (
        <Alert variant="destructive">
          <AlertTitle>Google Analytics</AlertTitle>
          <AlertDescription>{data.gaError}</AlertDescription>
        </Alert>
      )}

      {!error && data?.gscError && (
        <Alert variant="destructive">
          <AlertTitle>Search Console</AlertTitle>
          <AlertDescription>{data.gscError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Sesijos"
          value={data?.ga?.totals.sessions}
          icon={UsersIcon}
          loading={loading}
        />
        <StatCard
          label="Konversijos"
          value={data?.ga?.totals.conversions}
          icon={TargetIcon}
          loading={loading}
        />
        <StatCard
          label="Paspaudimai (GSC)"
          value={data?.gsc?.totals.clicks}
          icon={MousePointerClickIcon}
          loading={loading}
        />
        <StatCard
          label="Rodymai (GSC)"
          value={data?.gsc?.totals.impressions}
          icon={EyeIcon}
          loading={loading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Srautas</CardTitle>
            <CardDescription>Sesijos ir vartotojai per laikotarpį</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : data?.ga ? (
              <ChartContainer config={gaChartConfig} className="h-[250px] w-full">
                <LineChart data={data.ga.series}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={24}
                  />
                  <ChartTooltip content={<ChartTooltipContent labelFormatter={(label) => formatDate(String(label))} />} />
                  <Line dataKey="sessions" stroke="var(--color-sessions)" strokeWidth={2} dot={false} />
                  <Line dataKey="users" stroke="var(--color-users)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Nėra duomenų</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Paieška</CardTitle>
            <CardDescription>Paspaudimai ir rodymai iš Google paieškos</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : data?.gsc ? (
              <ChartContainer config={gscChartConfig} className="h-[250px] w-full">
                <LineChart data={data.gsc.series}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={24}
                  />
                  <ChartTooltip content={<ChartTooltipContent labelFormatter={(label) => formatDate(String(label))} />} />
                  <Line dataKey="clicks" stroke="var(--color-clicks)" strokeWidth={2} dot={false} />
                  <Line dataKey="impressions" stroke="var(--color-impressions)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Nėra duomenų</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Populiariausios užklausos</CardTitle>
            <CardDescription>Top 10 paieškos frazių pagal paspaudimus</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <DataTable columns={queryColumns} data={data?.gsc?.topQueries ?? []} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Populiariausi puslapiai</CardTitle>
            <CardDescription>Top 10 puslapių pagal paspaudimus</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <DataTable columns={pageColumns} data={data?.gsc?.topPages ?? []} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string
  value: number | undefined
  icon: React.ComponentType<{ className?: string }>
  loading: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold">{(value ?? 0).toLocaleString()}</div>
        )}
      </CardContent>
    </Card>
  )
}
