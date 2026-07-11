import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"

if (import.meta.env.DEV) {
  // @ts-expect-error -- react-grab has no types
  import("react-grab").then(
    ({
      unregisterPlugin,
      registerPlugin,
      claudeChatPlugin,
    }: {
      unregisterPlugin: (s: string) => void
      registerPlugin: (p: unknown) => void
      claudeChatPlugin: unknown
    }) => {
      unregisterPlugin("comment")
      registerPlugin(claudeChatPlugin)
    }
  )
}

import "./index.css"
import App from "./App.tsx"
import { BreadcrumbProvider } from "@/contexts/BreadcrumbContext"
import { AuthProvider } from "@/contexts/AuthContext"
import { SubscriptionsProvider } from "@/contexts/SubscriptionsContext"
import { ConsentProvider } from "@/contexts/ConsentContext"

// Prevent browser from restoring scroll position on reload so hero animation always plays
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual"
}
window.scrollTo(0, 0)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ConsentProvider>
        <AuthProvider>
          <SubscriptionsProvider>
            <BreadcrumbProvider>
              <App />
            </BreadcrumbProvider>
          </SubscriptionsProvider>
        </AuthProvider>
      </ConsentProvider>
    </BrowserRouter>
  </StrictMode>
)
