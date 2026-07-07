import { useState, useEffect } from 'react'
import { PencilIcon, CheckIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { supabaseAdmin } from '@/lib/supabase'

type PlanId = 'nano' | 'mini' | 'standard' | 'pro' | 'mega' | 'mystery_s' | 'mystery_m'

interface DbPlan {
  id: PlanId
  name: string | null
  tagline: string | null
  price: number
  annual_price: number | null
  featured: boolean
  active: boolean
  sort_order: number
  bg_color: string
  text_color: string
  perks: Array<{ label: string; included: boolean }>
  subscribers: number
}

type EditState = Omit<DbPlan, 'subscribers'>

export function Plans() {
  const [plans, setPlans] = useState<DbPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [editPlan, setEditPlan] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: planRows }, { data: subRows }] = await Promise.all([
        supabaseAdmin.from('plans').select('*').order('sort_order'),
        supabaseAdmin.from('subscribers').select('plan').eq('status', 'active'),
      ])
      const subCountMap: Record<string, number> = {}
      for (const s of subRows ?? []) {
        subCountMap[s.plan] = (subCountMap[s.plan] ?? 0) + 1
      }
      setPlans(
        (planRows ?? []).map((p) => ({
          ...p,
          perks: (Array.isArray(p.perks) ? p.perks : []) as Array<{ label: string; included: boolean }>,
          subscribers: subCountMap[p.id] ?? 0,
        })) as DbPlan[]
      )
      setLoading(false)
    }
    load()
  }, [])

  function openEdit(plan: DbPlan) {
    setEditPlan({ ...plan, perks: plan.perks.map((p) => ({ ...p })) })
  }

  async function handleSave() {
    if (!editPlan) return
    setSaving(true)
    const { error } = await supabaseAdmin
      .from('plans')
      .update({
        name: editPlan.name,
        tagline: editPlan.tagline,
        price: editPlan.price,
        annual_price: editPlan.annual_price,
        featured: editPlan.featured,
        active: editPlan.active,
        bg_color: editPlan.bg_color,
        text_color: editPlan.text_color,
        perks: editPlan.perks,
      })
      .eq('id', editPlan.id)
    setSaving(false)
    if (error) { console.error('Save failed:', error.message); return }
    setPlans((prev) =>
      prev.map((p) => p.id === editPlan.id ? { ...p, ...editPlan } : p)
    )
    setEditPlan(null)
  }

  async function toggleActive(plan: DbPlan) {
    const next = !plan.active
    const { error } = await supabaseAdmin
      .from('plans')
      .update({ active: next })
      .eq('id', plan.id)
    if (error) { console.error('Toggle failed:', error.message); return }
    setPlans((prev) => prev.map((p) => p.id === plan.id ? { ...p, active: next } : p))
  }

  const activePlans = plans.filter((p) => p.active)
  const totalSubscribers = plans.reduce((sum, p) => sum + p.subscribers, 0)
  const totalMrr = plans.reduce((sum, p) => sum + p.price * p.subscribers, 0)

  return (
    <>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Plans</h1>
          <p className="text-sm text-muted-foreground">
            {loading
              ? 'Loading…'
              : `${activePlans.length} active plans · ${totalSubscribers} subscribers · €${totalMrr.toLocaleString()} MRR`}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse overflow-hidden py-0">
                  <div className="h-24 bg-muted" />
                  <CardContent className="pt-5">
                    <div className="h-8 w-1/3 rounded bg-muted" />
                    <div className="mt-4 space-y-2">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <div key={j} className="h-4 rounded bg-muted" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            : plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={[
                    'flex flex-col overflow-hidden py-0 transition-opacity',
                    !plan.active && 'opacity-50',
                  ].join(' ')}
                >
                  {/* Coloured header strip */}
                  <div
                    className="flex items-start justify-between gap-3 px-6 py-5"
                    style={{ background: plan.bg_color, color: plan.text_color }}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-xs tracking-[.18em] uppercase opacity-70">
                        {plan.id}
                      </span>
                      <span className="text-2xl font-bold leading-none">
                        {plan.name ?? plan.id}
                      </span>
                      {plan.tagline && (
                        <span className="mt-1 text-sm opacity-80">{plan.tagline}</span>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {plan.featured && (
                        <Badge
                          className="font-mono text-[10px] tracking-[.08em] uppercase"
                          style={{ background: 'rgba(0,0,0,.25)', color: plan.text_color, border: 'none' }}
                        >
                          Popular
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 hover:bg-black/10"
                        style={{ color: plan.text_color }}
                        onClick={() => openEdit(plan)}
                      >
                        <PencilIcon className="size-3.5" />
                        <span className="sr-only">Edit plan</span>
                      </Button>
                    </div>
                  </div>

                  <CardContent className="flex flex-1 flex-col gap-4 px-6 py-5">
                    {/* Price */}
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">€{plan.price}</span>
                      <span className="text-sm text-muted-foreground">/mo</span>
                      {plan.annual_price && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          €{plan.annual_price} annual
                        </span>
                      )}
                    </div>

                    <Separator />

                    {/* Perks */}
                    <ul className="flex flex-col gap-1.5">
                      {plan.perks.filter((p) => p.included).map((perk) => (
                        <li key={perk.label} className="flex items-start gap-2 text-sm">
                          <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                          {perk.label}
                        </li>
                      ))}
                    </ul>

                    {/* Footer */}
                    <div className="mt-auto flex items-center justify-between border-t pt-3 text-sm text-muted-foreground">
                      <span>{plan.subscribers} active</span>
                      <div className="flex items-center gap-3">
                        <span>€{(plan.price * plan.subscribers).toLocaleString()} MRR</span>
                        <button
                          onClick={() => toggleActive(plan)}
                          className={[
                            'font-mono text-[11px] tracking-[.06em] uppercase transition-colors',
                            plan.active
                              ? 'text-green-600 hover:text-red-500'
                              : 'text-red-400 hover:text-green-600',
                          ].join(' ')}
                        >
                          {plan.active ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>
      </div>

      {/* Full plan edit sheet */}
      <Sheet open={!!editPlan} onOpenChange={(open) => { if (!open) setEditPlan(null) }}>
        <SheetContent className="flex flex-col gap-0 overflow-y-auto sm:max-w-md">
          <SheetHeader className="border-b px-6 py-5">
            <SheetTitle>Edit plan — {editPlan?.name ?? editPlan?.id}</SheetTitle>
          </SheetHeader>

          {editPlan && (
            <div className="flex flex-col gap-5 px-6 py-5">
              {/* Identity */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Name</Label>
                  <Input
                    value={editPlan.name ?? ''}
                    onChange={(e) =>
                      setEditPlan((p) => p && { ...p, name: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Tagline</Label>
                  <Input
                    value={editPlan.tagline ?? ''}
                    onChange={(e) =>
                      setEditPlan((p) => p && { ...p, tagline: e.target.value || null })
                    }
                    placeholder="Optional"
                  />
                </div>
              </div>

              <Separator />

              {/* Pricing */}
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium">Pricing</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label>Monthly (€)</Label>
                    <Input
                      type="number"
                      min={1}
                      step={0.01}
                      value={editPlan.price}
                      onChange={(e) =>
                        setEditPlan((p) => p && { ...p, price: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Annual (€)</Label>
                    <Input
                      type="number"
                      min={1}
                      step={0.01}
                      value={editPlan.annual_price ?? ''}
                      onChange={(e) =>
                        setEditPlan((p) =>
                          p && {
                            ...p,
                            annual_price: e.target.value ? Number(e.target.value) : null,
                          }
                        )
                      }
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Appearance */}
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium">Appearance</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label>Background</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editPlan.bg_color}
                        onChange={(e) =>
                          setEditPlan((p) => p && { ...p, bg_color: e.target.value })
                        }
                        className="h-9 w-10 cursor-pointer rounded border border-input bg-transparent p-0.5"
                      />
                      <Input
                        value={editPlan.bg_color}
                        onChange={(e) =>
                          setEditPlan((p) => p && { ...p, bg_color: e.target.value })
                        }
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Text color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editPlan.text_color}
                        onChange={(e) =>
                          setEditPlan((p) => p && { ...p, text_color: e.target.value })
                        }
                        className="h-9 w-10 cursor-pointer rounded border border-input bg-transparent p-0.5"
                      />
                      <Input
                        value={editPlan.text_color}
                        onChange={(e) =>
                          setEditPlan((p) => p && { ...p, text_color: e.target.value })
                        }
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
                {/* Live preview strip */}
                <div
                  className="rounded-lg px-4 py-3 text-sm font-semibold"
                  style={{ background: editPlan.bg_color, color: editPlan.text_color }}
                >
                  {editPlan.name ?? editPlan.id}
                </div>
              </div>

              <Separator />

              {/* Settings */}
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium">Settings</p>
                <div className="flex items-center justify-between">
                  <Label>Featured (Popular badge)</Label>
                  <Switch
                    checked={editPlan.featured}
                    onCheckedChange={(v) =>
                      setEditPlan((p) => p && { ...p, featured: v })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch
                    checked={editPlan.active}
                    onCheckedChange={(v) =>
                      setEditPlan((p) => p && { ...p, active: v })
                    }
                  />
                </div>
              </div>

              <Separator />

              {/* Features / perks */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Features</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setEditPlan((p) =>
                        p && { ...p, perks: [...p.perks, { label: '', included: true }] }
                      )
                    }
                  >
                    <PlusIcon className="size-3.5" />
                    Add
                  </Button>
                </div>
                <div className="flex flex-col gap-2">
                  {editPlan.perks.map((perk, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Switch
                        checked={perk.included}
                        onCheckedChange={(v) =>
                          setEditPlan((p) =>
                            p && {
                              ...p,
                              perks: p.perks.map((pk, idx) =>
                                idx === i ? { ...pk, included: v } : pk
                              ),
                            }
                          )
                        }
                      />
                      <Input
                        className="flex-1 text-sm"
                        value={perk.label}
                        onChange={(e) =>
                          setEditPlan((p) =>
                            p && {
                              ...p,
                              perks: p.perks.map((pk, idx) =>
                                idx === i ? { ...pk, label: e.target.value } : pk
                              ),
                            }
                          )
                        }
                        placeholder="Feature description"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          setEditPlan((p) =>
                            p && { ...p, perks: p.perks.filter((_, idx) => idx !== i) }
                          )
                        }
                      >
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <SheetFooter className="mt-auto border-t px-6 py-4">
            <Button
              variant="outline"
              onClick={() => setEditPlan(null)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
