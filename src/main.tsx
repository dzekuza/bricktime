import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { HelmetProvider } from "react-helmet-async"

if (import.meta.env.DEV) {
  import("react-grab").then((mod) => {
    const { unregisterPlugin, registerPlugin, claudeChatPlugin } =
      mod as unknown as {
        unregisterPlugin: (s: string) => void
        registerPlugin: (p: unknown) => void
        claudeChatPlugin: unknown
      }
    unregisterPlugin("comment")
    registerPlugin(claudeChatPlugin)
  })
}

import "./index.css"
import App from "./App.tsx"
import { BreadcrumbProvider } from "@/contexts/BreadcrumbContext"
import { AuthProvider } from "@/contexts/AuthContext"
import { SubscriptionsProvider } from "@/contexts/SubscriptionsContext"
import { ConsentProvider } from "@/contexts/ConsentContext"
import { MerchCartProvider } from "@/contexts/MerchCartContext"
import { RentalCartProvider } from "@/contexts/RentalCartContext"

// Drop the build-time meta tags (scripts/postbuild-seo.mjs) so <Seo> is the only source
// once the app mounts, instead of leaving duplicate canonical/OG tags behind.
document.querySelectorAll("[data-prerender]").forEach((el) => el.remove())

// Prevent browser from restoring scroll position on reload so hero animation always plays
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual"
}
window.scrollTo(0, 0)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <ConsentProvider>
          <AuthProvider>
            <SubscriptionsProvider>
              <BreadcrumbProvider>
                <MerchCartProvider>
                  <RentalCartProvider>
                    <App />
                  </RentalCartProvider>
                </MerchCartProvider>
              </BreadcrumbProvider>
            </SubscriptionsProvider>
          </AuthProvider>
        </ConsentProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>
)
