import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { supabase } from "@/lib/supabase"
import { avatarSrc } from "@/lib/avatars"
import { achievementDefs, getRelativeTime, drops } from "@/data/community"
import { getPlanDisplayName } from "@/lib/plan-branding"

const tierColors: Record<string, string> = {
  mega: "#FB4903",
  pro: "#4DA2FF",
  standard: "#FFD731",
  mini: "#FFAEE7",
  nano: "#F5F1EB",
}
const tierLabel: Record<string, string> = {
  mega: getPlanDisplayName("mega"),
  pro: getPlanDisplayName("pro"),
  standard: getPlanDisplayName("standard"),
  mini: getPlanDisplayName("mini"),
  nano: getPlanDisplayName("nano"),
}

interface UserProfile {
  id: string
  name: string
  avatar_id: number
  avatar_bg: string
  plan: string | null
  joined_at: string | null
  post_count: number
  likes_received: number
}

interface FeedPost {
  id: string
  type: string
  body: string | null
  image_url: string | null
  drop_num: number | null
  like_count: number
  created_at: string
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    Promise.all([
      supabase.from("user_profile_view").select("*").eq("id", userId).single(),
      supabase
        .from("feed_items")
        .select("id, type, body, image_url, drop_num, like_count, created_at")
        .eq("subscriber_id", userId)
        .is("parent_id", null)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("user_achievements")
        .select("achievement_id")
        .eq("subscriber_id", userId),
    ]).then(([{ data: prof }, { data: feedData }, { data: achData }]) => {
      if (prof) setProfile(prof as unknown as UserProfile)
      if (feedData) setPosts(feedData as FeedPost[])
      if (achData)
        setUnlockedIds(
          new Set(
            achData.map((a: { achievement_id: string }) => a.achievement_id)
          )
        )
      setLoading(false)
    })
  }, [userId])

  if (loading) {
    return (
      <div className="min-h-screen bg-paper">
        <Nav />
        <div className="mx-auto max-w-[1320px] px-4 py-20 md:px-7">
          <div className="animate-pulse space-y-4">
            <div className="h-40 rounded-3xl bg-ink/10" />
            <div className="h-20 rounded-2xl bg-ink/5" />
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-paper">
        <Nav />
        <div className="mx-auto max-w-[1320px] px-4 py-20 text-center md:px-7">
          <p className="font-mono text-ink/40">Profilis nerastas.</p>
          <Link
            to="/community"
            className="mt-4 inline-block font-mono text-[13px] text-ink underline"
          >
            ← Bendruomenė
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  const planBg = tierColors[profile.plan ?? ""] ?? "#F5F1EB"
  const planName = tierLabel[profile.plan ?? ""] ?? profile.plan ?? "–"
  const builds = posts.filter((p) => p.type === "build_photo")
  const comments = posts.filter((p) => p.type === "comment")

  return (
    <div className="min-h-screen bg-paper">
      <Nav />

      <section className="bg-paper py-6 md:pb-16">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
          {/* Back */}
          <Link
            to="/community"
            className="mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] tracking-widest text-ink/40 uppercase transition-colors hover:text-ink"
          >
            ← Bendruomenė
          </Link>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            {/* Avatar + name tile — sticky */}
            <div className="flex flex-col rounded-2xl border-2 border-ink bg-ink p-6 shadow-[6px_6px_0_#FFD731] md:rounded-3xl md:p-8 lg:sticky lg:top-24 lg:col-span-4">
              <div
                className="mb-4 size-20 overflow-hidden rounded-full border-2 border-paper/20"
                style={{ background: profile.avatar_bg }}
              >
                <img
                  src={avatarSrc(profile.avatar_id)}
                  alt={profile.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <h1 className="heading-display text-d-lg leading-[.9] text-paper">
                {profile.name}
              </h1>
              {profile.joined_at && (
                <p className="mt-2 font-mono text-[11px] tracking-widest text-paper/40 uppercase">
                  Narys nuo{" "}
                  {new Date(profile.joined_at).toLocaleDateString("lt-LT", {
                    year: "numeric",
                    month: "long",
                  })}
                </p>
              )}
              <div className="mt-6 grid grid-cols-3 gap-2">
                {[
                  { val: profile.post_count, label: "Įrašai" },
                  { val: builds.length, label: "Statybos" },
                  { val: profile.likes_received, label: "Patiktukai" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl border border-paper/15 p-2.5"
                  >
                    <p className="font-display text-[22px] leading-none text-paper">
                      {s.val}
                    </p>
                    <p className="mt-1 font-mono text-[9px] tracking-widest text-paper/40 uppercase">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-auto pt-6">
                <span
                  className="inline-block rounded-full border border-paper/20 px-3 py-1 font-mono text-[11px] font-bold tracking-widest uppercase"
                  style={{ background: planBg, color: "#001B21" }}
                >
                  {planName}
                </span>
              </div>
            </div>

            {/* Posts column */}
            <div className="flex flex-col gap-6 lg:col-span-8">
              {/* Achievements */}
              {unlockedIds.size > 0 && (
                <div>
                  <h2 className="mb-4 text-xl font-bold text-ink">
                    Pažymėjimai
                  </h2>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                    {achievementDefs
                      .filter((def) => unlockedIds.has(def.id))
                      .map((def) => (
                        <div
                          key={def.id}
                          className="flex flex-col items-start rounded-2xl border-2 border-ink p-3 shadow-[4px_4px_0_#001B21] transition-all hover:-translate-y-0.5"
                          style={{ background: def.color }}
                        >
                          {def.image ? (
                            <img
                              src={def.image}
                              alt={def.label}
                              className="h-9 w-9 object-contain"
                            />
                          ) : (
                            <span className="text-2xl">{def.icon}</span>
                          )}
                          <p className="mt-2 text-[12px] leading-tight font-bold text-ink">
                            {def.label}
                          </p>
                          <p className="mt-0.5 font-mono text-[10px] text-ink/50">
                            +{def.points} taškai
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Builds */}
              {builds.length > 0 && (
                <div>
                  <h2 className="mb-4 text-xl font-bold text-ink">Statybos</h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {builds.map((post) => {
                      const drop = drops.find((d) => d.id === post.drop_num)
                      return (
                        <div
                          key={post.id}
                          className="brick-card overflow-hidden"
                        >
                          {post.image_url && (
                            <div className="aspect-video overflow-hidden border-b-2 border-ink">
                              <img
                                src={post.image_url}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )}
                          <div className="p-4">
                            {post.body && (
                              <p className="mb-2 text-[14px] text-ink/80">
                                {post.body}
                              </p>
                            )}
                            <div className="flex items-center justify-between">
                              {drop ? (
                                <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-ink/40 uppercase">
                                  <span
                                    className="size-3 rounded-sm"
                                    style={{ background: drop.bg }}
                                  />
                                  {drop.title}
                                </span>
                              ) : post.drop_num ? (
                                <span className="font-mono text-[10px] tracking-widest text-ink/30 uppercase">
                                  №{post.drop_num}
                                </span>
                              ) : (
                                <span />
                              )}
                              <span className="font-mono text-[10px] text-ink/30">
                                {getRelativeTime(post.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Comments / posts */}
              {comments.length > 0 && (
                <div>
                  <h2 className="mb-4 text-xl font-bold text-ink">
                    Komentarai
                  </h2>
                  <div className="flex flex-col gap-3">
                    {comments.map((post) => (
                      <div key={post.id} className="brick-card p-4">
                        <blockquote
                          className="border-l-4 pl-3 text-[14px] text-ink/70 italic"
                          style={{ borderColor: "#5DDB9C" }}
                        >
                          {post.body}
                        </blockquote>
                        <p className="mt-2 font-mono text-[10px] text-ink/30">
                          {getRelativeTime(post.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {posts.length === 0 && (
                <p className="py-12 text-center font-mono text-[13px] text-ink/40">
                  Kol kas nėra įrašų.
                </p>
              )}
            </div>
            {/* end posts column */}
          </div>
          {/* end two-column layout */}
        </div>
      </section>

      <Footer />
    </div>
  )
}
