import { useEffect, useState } from "react"
import { PlusIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import type { Database, Json } from "@/lib/database.types"

type PlanId = Database["public"]["Enums"]["plan_tier"]

interface ComparisonPlan {
  id: PlanId
  name: string | null
  comparison_data: Json
}

interface Row {
  key: string
  label: string
  values: Record<string, string>
}

function toRows(plans: ComparisonPlan[]): Row[] {
  const order: string[] = []
  const seen = new Set<string>()
  for (const p of plans) {
    const data =
      p.comparison_data &&
      typeof p.comparison_data === "object" &&
      !Array.isArray(p.comparison_data)
        ? (p.comparison_data as Record<string, Json>)
        : {}
    for (const key of Object.keys(data)) {
      if (!seen.has(key)) {
        seen.add(key)
        order.push(key)
      }
    }
  }
  return order.map((key) => ({
    key,
    label: key,
    values: Object.fromEntries(
      plans.map((p) => {
        const data =
          p.comparison_data &&
          typeof p.comparison_data === "object" &&
          !Array.isArray(p.comparison_data)
            ? (p.comparison_data as Record<string, Json>)
            : {}
        return [p.id, data[key] != null ? String(data[key]) : ""]
      })
    ),
  }))
}

interface ComparisonTableEditorProps {
  plans: ComparisonPlan[]
  onSaved: (comparisonData: Record<string, Record<string, string>>) => void
}

export function ComparisonTableEditor({
  plans,
  onSaved,
}: ComparisonTableEditorProps) {
  const [rows, setRows] = useState<Row[]>(() => toRows(plans))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setRows(toRows(plans))
  }, [plans])

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        label: "",
        values: Object.fromEntries(plans.map((p) => [p.id, ""])),
      },
    ])
  }

  function removeRow(key: string) {
    setRows((prev) => prev.filter((r) => r.key !== key))
  }

  function setLabel(key: string, label: string) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, label } : r)))
  }

  function setValue(key: string, planId: string, value: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.key === key ? { ...r, values: { ...r.values, [planId]: value } } : r
      )
    )
  }

  async function handleSave() {
    setSaving(true)
    const usableRows = rows.filter((r) => r.label.trim().length > 0)
    const perPlan: Record<PlanId, Record<string, string>> = Object.fromEntries(
      plans.map((p) => [p.id, {} as Record<string, string>])
    )
    for (const row of usableRows) {
      for (const p of plans) {
        perPlan[p.id][row.label] = row.values[p.id] ?? ""
      }
    }
    const results = await Promise.all(
      plans.map((p) =>
        supabase
          .from("plans")
          .update({ comparison_data: perPlan[p.id] })
          .eq("id", p.id)
      )
    )
    setSaving(false)
    const failed = results.find((r) => r.error)
    if (failed?.error) {
      console.error("Failed to save comparison table:", failed.error.message)
      return
    }
    onSaved(perPlan)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Comparison table</CardTitle>
          <CardDescription>
            Rows shown in the "Palygink prenumeratas" table on the Subscribe
            page. Each row is a feature; each column is a plan.
          </CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={addRow}>
          <PlusIcon className="mr-1.5 size-3.5" />
          Add row
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-56 border-b p-2 text-left font-medium text-muted-foreground">
                  Feature
                </th>
                {plans.map((p) => (
                  <th
                    key={p.id}
                    className="min-w-36 border-b p-2 text-left font-medium text-muted-foreground"
                  >
                    {p.name ?? p.id}
                  </th>
                ))}
                <th className="w-10 border-b p-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <td className="p-2 align-top">
                    <Input
                      value={row.label}
                      placeholder="Feature name"
                      onChange={(e) => setLabel(row.key, e.target.value)}
                    />
                  </td>
                  {plans.map((p) => (
                    <td key={p.id} className="p-2 align-top">
                      <Input
                        value={row.values[p.id] ?? ""}
                        placeholder="—"
                        onChange={(e) =>
                          setValue(row.key, p.id, e.target.value)
                        }
                      />
                    </td>
                  ))}
                  <td className="p-2 align-top">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeRow(row.key)}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={plans.length + 2}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    No comparison rows yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
