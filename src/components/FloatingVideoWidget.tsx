import { useState, useEffect } from 'react'
import { XIcon } from 'lucide-react'

export default function FloatingVideoWidget() {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 2200)
    return () => clearTimeout(t)
  }, [])

  if (dismissed) return null

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        pointerEvents: visible ? 'all' : 'none',
      }}
    >
      {/* Speech bubble */}
      <div
        className="relative mr-10 rounded-2xl px-4 py-2 text-[14px] font-bold text-paper shadow-[4px_4px_0_#001B21]"
        style={{ background: '#001B21' }}
      >
        Sveiki! 👋
        {/* Tail */}
        <span
          className="absolute -bottom-[7px] right-6 h-0 w-0"
          style={{
            borderLeft: '7px solid transparent',
            borderRight: '7px solid transparent',
            borderTop: '8px solid #001B21',
          }}
        />
      </div>

      {/* Video card */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-ink shadow-[6px_6px_0_#001B21]" style={{ width: 260 }}>
        <video
          src="/loader.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="block w-full"
          style={{ aspectRatio: '9/14', objectFit: 'cover' }}
        />

        {/* Close button */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-ink text-paper transition-transform hover:scale-110"
          aria-label="Uždaryti"
        >
          <XIcon className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
