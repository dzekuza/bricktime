import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { StarRating } from "@/components/reviews/StarRating"

interface ReviewFormProps {
  productId: number
  subscriberId: string
  onSubmitted: () => void
}

export function ReviewForm({
  productId,
  subscriberId,
  onSubmitted,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [body, setBody] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function submit() {
    if (rating === 0) {
      setError("Pasirink įvertinimą.")
      return
    }
    setSaving(true)
    setError("")
    const { error: insertError } = await supabase
      .from("product_reviews")
      .insert({
        product_id: productId,
        subscriber_id: subscriberId,
        rating,
        body: body.trim() || null,
      })
    setSaving(false)
    if (insertError) {
      setError("Nepavyko išsaugoti atsiliepimo. Bandyk dar kartą.")
      return
    }
    onSubmitted()
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="label-mono text-ink/40">Tavo atsiliepimas</p>
      <StarRating value={rating} onChange={setRating} />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="Kaip sekėsi konstruoti? (nebūtina)"
        className="w-full resize-none rounded-2xl border-2 border-ink/20 bg-paper p-3 text-[14px] text-ink outline-none placeholder:text-ink/30 focus:border-ink"
      />
      {error && (
        <p className="font-mono text-[12px] text-brand-orange">{error}</p>
      )}
      <Button
        type="button"
        onClick={submit}
        disabled={saving}
        className="brick-hover-sm h-11 w-fit rounded-full border-2 border-ink bg-ink px-6 text-[14px] font-bold text-paper"
      >
        {saving ? "Siunčiama…" : "Pateikti atsiliepimą"}
      </Button>
      <p className="font-mono text-[11px] text-ink/40">
        Atsiliepimas bus paskelbtas, kai jį patvirtins mūsų komanda.
      </p>
    </div>
  )
}
