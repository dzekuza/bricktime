/** Page titles by route; drives the document title and the breadcrumb. */
export const ROUTE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/analytics": "Analytics",
  "/products": "Products",
  "/merch": "Merch",
  "/content": "Content",
  "/orders": "Orders",
  "/plans": "Plans",
  "/coupons": "Coupons",
  "/gift-cards": "Gift Cards",
  "/subscribers": "Customers & Subscribers",
  "/reviews": "Reviews",
  "/missing-parts": "Missing Parts",
  "/achievements": "Rewards",
  "/points": "Points",
  "/challenges": "Challenges",
  "/community": "Community",
  "/settings": "Settings",
}

const APP_NAME = "BRICKTIME Admin"

export function getRouteTitle(pathname: string): string {
  return ROUTE_TITLES[pathname] ?? "Page"
}

export function getDocumentTitle(pathname: string): string {
  return `${getRouteTitle(pathname)} | ${APP_NAME}`
}
