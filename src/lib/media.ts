// Large videos are served from Supabase Storage (public `site-media` bucket) rather
// than the Vercel static deploy — files >~19MB were being dropped on deploy and served
// as the SPA index.html fallback. hero-video is reused for the Subscribe hero (identical file).
// Derived from VITE_SUPABASE_URL rather than hardcoded: the project ref is
// baked into every Storage URL, so a hardcoded host silently serves 404s the
// moment the project changes.
const SITE_MEDIA = `${import.meta.env.VITE_SUPABASE_URL as string}/storage/v1/object/public/site-media`

export const HERO_VIDEO_URL = `${SITE_MEDIA}/hero-video.mp4`
export const PROMO_VIDEO_URL = `${SITE_MEDIA}/promo.mp4`
