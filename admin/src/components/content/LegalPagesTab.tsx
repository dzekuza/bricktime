import { useEffect, useState } from "react"
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { supabase, type Tables } from "@/lib/supabase"

type LegalPageRow = Tables<"legal_pages">
type Slug = LegalPageRow["slug"]

// Paragraphs and bullets are edited as plain text and split on save, so
// trailing newlines aren't eaten while typing.
type SectionDraft = {
  key: string
  id: string
  title: string
  body: string
  bullets: string
}

type StoredSection = {
  id: string
  title: string
  body: string[]
  bullets?: string[]
}

const PAGES: { slug: Slug; label: string; path: string }[] = [
  {
    slug: "privacy_policy",
    label: "Privatumo politika",
    path: "/privatumo-politika",
  },
  {
    slug: "store_rules",
    label: "Parduotuvės taisyklės",
    path: "/parduotuves-taisykles",
  },
]

function toDrafts(sections: StoredSection[]): SectionDraft[] {
  return sections.map((s) => ({
    key: crypto.randomUUID(),
    id: s.id,
    title: s.title,
    body: s.body.join("\n\n"),
    bullets: (s.bullets ?? []).join("\n"),
  }))
}

function toStored(drafts: SectionDraft[]): StoredSection[] {
  return drafts.map((d) => {
    const bullets = d.bullets
      .split("\n")
      .map((b) => b.trim())
      .filter(Boolean)
    return {
      id: d.id.trim(),
      title: d.title.trim(),
      body: d.body
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean),
      ...(bullets.length > 0 ? { bullets } : {}),
    }
  })
}

function toAnchor(title: string) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function LegalPagesTab() {
  const [slug, setSlug] = useState<Slug>("privacy_policy")
  const [intro, setIntro] = useState("")
  const [revisionDate, setRevisionDate] = useState("")
  const [sections, setSections] = useState<SectionDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    supabase
      .from("legal_pages")
      .select("*")
      .eq("slug", slug)
      .single()
      .then(({ data, error: loadError }) => {
        if (cancelled) return
        if (loadError || !data) {
          setError(loadError?.message ?? "Page not found")
        } else {
          setIntro(data.intro)
          setRevisionDate(data.revision_date)
          setSections(toDrafts(data.sections as unknown as StoredSection[]))
        }
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  function updateSection(key: string, patch: Partial<SectionDraft>) {
    setSections((prev) =>
      prev.map((s) => (s.key === key ? { ...s, ...patch } : s))
    )
  }

  function moveSection(index: number, direction: -1 | 1) {
    setSections((prev) => {
      const target = index + direction
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function addSection() {
    setSections((prev) => [
      ...prev,
      { key: crypto.randomUUID(), id: "", title: "", body: "", bullets: "" },
    ])
  }

  async function handleSave() {
    const stored = toStored(sections)
    const invalid = stored.find((s) => !s.id || !s.title || s.body.length === 0)
    if (invalid) {
      setError(
        "Every section needs an anchor id, a title and at least one paragraph."
      )
      return
    }
    const ids = stored.map((s) => s.id)
    if (new Set(ids).size !== ids.length) {
      setError("Section anchor ids must be unique.")
      return
    }

    setSaving(true)
    setError(null)
    const { error: saveError } = await supabase
      .from("legal_pages")
      .update({
        intro: intro.trim(),
        revision_date: revisionDate.trim(),
        sections: stored,
        updated_at: new Date().toISOString(),
      })
      .eq("slug", slug)
    setSaving(false)
    if (saveError) {
      setError(saveError.message)
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const page = PAGES.find((p) => p.slug === slug)

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Legal pages</CardTitle>
          <CardDescription>
            Text of the Privatumo politika and Parduotuvės taisyklės pages.
            Separate paragraphs with a blank line; put each bullet on its own
            line. Changes go live when you press Save.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-[260px_1fr_180px]">
          <div className="flex flex-col gap-1.5">
            <Label>Page</Label>
            <Select value={slug} onValueChange={(v) => setSlug(v as Slug)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGES.map((p) => (
                  <SelectItem key={p.slug} value={p.slug}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {page && (
              <a
                href={`https://www.bricktime.lt${page.path}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-muted-foreground underline underline-offset-4"
              >
                Open live page
              </a>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Intro</Label>
            <Textarea
              rows={3}
              value={intro}
              disabled={loading}
              onChange={(e) => setIntro(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Redakcija (date)</Label>
            <Input
              value={revisionDate}
              disabled={loading}
              placeholder="2026-07-16"
              onChange={(e) => setRevisionDate(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="py-10 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      ) : (
        sections.map((section, index) => (
          <Card key={section.key}>
            <CardHeader className="flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">Section {index + 1}</CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Move up"
                  disabled={index === 0}
                  onClick={() => moveSection(index, -1)}
                >
                  <ArrowUp />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Move down"
                  disabled={index === sections.length - 1}
                  onClick={() => moveSection(index, 1)}
                >
                  <ArrowDown />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Delete section"
                  onClick={() =>
                    setSections((prev) =>
                      prev.filter((s) => s.key !== section.key)
                    )
                  }
                >
                  <Trash2 />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-[1fr_260px]">
                <div className="flex flex-col gap-1.5">
                  <Label>Title</Label>
                  <Input
                    value={section.title}
                    onChange={(e) =>
                      updateSection(section.key, {
                        title: e.target.value,
                        ...(section.id === "" ||
                        section.id === toAnchor(section.title)
                          ? { id: toAnchor(e.target.value) }
                          : {}),
                      })
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Anchor id (#link)</Label>
                  <Input
                    value={section.id}
                    onChange={(e) =>
                      updateSection(section.key, { id: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Paragraphs</Label>
                <Textarea
                  rows={8}
                  value={section.body}
                  onChange={(e) =>
                    updateSection(section.key, { body: e.target.value })
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Bullets (one per line, optional)</Label>
                <Textarea
                  rows={4}
                  value={section.bullets}
                  onChange={(e) =>
                    updateSection(section.key, { bullets: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <div className="sticky bottom-4 flex items-center gap-3 rounded-lg border bg-background p-3 shadow-sm">
        <Button variant="outline" onClick={addSection} disabled={loading}>
          <Plus /> Add section
        </Button>
        <div className="ml-auto flex items-center gap-3">
          {error && <span className="text-sm text-destructive">{error}</span>}
          {saved && (
            <span className="text-sm text-muted-foreground">Saved</span>
          )}
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  )
}
