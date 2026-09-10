import { useRef, useState, type ReactNode } from "react"
import { UploadIcon, XIcon, Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface MediaDropzoneProps {
  value: string | null
  accept: string
  acceptPrefix: string
  placeholder: string
  aspectClassName?: string
  onUpload: (file: File) => Promise<void>
  onRemove: () => void
  renderPreview: (url: string) => ReactNode
}

export function MediaDropzone({
  value,
  accept,
  acceptPrefix,
  placeholder,
  aspectClassName = "aspect-[16/7]",
  onUpload,
  onRemove,
  renderPreview,
}: MediaDropzoneProps) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setUploading(true)
    try {
      await onUpload(file)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {value ? (
        <div
          className={cn(
            "group relative overflow-hidden rounded-xl border bg-muted",
            aspectClassName
          )}
        >
          {renderPreview(value)}
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
            >
              <UploadIcon className="mr-1.5 size-3.5" />
              Replace
            </Button>
            <Button size="sm" variant="secondary" onClick={onRemove}>
              <XIcon className="mr-1.5 size-3.5" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-colors",
            aspectClassName,
            dragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50"
          )}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            const file = e.dataTransfer.files[0]
            if (file?.type.startsWith(acceptPrefix)) handleFile(file)
          }}
          onClick={() => inputRef.current?.click()}
        >
          <UploadIcon className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium">{placeholder}</p>
        </div>
      )}
      {uploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Uploading…
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
          e.target.value = ""
        }}
      />
    </div>
  )
}
