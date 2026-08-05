import { useRef, useState, type ReactNode } from "react"
import { UploadIcon, XIcon, Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HeadingEditor } from "@/components/content/HeadingEditor"
import { cn } from "@/lib/utils"
import { supabase, type Tables } from "@/lib/supabase"

type HomeContent = Tables<"home_content">

interface HeroTabProps {
  content: HomeContent
  onChange: (content: HomeContent) => void
}

async function uploadToStorage(file: File): Promise<string> {
  const ext = file.name.split(".").pop()
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage
    .from("site-content")
    .upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from("site-content").getPublicUrl(path)
  return data.publicUrl
}

interface MediaDropzoneProps {
  value: string | null
  accept: string
  acceptPrefix: string
  placeholder: string
  onUpload: (file: File) => Promise<void>
  onRemove: () => void
  renderPreview: (url: string) => ReactNode
}

function MediaDropzone({
  value,
  accept,
  acceptPrefix,
  placeholder,
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
        <div className="group relative aspect-[16/7] overflow-hidden rounded-xl border bg-muted">
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
            "flex aspect-[16/7] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-colors",
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

export function HeroTab({ content, onChange }: HeroTabProps) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function set<K extends keyof HomeContent>(key: K, value: HomeContent[K]) {
    onChange({ ...content, [key]: value })
  }

  async function handleSave() {
    setSaving(true)
    const { id, updated_at, ...fields } = content
    void updated_at
    const { error } = await supabase
      .from("home_content")
      .update(fields)
      .eq("id", id)
    setSaving(false)
    if (error) {
      console.error("Failed to save hero content:", error.message)
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hero</CardTitle>
        <CardDescription>
          The headline, subtext, video and poster image shown at the top of the
          landing page. The video is also reused on the Subscribe page hero.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <HeadingEditor
          label="Headline"
          value={content.hero_headline}
          onChange={(v) => set("hero_headline", v)}
          rows={3}
        />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hero-subtext">Subtext</Label>
          <Textarea
            id="hero-subtext"
            rows={3}
            value={content.hero_subtext}
            onChange={(e) => set("hero_subtext", e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hero-cta-primary">Primary button label</Label>
            <Input
              id="hero-cta-primary"
              value={content.hero_cta_primary_label}
              onChange={(e) => set("hero_cta_primary_label", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hero-cta-secondary">Secondary button label</Label>
            <Input
              id="hero-cta-secondary"
              value={content.hero_cta_secondary_label}
              onChange={(e) => set("hero_cta_secondary_label", e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Hero video</Label>
          <MediaDropzone
            value={content.hero_video_url}
            accept="video/*"
            acceptPrefix="video/"
            placeholder="Drop a video here or click to upload"
            onUpload={async (file) =>
              set("hero_video_url", await uploadToStorage(file))
            }
            onRemove={() => set("hero_video_url", null)}
            renderPreview={(url) => (
              <video
                src={url}
                className="h-full w-full object-cover"
                muted
                loop
                autoPlay
                playsInline
              />
            )}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Video poster image</Label>
          <MediaDropzone
            value={content.hero_poster_url}
            accept="image/*"
            acceptPrefix="image/"
            placeholder="Drop image here or click to upload"
            onUpload={async (file) =>
              set("hero_poster_url", await uploadToStorage(file))
            }
            onRemove={() => set("hero_poster_url", null)}
            renderPreview={(url) => (
              <img
                src={url}
                alt="Hero poster"
                className="h-full w-full object-cover"
              />
            )}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : saved ? "Saved!" : "Save changes"}
          </Button>
          {saved && (
            <Badge
              variant="outline"
              className="border-green-200 text-green-600"
            >
              Changes saved
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
