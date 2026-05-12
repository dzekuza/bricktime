import { useEffect, useState } from 'react'

export default function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const finish = () => {
      setFading(true)
      setTimeout(onDone, 500)
    }

    const timer = setTimeout(finish, 2800)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{
        background: '#ffffff',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.5s ease',
        pointerEvents: fading ? 'none' : 'all',
      }}
    >
      <video
        src="/nav-logo.mov"
        autoPlay
        loop
        muted
        playsInline
        className="h-32 w-auto object-contain"
      />

      {/* Loading bar */}
      <div className="mt-10 h-[2px] w-40 overflow-hidden rounded-full bg-ink/10">
        <div
          className="h-full rounded-full bg-ink"
          style={{
            animation: 'loader-bar 2.5s ease-in-out forwards',
          }}
        />
      </div>

      <style>{`
        @keyframes loader-bar {
          0%   { width: 0% }
          60%  { width: 75% }
          90%  { width: 92% }
          100% { width: 100% }
        }
      `}</style>
    </div>
  )
}
