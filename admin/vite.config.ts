import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
// Served under /admin of the storefront deployment: assets are prefixed with
// /admin/ and the build lands in the storefront's dist/admin.
export default defineConfig({
  base: "/admin/",
  build: {
    outDir: "../dist/admin",
    emptyOutDir: true,
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
