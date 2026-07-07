import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"

export interface ProfileValues {
  name: string
  last_name: string
  phone: string
  street: string
  house_no: string
  flat: string
  city: string
  postal_code: string
}

interface ProfileEditDialogProps {
  userId: string
  email: string
  open: boolean
  onOpenChange: (open: boolean) => void
  initial: Partial<Record<keyof ProfileValues, string | null>>
  onSaved: (values: ProfileValues) => void
}

const EMPTY: ProfileValues = {
  name: "",
  last_name: "",
  phone: "",
  street: "",
  house_no: "",
  flat: "",
  city: "",
  postal_code: "",
}

const inputCls =
  "w-full rounded-2xl border-2 border-ink/20 bg-paper px-4 py-3 font-mono text-[14px] text-ink outline-none focus:border-ink"

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <label className="block">
      <span className="label-mono mb-1 block text-ink/40">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      />
    </label>
  )
}

/** Edit customer profile — name, surname, phone, address. */
export function ProfileEditDialog({ userId, email, open, onOpenChange, initial, onSaved }: ProfileEditDialogProps) {
  const [v, setV] = useState<ProfileValues>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      const cleaned = Object.fromEntries(
        Object.entries(initial).map(([k, val]) => [k, val ?? ""]),
      )
      setV({ ...EMPTY, ...cleaned })
      setError(null)
    }
  }, [open, initial])

  const set = (k: keyof ProfileValues) => (val: string) => setV((prev) => ({ ...prev, [k]: val }))

  async function save() {
    if (!v.name.trim()) {
      setError("Vardas privalomas")
      return
    }
    if (v.phone && !/^\+?\d{8,15}$/.test(v.phone.trim())) {
      setError("Neteisingas telefono numeris (pvz. +37060000000)")
      return
    }
    setSaving(true)
    setError(null)
    const payload = {
      id: userId,
      email,
      name: v.name.trim(),
      last_name: v.last_name.trim() || null,
      phone: v.phone.trim() || null,
      street: v.street.trim() || null,
      house_no: v.house_no.trim() || null,
      flat: v.flat.trim() || null,
      city: v.city.trim() || null,
      postal_code: v.postal_code.trim() || null,
    }
    const { error: err } = await supabase.from("subscribers").update(payload).eq("id", userId)
    setSaving(false)
    if (err) {
      setError(err.message)
      return
    }
    onSaved(v)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="brick-card max-h-[90vh] max-w-lg overflow-y-auto bg-paper p-6">
        <DialogTitle className="heading-display text-d-xs text-ink">Redaguoti profilį</DialogTitle>
        <DialogDescription className="mt-1 text-[13px] text-ink/60">
          Kontaktiniai duomenys naudojami siuntoms ir pristatymui.
        </DialogDescription>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Field label="Vardas" value={v.name} onChange={set("name")} placeholder="Jonas" />
          <Field label="Pavardė" value={v.last_name} onChange={set("last_name")} placeholder="Jonaitis" />
          <div className="col-span-2">
            <Field label="Telefonas" value={v.phone} onChange={set("phone")} placeholder="+37060000000" type="tel" />
          </div>
          <div className="col-span-2">
            <Field label="Gatvė" value={v.street} onChange={set("street")} placeholder="Pasakų g." />
          </div>
          <Field label="Namo nr." value={v.house_no} onChange={set("house_no")} placeholder="10" />
          <Field label="Buto nr." value={v.flat} onChange={set("flat")} placeholder="1" />
          <Field label="Miestas" value={v.city} onChange={set("city")} placeholder="Vilnius" />
          <Field label="Pašto kodas" value={v.postal_code} onChange={set("postal_code")} placeholder="10103" />
        </div>

        {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}

        <div className="mt-6 flex gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="brick-hover-sm flex-1 rounded-[24px] border-2 border-ink bg-brand-orange px-6 py-3.5 font-display text-[20px] text-paper transition-all disabled:opacity-40"
          >
            {saving ? "Saugoma…" : "Išsaugoti"}
          </button>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-[24px] border-2 border-ink/20 px-6 py-3 font-mono text-[13px] font-bold text-ink/60 transition-colors hover:border-ink hover:text-ink"
          >
            Atšaukti
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
