import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { supabase } from "@/lib/supabase"

interface Counts {
  created: number
  updated: number
  failed: number
}

interface SyncResult {
  categories: Counts
  products: Counts
  errors: string[]
}

const describe = ({ created, updated, failed }: Counts) =>
  `${created} new, ${updated} updated${failed ? `, ${failed} failed` : ""}`

// The generic "non-2xx" message hides the function's own JSON error body.
async function readInvokeError(error: Error): Promise<string> {
  const res = (error as { context?: Response }).context
  const detail: unknown = await res?.json?.().catch(() => null)
  return detail && typeof detail === "object" && "error" in detail
    ? String(detail.error)
    : error.message
}

/** Pushes the product catalogue and its categories to Omnisend for email content. */
export function OmnisendCatalogCard() {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<SyncResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSync() {
    setBusy(true)
    setError(null)
    setResult(null)
    const { data, error: invokeError } = await supabase.functions.invoke<SyncResult>(
      "omnisend-sync-catalog",
    )
    setBusy(false)
    if (invokeError || !data) {
      setError(invokeError ? await readInvokeError(invokeError) : "Sync returned nothing")
      return
    }
    setResult(data)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Omnisend catalog</CardTitle>
        <CardDescription>
          Sends every set and its category to Omnisend so emails can show real
          products. Run it after adding or changing sets; it is safe to repeat.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div>
          <Button disabled={busy} onClick={() => void handleSync()}>
            {busy ? "Syncing…" : "Sync products and categories"}
          </Button>
        </div>
        {result && (
          <div className="text-sm">
            <p>Categories: {describe(result.categories)}</p>
            <p>Products: {describe(result.products)}</p>
            {result.errors.map((message) => (
              <p key={message} className="text-destructive">
                {message}
              </p>
            ))}
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  )
}
