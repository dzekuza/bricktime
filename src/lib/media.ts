// Large videos are served from Supabase Storage (public `site-media` bucket) rather
// than the Vercel static deploy — files >~19MB were being dropped on deploy and served
// as the SPA index.html fallback. hero-video is reused for the Subscribe hero (identical file).
const SITE_MEDIA =
  "https://ohofugyndkaalzsyobvb.supabase.co/storage/v1/object/public/site-media"

export const HERO_VIDEO_URL = `${SITE_MEDIA}/hero-video.mp4`
export const PROMO_VIDEO_URL = `${SITE_MEDIA}/promo.mp4`
