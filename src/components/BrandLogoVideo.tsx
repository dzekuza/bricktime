import { useEffect, useRef } from "react"

interface BrandLogoVideoProps {
  className?: string
}

// iOS Safari sometimes blocks autoplay despite the muted/autoPlay attributes,
// leaving the video paused on frame one with a native tap-to-play affordance.
// Re-asserting `muted` and calling `play()` imperatively avoids that.
export default function BrandLogoVideo({ className }: BrandLogoVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = true
    video.play().catch(() => {})
  }, [])

  return (
    <video
      ref={videoRef}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      disablePictureInPicture
      className={className}
    >
      <source src="/nav-logo.mov" type="video/mp4" />
    </video>
  )
}
