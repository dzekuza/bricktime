import { useState } from "react"
import { PlusIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { Separator } from "@/components/ui/separator"
import { HeadingEditor } from "@/components/content/HeadingEditor"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase, type Tables } from "@/lib/supabase"

type HomeContent = Tables<"home_content">
type Step = Tables<"home_how_it_works_steps">

const BRICK_KEYS = ["nano", "standard", "mega"]

interface HowItWorksTabProps {
  content: HomeContent
  onChangeContent: (content: HomeContent) => void
  steps: Step[]
  onChangeSteps: (steps: Step[]) => void
}

function blankStep(sortOrder: number): Step {
  return {
    id: crypto.randomUUID(),
    step_number: String(sortOrder + 1).padStart(2, "0"),
    title: "",
    body: "",
    brick_key: "nano",
    sort_order: sortOrder,
    updated_at: new Date(0).toISOString(),
  }
}

export function HowItWorksTab({
  content,
  onChangeContent,
  steps,
  onChangeSteps,
}: HowItWorksTabProps) {
  const [savingHeading, setSavingHeading] = useState(false)
  const [savedHeading, setSavedHeading] = useState(false)
  const [savingSteps, setSavingSteps] = useState(false)
  const [savedSteps, setSavedSteps] = useState(false)
  const [initialStepIds] = useState(() => new Set(steps.map((s) => s.id)))

  function set<K extends keyof HomeContent>(key: K, value: HomeContent[K]) {
    onChangeContent({ ...content, [key]: value })
  }

  function setStep(id: string, patch: Partial<Step>) {
    onChangeSteps(steps.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  function addStep() {
    onChangeSteps([...steps, blankStep(steps.length)])
  }

  function removeStep(id: string) {
    onChangeSteps(steps.filter((s) => s.id !== id))
  }

  async function handleSaveHeading() {
    setSavingHeading(true)
    const { id, updated_at, ...fields } = content
    void updated_at
    const { error } = await supabase
      .from("home_content")
      .update(fields)
      .eq("id", id)
    setSavingHeading(false)
    if (error) {
      console.error("Failed to save heading:", error.message)
      return
    }
    setSavedHeading(true)
    setTimeout(() => setSavedHeading(false), 2000)
  }

  async function handleSaveSteps() {
    setSavingSteps(true)
    const currentIds = new Set(steps.map((s) => s.id))
    const removedIds = [...initialStepIds].filter((id) => !currentIds.has(id))

    if (removedIds.length) {
      const { error } = await supabase
        .from("home_how_it_works_steps")
        .delete()
        .in("id", removedIds)
      if (error) {
        console.error("Failed to delete steps:", error.message)
        setSavingSteps(false)
        return
      }
    }

    const rows = steps.map((s, i) => ({ ...s, sort_order: i }))
    const { error } = await supabase
      .from("home_how_it_works_steps")
      .upsert(rows)
    setSavingSteps(false)
    if (error) {
      console.error("Failed to save steps:", error.message)
      return
    }
    onChangeSteps(rows)
    setSavedSteps(true)
    setTimeout(() => setSavedSteps(false), 2000)
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Heading</CardTitle>
          <CardDescription>
            The "How it works" section title and subtitle.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <HeadingEditor
            label="Heading"
            value={content.how_it_works_heading}
            onChange={(v) => set("how_it_works_heading", v)}
            rows={2}
          />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hiw-subtitle">Subtitle</Label>
            <Textarea
              id="hiw-subtitle"
              rows={2}
              value={content.how_it_works_subtitle}
              onChange={(e) => set("how_it_works_subtitle", e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleSaveHeading} disabled={savingHeading}>
              {savingHeading
                ? "Saving…"
                : savedHeading
                  ? "Saved!"
                  : "Save heading"}
            </Button>
            {savedHeading && (
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

      <Card>
        <CardHeader>
          <CardTitle>Steps</CardTitle>
          <CardDescription>
            The numbered step cards. Each links to a subscription tier's brick
            illustration.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {steps.map((step, i) => (
            <div key={step.id} className="flex flex-col gap-3">
              {i > 0 && <Separator />}
              <div className="flex items-start gap-3">
                <div className="grid flex-1 gap-3 sm:grid-cols-3">
                  <div className="flex flex-col gap-1.5">
                    <Label>Title</Label>
                    <Textarea
                      rows={2}
                      value={step.title}
                      onChange={(e) =>
                        setStep(step.id, { title: e.target.value })
                      }
                      placeholder={"Line 1\\nLine 2"}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label>Body</Label>
                    <Textarea
                      rows={2}
                      value={step.body}
                      onChange={(e) =>
                        setStep(step.id, { body: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Brick illustration</Label>
                    <Select
                      value={step.brick_key}
                      onValueChange={(v) => setStep(step.id, { brick_key: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BRICK_KEYS.map((k) => (
                          <SelectItem key={k} value={k}>
                            {k}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="mt-6 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeStep(step.id)}
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={addStep}
          >
            <PlusIcon className="mr-1.5 size-3.5" />
            Add step
          </Button>

          <div className="flex items-center gap-3">
            <Button onClick={handleSaveSteps} disabled={savingSteps}>
              {savingSteps ? "Saving…" : savedSteps ? "Saved!" : "Save steps"}
            </Button>
            {savedSteps && (
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
    </div>
  )
}
