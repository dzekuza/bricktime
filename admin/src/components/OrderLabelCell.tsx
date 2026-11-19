import { useState, type MouseEvent } from "react"
import { DownloadIcon, Loader2Icon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { downloadPdf, fetchLabelPdf } from "@/lib/lpexpress"
import { cn } from "@/lib/utils"
import type { Order } from "@/data/orders"

/** Whether the shipping label exists, with a button to download its PDF. */
export function OrderLabelCell({ order }: { order: Order }) {
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDownload(event: MouseEvent) {
    // The row itself opens the order detail.
    event.stopPropagation()
    setIsBusy(true)
    setError(null)
    try {
      const pdf = await fetchLabelPdf(order.id)
      downloadPdf(pdf, `label-${order.id.slice(0, 8)}.pdf`)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setIsBusy(false)
    }
  }

  if (!order.barcode) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Not generated
      </Badge>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <Badge variant="secondary" title={order.barcode}>
        {order.parcelId ? "Label generated" : "Code saved"}
      </Badge>
      {order.parcelId && (
        <Button
          variant="ghost"
          size="icon"
          className={cn("size-8", error && "text-destructive")}
          disabled={isBusy}
          onClick={handleDownload}
          aria-label="Download shipping label"
          title={error ?? "Download shipping label"}
        >
          {isBusy ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <DownloadIcon className="size-4" />
          )}
        </Button>
      )}
    </div>
  )
}
