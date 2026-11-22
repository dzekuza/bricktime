import { useCallback, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { WHATSAPP_KIND_LABELS } from "@/lib/whatsapp-alert-kinds"

const REFRESH_MS = 15_000
const LOG_SIZE = 8

type LogRow = {
  id: string
  kind: string
  status: string
  created_at: string
  sent_at: string | null
  last_error: string | null
}

const STATUS_HINTS: Record<string, string> = {
  pending: "Queued, goes out within a minute.",
  sent: "Accepted by the WhatsApp provider.",
  failed: "The provider rejected it; see the error.",
  skipped: "Alerts or this kind are off, the daily cap was reached, or it was too old.",
}

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString("lt-LT", { dateStyle: "short", timeStyle: "short" })

/** Test button and the latest alerts with their delivery status. */
export function WhatsAppDeliveryLog() {
  const [rows, setRows] = useState<LogRow[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error: loadError } = await supabase
      .from("admin_notifications")
      .select("id, kind, status, created_at, sent_at, last_error")
      .order("created_at", { ascending: false })
      .limit(LOG_SIZE)
    if (loadError) {
      setError(loadError.message)
      return
    }
    setError(null)
    setRows(data)
  }, [])

  useEffect(() => {
    void load()
    const timer = setInterval(() => void load(), REFRESH_MS)
    return () => clearInterval(timer)
  }, [load])

  async function handleTest() {
    setBusy(true)
    setError(null)
    const { error: insertError } = await supabase
      .from("admin_notifications")
      .insert({ kind: "test", dedupe_key: `test:${crypto.randomUUID()}` })
    setBusy(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    await load()
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-medium">Delivery check</p>
          <p className="text-sm text-muted-foreground">
            Sends a test message to the admin number within about a minute, even
            while alerts are switched off.
          </p>
        </div>
        <Button variant="outline" size="sm" disabled={busy} onClick={() => void handleTest()}>
          Send test alert
        </Button>
      </div>
      {rows?.map((row) => (
        <div key={row.id} className="flex items-center justify-between gap-4 text-sm">
          <div className="flex flex-col">
            <span>{WHATSAPP_KIND_LABELS[row.kind] ?? row.kind}</span>
            <span className="text-xs text-muted-foreground">
              {formatTime(row.sent_at ?? row.created_at)}
              {row.last_error ? ` · ${row.last_error.slice(0, 80)}` : ""}
            </span>
          </div>
          <Badge variant="outline" title={STATUS_HINTS[row.status]}>
            {row.status}
          </Badge>
        </div>
      ))}
      {rows?.length === 0 && (
        <p className="text-sm text-muted-foreground">No alerts yet.</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
