const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as
  | string
  | undefined
const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string | undefined

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    fbq?: ((...args: unknown[]) => void) & {
      callMethod?: (...args: unknown[]) => void
      queue?: unknown[]
      loaded?: boolean
      version?: string
    }
    _fbq?: Window["fbq"]
  }
}

let gaLoaded = false
let pixelLoaded = false

export function loadGoogleAnalytics() {
  if (gaLoaded || !GA_MEASUREMENT_ID) return
  gaLoaded = true

  const script = document.createElement("script")
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer ?? []
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args)
  }
  window.gtag("js", new Date())
  window.gtag("config", GA_MEASUREMENT_ID)
}

export function loadMetaPixel() {
  if (pixelLoaded || !META_PIXEL_ID) return
  pixelLoaded = true

  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args)
    else fbq.queue!.push(args)
  } as NonNullable<Window["fbq"]>
  fbq.queue = []
  fbq.loaded = true
  fbq.version = "2.0"
  window.fbq = fbq
  window._fbq = fbq

  const script = document.createElement("script")
  script.async = true
  script.src = "https://connect.facebook.net/en_US/fbevents.js"
  document.head.appendChild(script)

  window.fbq("init", META_PIXEL_ID)
  window.fbq("track", "PageView")
}

export function trackPageview(path: string) {
  if (gaLoaded) window.gtag?.("event", "page_view", { page_path: path })
  if (pixelLoaded) window.fbq?.("track", "PageView")
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (gaLoaded) window.gtag?.("event", name, params)
  if (pixelLoaded) window.fbq?.("trackCustom", name, params)
}
