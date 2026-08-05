import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

const DEFAULT_ITEMS = [
  { text: "STATYK", avatarUrl: "/avatars/avatar-classic.png" },
  { text: "RINK", avatarUrl: "/avatars/avatar-beanie.png" },
  { text: "KARTOK", avatarUrl: "/avatars/avatar-ninja.png" },
  {
    text: "NAUJAS PRODUKTAS KAS SAVAITĘ",
    avatarUrl: "/avatars/avatar-robot.png",
  },
  { text: "NEMOKAMAS PRISTATYMAS", avatarUrl: "/avatars/avatar-wizard.png" },
  { text: "PRALEISK BET KADA", avatarUrl: "/avatars/avatar-classic.png" },
]

export default function Marquee() {
  const [items, setItems] = useState(DEFAULT_ITEMS)

  useEffect(() => {
    supabase
      .from("home_marquee_items")
      .select("text, avatar_url")
      .order("sort_order")
      .then(({ data }) => {
        if (!data || data.length === 0) return
        setItems(
          data.map((item) => ({
            text: item.text,
            avatarUrl: item.avatar_url ?? "",
          }))
        )
      })
  }, [])

  const repeated = [...items, ...items]

  return (
    <div className="overflow-hidden border-t-2 border-b-2 border-ink bg-paper text-ink">
      <div className="marquee-track text-d-sm flex gap-12 py-[18px] font-display tracking-[-0.005em] whitespace-nowrap">
        {repeated.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-12">
            {item.text}
            {item.avatarUrl && (
              <img
                src={item.avatarUrl}
                alt=""
                className="size-10 rounded-full border-2 border-ink object-cover"
              />
            )}
          </span>
        ))}
      </div>
    </div>
  )
}
