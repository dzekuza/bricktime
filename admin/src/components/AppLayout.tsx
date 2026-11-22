import { useEffect, useRef } from "react"
import { Link, Outlet, useLocation } from "react-router-dom"
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { AppSidebar } from "@/components/AppSidebar"
import { GlobalSearch } from "@/components/GlobalSearch"
import { Toaster } from "@/components/ui/toaster"
import { getDocumentTitle, getRouteTitle } from "@/lib/routes"

export function AppLayout() {
  const { pathname } = useLocation()
  const pageTitle = getRouteTitle(pathname)
  const isFirstRender = useRef(true)

  useEffect(() => {
    document.title = getDocumentTitle(pathname)
    // Skip the initial load so the browser's own focus handling is kept.
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const target =
      document.querySelector<HTMLElement>("#main-content h1") ??
      document.getElementById("main-content")
    if (target) {
      target.tabIndex = -1
      target.focus({ preventScroll: true })
    }
  }, [pathname])

  return (
    <SidebarProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-md focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">BRICKTIME</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {pathname !== "/" && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
          <GlobalSearch />
        </header>
        <div
          id="main-content"
          className="flex min-w-0 flex-1 flex-col gap-6 p-4 outline-none md:p-6"
        >
          <Outlet />
        </div>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  )
}
