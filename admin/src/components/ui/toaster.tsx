import { useSyncExternalStore } from "react"
import { CircleAlertIcon, CircleCheckIcon, XIcon } from "lucide-react"

import { IconButton } from "@/components/ui/icon-button"
import { dismissToast, getToasts, subscribeToasts } from "@/lib/toast"
import type { ToastKind, ToastMessage } from "@/lib/toast"

function ToastItem({ toast }: { toast: ToastMessage }) {
  const Icon = toast.kind === "error" ? CircleAlertIcon : CircleCheckIcon
  return (
    <div className="pointer-events-auto flex items-start gap-2 rounded-lg border bg-popover p-3 text-sm text-popover-foreground shadow-md">
      <Icon
        aria-hidden="true"
        className={
          toast.kind === "error"
            ? "mt-0.5 size-4 shrink-0 text-destructive"
            : "mt-0.5 size-4 shrink-0"
        }
      />
      <p className="flex-1">{toast.message}</p>
      <IconButton
        label="Dismiss notification"
        size="icon-xs"
        onClick={() => dismissToast(toast.id)}
      >
        <XIcon />
      </IconButton>
    </div>
  )
}

/**
 * Two persistent live regions: polite status for success, assertive alert for
 * errors. They must stay mounted so screen readers pick up new children.
 */
function Toaster() {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts)
  const byKind = (kind: ToastKind) => toasts.filter((t) => t.kind === kind)

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
      <div role="status" aria-live="polite" className="flex flex-col gap-2">
        {byKind("success").map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </div>
      <div role="alert" className="flex flex-col gap-2">
        {byKind("error").map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </div>
    </div>
  )
}

export { Toaster }
