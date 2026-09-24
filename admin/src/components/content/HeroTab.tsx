import { useState } from "react"
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
import { Button } from "@/components/ui/button"
import { HeadingEditor } from "@/components/content/HeadingEditor"
import { MediaDropzone } from "@/components/content/MediaDropzone"
import { supabase, type Tables } from "@/lib/supabase"
import { uploadToStorage } from "@/lib/upload-to-storage"

type HomeContent = Tables<"home_content">

interface HeroTabProps {
  content: HomeContent
  onChange: (content: HomeContent) => void
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
          landing page. The hero video is also reused on the Subscribe page
          hero. The promo video plays in the floating widget shown in the
          bottom-right corner of the site.
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
          <Label>Floating promo video</Label>
          <MediaDropzone
            value={content.promo_video_url}
            accept="video/*"
            acceptPrefix="video/"
            placeholder="Drop a video here or click to upload"
            aspectClassName="aspect-[9/16] max-w-[220px]"
            onUpload={async (file) =>
              set("promo_video_url", await uploadToStorage(file))
            }
            onRemove={() => set("promo_video_url", null)}
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
