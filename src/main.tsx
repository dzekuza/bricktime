import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"

if (import.meta.env.DEV) {
  import("react-grab").then(({ unregisterPlugin, registerPlugin, claudeChatPlugin }) => {
    unregisterPlugin("comment") // free up Enter key
    registerPlugin(claudeChatPlugin) // Enter → Send to Claude
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
