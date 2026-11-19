import { LockIcon } from "lucide-react"

/** Overlay for a hidden Mystery Box set; place inside a `relative` image frame. */
export function MysteryLock({ compact = false }: { compact?: boolean }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <span
        className={`flex items-center justify-center rounded-full border-2 border-ink bg-brand-yellow text-ink ${compact ? "size-7" : "size-12"}`}
      >
        <LockIcon className={compact ? "size-3.5" : "size-6"} />
      </span>
    </div>
  )
}
