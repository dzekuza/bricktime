import { ImageOffIcon } from "lucide-react"

export function ImagePlaceholder({ compact = false }: { compact?: boolean }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-ink">
      <ImageOffIcon
        className={compact ? "size-6" : "size-10"}
        aria-hidden="true"
      />
      {!compact && (
        <span className="font-mono text-[11px] tracking-[.12em] uppercase">
          Nuotraukos dar nėra
        </span>
      )}
    </div>
  )
}
