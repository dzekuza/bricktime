import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { WhatsAppDeliveryLog } from "@/components/WhatsAppDeliveryLog"
import { supabase } from "@/lib/supabase"
import { WHATSAPP_ALERT_KINDS } from "@/lib/whatsapp-alert-kinds"

const SETTING_KEY = "admin_whatsapp"

type Settings = { enabled: boolean; kinds: Record<string, boolean> }

const DEFAULTS: Settings = { enabled: false, kinds: {} }

function parseSettings(value: unknown): Settings {
  if (typeof value !== "object" || value === null) return DEFAULTS
  const { enabled, kinds } = value as { enabled?: unknown; kinds?: unknown }
  return {
    enabled: enabled === true,
    kinds:
      typeof kinds === "object" && kinds !== null
        ? (kinds as Record<string, boolean>)
        : {},
  }
}

/** Turns WhatsApp admin alerts on or off, overall and per event. */
export function WhatsAppAlertsCard() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void supabase
      .from("site_settings")
      .select("value")
      .eq("key", SETTING_KEY)
      .maybeSingle()
      .then(({ data, error: loadError }) => {
        if (loadError) {
          setError(loadError.message)
          return
        }
        setSettings(parseSettings(data?.value))
      })
  }, [])

  // Re-reads the stored value right before writing, so a toggle made in
  // another admin session is merged into the change instead of overwritten.
  async function save(change: (latest: Settings) => Settings) {
    setBusy(true)
    setError(null)
    const { data, error: loadError } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", SETTING_KEY)
      .maybeSingle()
    if (loadError) {
      setBusy(false)
      setError(loadError.message)
      return
    }
    const next = change(parseSettings(data?.value))
    const { error: saveError } = await supabase.from("site_settings").upsert({
      key: SETTING_KEY,
      value: next,
      updated_at: new Date().toISOString(),
    })
    setBusy(false)
    if (saveError) {
      setError(saveError.message)
      return
    }
    setSettings(next)
  }

  const current = settings ?? DEFAULTS
  const isDisabled = settings === null || busy

  return (
    <Card>
      <CardHeader>
        <CardTitle>WhatsApp alerts</CardTitle>
        <CardDescription>
          Sends a WhatsApp message to the admin number when these events happen.
          Needs the WhatsApp provider secrets to be set on the server.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="whatsapp-enabled">WhatsApp alerts</Label>
          <div className="flex items-center gap-3">
            {settings && (
              <Badge variant="outline">{current.enabled ? "On" : "Off"}</Badge>
            )}
            <Switch
              id="whatsapp-enabled"
              checked={current.enabled}
              disabled={isDisabled}
              onCheckedChange={(enabled) =>
                void save((latest) => ({ ...latest, enabled }))
              }
            />
          </div>
        </div>
        <Separator />
        {WHATSAPP_ALERT_KINDS.map((kind) => (
          <div key={kind.id} className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor={`whatsapp-${kind.id}`}>{kind.label}</Label>
              <p className="text-sm text-muted-foreground">{kind.description}</p>
            </div>
            <Switch
              id={`whatsapp-${kind.id}`}
              checked={current.kinds[kind.id] !== false}
              disabled={isDisabled || !current.enabled}
              onCheckedChange={(on) =>
                void save((latest) => ({
                  ...latest,
                  kinds: { ...latest.kinds, [kind.id]: on },
                }))
              }
            />
          </div>
        ))}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Separator />
        <WhatsAppDeliveryLog />
      </CardContent>
    </Card>
  )
}
