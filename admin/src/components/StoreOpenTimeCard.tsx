import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"

const SETTING_KEY = "store_open_at"

// The store opens on Lithuanian time whatever the admin's own time zone is.
const STORE_TIME_ZONE = 'Europe/Vilnius'

const vilniusFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: STORE_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

function getVilniusParts(date: Date) {
  const parts = Object.fromEntries(
    vilniusFormat.formatToParts(date).map((part) => [part.type, part.value]),
  )
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

// datetime-local wants "YYYY-MM-DDTHH:mm"; show the stored moment as Vilnius wall time.
function toInputValue(iso: string) {
  return getVilniusParts(new Date(iso))
}

// Vilnius wall time -> the real instant. The offset (+2h or +3h with DST) is
// found by checking what Vilnius shows for a first guess, then correcting once.
function fromInputValue(local: string) {
  const asUtc = Date.parse(`${local}:00Z`)
  const offsetMs = (guess: number) =>
    Date.parse(`${getVilniusParts(new Date(guess))}:00Z`) - guess
  const firstGuess = asUtc - offsetMs(asUtc)
  return new Date(asUtc - offsetMs(firstGuess))
}

/** Sets the opening time the storefront's coming-soon countdown counts down to. */
export function StoreOpenTimeCard() {
  const [value, setValue] = useState("")
  const [saved, setSaved] = useState("")
  const [isLoaded, setIsLoaded] = useState(false)
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
        if (typeof data?.value === "string") {
          const local = toInputValue(data.value)
          setValue(local)
          setSaved(local)
        }
        setIsLoaded(true)
      })
  }, [])

  async function handleSave() {
    setBusy(true)
    setError(null)
    // An empty field removes the countdown from the coming-soon page.
    const { error: saveError } = value
      ? await supabase.from("site_settings").upsert({
          key: SETTING_KEY,
          value: fromInputValue(value).toISOString(),
          updated_at: new Date().toISOString(),
        })
      : await supabase.from("site_settings").delete().eq("key", SETTING_KEY)
    setBusy(false)
    if (saveError) {
      setError(saveError.message)
      return
    }
    setSaved(value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Store open time</CardTitle>
        <CardDescription>
          The coming soon page shows a countdown to this moment, and when it
          passes the coming soon gate lifts by itself for every visitor. Leave
          it empty to hide the countdown. The time is Lithuanian time
          (Europe/Vilnius), whatever time zone you are in.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="store-open-at">Opens at (Europe/Vilnius time)</Label>
          <div className="flex items-center gap-3">
            <Input
              id="store-open-at"
              type="datetime-local"
              className="max-w-xs"
              value={value}
              disabled={!isLoaded || busy}
              onChange={(e) => setValue(e.target.value)}
            />
            <Button
              disabled={!isLoaded || busy || value === saved}
              onClick={() => void handleSave()}
            >
              Save
            </Button>
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  )
}
