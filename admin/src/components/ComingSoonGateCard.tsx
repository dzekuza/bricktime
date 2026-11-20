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
import { Switch } from "@/components/ui/switch"
import { supabase } from "@/lib/supabase"

const SETTING_KEY = "coming_soon_gate"

/** Turns the storefront's coming-soon password gate on or off. */
export function ComingSoonGateCard() {
  const [enabled, setEnabled] = useState<boolean | null>(null)
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
        setEnabled(data?.value !== false)
      })
  }, [])

  async function handleToggle(next: boolean) {
    setBusy(true)
    setError(null)
    const { error: saveError } = await supabase
      .from("site_settings")
      .upsert({ key: SETTING_KEY, value: next, updated_at: new Date().toISOString() })
    setBusy(false)
    if (saveError) {
      setError(saveError.message)
      return
    }
    setEnabled(next)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Coming soon gate</CardTitle>
        <CardDescription>
          When on, visitors see the coming soon page and need the access code to
          enter the storefront. Turn it off to open the site to everyone.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="coming-soon-gate">Password gate</Label>
          <div className="flex items-center gap-3">
            {enabled !== null && (
              <Badge variant="outline">{enabled ? "On" : "Off"}</Badge>
            )}
            <Switch
              id="coming-soon-gate"
              checked={enabled ?? true}
              disabled={enabled === null || busy}
              onCheckedChange={(v) => void handleToggle(v)}
            />
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  )
}
