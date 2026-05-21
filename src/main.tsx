import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"

if (import.meta.env.DEV) {
  (window as any).__REACT_GRAB_DISABLED__ = true
  import("react-grab").then(({ mountClaudeChatPanel }) => {
    mountClaudeChatPanel()
  })
}

import "./index.css"
import App from "./App.tsx"
import { BreadcrumbProvider } from "@/contexts/BreadcrumbContext"

// Prevent browser from restoring scroll position on reload so hero animation always plays
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual'
}
window.scrollTo(0, 0)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <BreadcrumbProvider>
        <App />
      </BreadcrumbProvider>
    </BrowserRouter>
  </StrictMode>
)
