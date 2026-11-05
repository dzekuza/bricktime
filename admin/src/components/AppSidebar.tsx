import { NavLink, useLocation } from "react-router-dom"
import {
  LayoutDashboardIcon,
  PackageIcon,
  UsersIcon,
  CreditCardIcon,
  ShoppingCartIcon,
  SettingsIcon,
  BrickWallIcon,
  LogOutIcon,
  TicketIcon,
  WrenchIcon,
  ShirtIcon,
  GiftIcon,
  FileTextIcon,
  LineChartIcon,
  TrophyIcon,
  MessageSquareIcon,
  FlagIcon,
  AwardIcon,
  StarIcon,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const navGroups = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", to: "/", icon: LayoutDashboardIcon },
      { label: "Analytics", to: "/analytics", icon: LineChartIcon },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", to: "/products", icon: PackageIcon },
      { label: "Merch", to: "/merch", icon: ShirtIcon },
      { label: "Content", to: "/content", icon: FileTextIcon },
    ],
  },
  {
    label: "Sales",
    items: [
      { label: "Orders", to: "/orders", icon: ShoppingCartIcon },
      { label: "Plans", to: "/plans", icon: CreditCardIcon },
      { label: "Coupons", to: "/coupons", icon: TicketIcon },
      { label: "Gift Cards", to: "/gift-cards", icon: GiftIcon },
    ],
  },
  {
    label: "Customers",
    items: [
      { label: "Customers & Subscribers", to: "/subscribers", icon: UsersIcon },
      { label: "Reviews", to: "/reviews", icon: StarIcon },
      { label: "Missing Parts", to: "/missing-parts", icon: WrenchIcon },
    ],
  },
  {
    label: "Engagement",
    items: [
      { label: "Rewards", to: "/achievements", icon: TrophyIcon },
      { label: "Points", to: "/points", icon: AwardIcon },
      { label: "Challenges", to: "/challenges", icon: FlagIcon },
      { label: "Community", to: "/community", icon: MessageSquareIcon },
    ],
  },
]

const navSecondary = [
  { label: "Settings", to: "/settings", icon: SettingsIcon },
]

export function AppSidebar() {
  const { pathname } = useLocation()
  const { session, signOut } = useAuth()

  function isActive(to: string) {
    return to === "/" ? pathname === "/" : pathname.startsWith(to)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <NavLink to="/">
                <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <BrickWallIcon className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">BRICKTIME</span>
                  <span className="text-xs text-muted-foreground">Admin</span>
                </div>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.to)}
                      tooltip={item.label}
                    >
                      <NavLink to={item.to}>
                        <item.icon />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {navSecondary.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.to)}
                    tooltip={item.label}
                  >
                    <NavLink to={item.to}>
                      <item.icon />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="cursor-default">
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg">
                  {session?.user.email?.[0].toUpperCase() ?? "A"}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col gap-0.5 leading-none">
                <span className="truncate text-sm font-semibold">
                  {session?.user.email ?? ""}
                </span>
                <span className="text-xs text-muted-foreground">Admin</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={signOut}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOutIcon className="size-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
