import { useState } from "react"
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
import { supabase, type Tables } from "@/lib/supabase"

type HomeContent = Tables<"home_content">

interface FaqCtaTabProps {
  content: HomeContent
  onChangeContent: (content: HomeContent) => void
}

export function FaqCtaTab({ content, onChangeContent }: FaqCtaTabProps) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function set<K extends keyof HomeContent>(key: K, value: HomeContent[K]) {
    onChangeContent({ ...content, [key]: value })
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
      console.error("Failed to save FAQ CTA:", error.message)
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bottom CTA</CardTitle>
        <CardDescription>
          The call-to-action banner shown below the FAQ accordion on the Home
          page. Other pages (e.g. Subscribe) set their own CTA copy in code and
          aren't affected by this.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Eyebrow</Label>
          <Input
            value={content.faq_cta_eyebrow}
            onChange={(e) => set("faq_cta_eyebrow", e.target.value)}
          />
        </div>
        <HeadingEditor
          label="Heading"
          value={content.faq_cta_heading}
          onChange={(v) => set("faq_cta_heading", v)}
          rows={2}
        />
        <div className="flex flex-col gap-1.5">
          <Label>Body</Label>
          <Textarea
            rows={2}
            value={content.faq_cta_body}
            onChange={(e) => set("faq_cta_body", e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Button label</Label>
            <Input
              value={content.faq_cta_label}
              onChange={(e) => set("faq_cta_label", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Button link</Label>
            <Input
              value={content.faq_cta_href}
              onChange={(e) => set("faq_cta_href", e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : saved ? "Saved!" : "Save CTA"}
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
