import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { avatarSrc } from "@/lib/avatars"
import { Button } from "@/components/ui/button"
import { ReviewForm } from "@/components/reviews/ReviewForm"
import { StarRating } from "@/components/reviews/StarRating"

interface Review {
  id: string
  subscriber_id: string
  rating: number
  body: string | null
  approved: boolean
  created_at: string
}

interface Author {
  name: string
  avatarId: number
}

export function ProductReviews({ productId }: { productId: number }) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [authors, setAuthors] = useState<Record<string, Author>>({})
  const [canReview, setCanReview] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("product_reviews")
      .select("id, subscriber_id, rating, body, approved, created_at")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
    const rows = data ?? []
    setReviews(rows)

    const ids = [...new Set(rows.map((r) => r.subscriber_id))]
    if (ids.length === 0) return
    const { data: profiles } = await supabase
      .from("public_profiles")
      .select("id, name, avatar_id")
      .in("id", ids)
    setAuthors(
      Object.fromEntries(
        (profiles ?? []).map((p) => [
          p.id,
          { name: p.name ?? "Narys", avatarId: p.avatar_id ?? 0 },
        ])
      )
    )
  }, [productId])

  useEffect(() => {
    load()
  }, [load])

  // Only members who have had this set can review it (enforced by RLS too).
  useEffect(() => {
    if (!user) {
      setCanReview(false)
      return
    }
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("subscriber_id", user.id)
      .eq("product_id", productId)
      .neq("status", "processing")
      .then(({ count }) => setCanReview((count ?? 0) > 0))
  }, [user, productId])

  const approved = useMemo(() => reviews.filter((r) => r.approved), [reviews])
  const own = reviews.find((r) => r.subscriber_id === user?.id)
  const average = approved.length
    ? approved.reduce((sum, r) => sum + r.rating, 0) / approved.length
    : 0

  async function removeOwn() {
    if (!own) return
    await supabase.from("product_reviews").delete().eq("id", own.id)
    load()
  }

  if (approved.length === 0 && !canReview && !own) return null

  return (
    <section className="bg-paper py-4">
      <div className="mx-auto max-w-[1320px] px-4 md:px-7">
        <div className="brick-card bg-paper p-6 md:p-8">
          <p className="label-mono text-ink/40">Atsiliepimai</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h2 className="heading-display text-d-sm text-ink">
              {approved.length > 0 ? average.toFixed(1) : "Dar nėra įvertinimų"}
            </h2>
            {approved.length > 0 && (
              <>
                <StarRating value={Math.round(average)} />
                <span className="font-mono text-[12px] text-ink/50">
                  {approved.length} atsiliepimai
                </span>
              </>
            )}
          </div>

          {approved.length > 0 && (
            <div className="mt-6 flex flex-col gap-3">
              {approved.map((review) => (
                <div
                  key={review.id}
                  className="rounded-2xl border-2 border-ink/10 bg-ink/[.02] p-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={avatarSrc(
                        authors[review.subscriber_id]?.avatarId ?? 0
                      )}
                      alt=""
                      className="size-8 rounded-full border-2 border-ink object-cover"
                    />
                    <span className="text-[14px] font-bold text-ink">
                      {authors[review.subscriber_id]?.name ?? "Narys"}
                    </span>
                    <StarRating value={review.rating} />
                  </div>
                  {review.body && (
                    <p className="mt-2 text-[14px] leading-[1.6] text-ink/70">
                      {review.body}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {user && canReview && (
            <div className="mt-6 border-t-2 border-dashed border-ink/10 pt-6">
              {own ? (
                <div className="flex flex-col gap-2">
                  <p className="label-mono text-ink/40">Tavo atsiliepimas</p>
                  <StarRating value={own.rating} />
                  {own.body && (
                    <p className="text-[14px] text-ink/70">{own.body}</p>
                  )}
                  <p className="font-mono text-[11px] text-ink/40">
                    {own.approved
                      ? "Paskelbta."
                      : "Laukia patvirtinimo – netrukus pasirodys čia."}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={removeOwn}
                    className="h-9 w-fit rounded-full border-2 border-ink bg-transparent px-4 text-[13px] font-bold text-ink"
                  >
                    Ištrinti ir rašyti iš naujo
                  </Button>
                </div>
              ) : (
                <ReviewForm
                  productId={productId}
                  subscriberId={user.id}
                  onSubmitted={load}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
