import { useState, useEffect, useRef } from "react"
import { XIcon } from "lucide-react"
import { PROMO_VIDEO_URL } from "@/lib/media"
import { supabase } from "@/lib/supabase"

export default function FloatingVideoWidget() {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [videoUrl, setVideoUrl] = useState(PROMO_VIDEO_URL)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 2200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    supabase
      .from("home_content")
      .select("promo_video_url")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (data?.promo_video_url) setVideoUrl(data.promo_video_url)
      })
  }, [])

  function toggleExpand() {
    const next = !expanded
    setExpanded(next)
    if (videoRef.current) videoRef.current.muted = !next
  }

  function dismiss() {
    setVisible(false)
    setTimeout(() => setDismissed(true), 400)
  }

  if (dismissed) return null

  return (
    <div
      className="fixed right-6 bottom-6 z-50 flex flex-col items-end gap-2"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition:
          "opacity 0.4s cubic-bezier(0.22,1,0.36,1), transform 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        pointerEvents: visible ? "all" : "none",
      }}
    >
      {/* Speech bubble */}
      <div className="relative mr-5 rounded-xl bg-ink px-3 py-1.5 text-[12px] font-bold text-paper shadow-[3px_3px_0_#001B21]">
        Sveiki! 👋
        <span
          className="absolute right-4 -bottom-[6px] h-0 w-0"
          style={{
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: "6px solid #001B21",
          }}
        />
      </div>

      {/* Video card */}
      <div
        className="relative cursor-pointer overflow-hidden rounded-xl border-2 border-ink shadow-[4px_4px_0_#001B21]"
        style={{
          width: expanded ? 220 : 130,
          transition: "width 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        }}
        onClick={toggleExpand}
      >
        <video
          ref={videoRef}
          key={videoUrl}
          src={videoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="block w-full"
          style={{ aspectRatio: "9/16", objectFit: "cover" }}
        />

        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            dismiss()
          }}
          className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-ink text-paper transition-transform hover:scale-110 active:scale-95"
          aria-label="Uždaryti"
        >
          <XIcon className="size-3" />
        </button>
      </div>
    </div>
  )
}
