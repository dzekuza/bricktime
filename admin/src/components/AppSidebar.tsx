import { NavLink, useLocation } from 'react-router-dom'
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
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
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
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const navMain = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboardIcon },
  { label: 'Products', to: '/products', icon: PackageIcon },
  { label: 'Subscribers', to: '/subscribers', icon: UsersIcon },
  { label: 'Plans', to: '/plans', icon: CreditCardIcon },
  { label: 'Orders', to: '/orders', icon: ShoppingCartIcon },
  { label: 'Coupons', to: '/coupons', icon: TicketIcon },
  { label: 'Missing Parts', to: '/missing-parts', icon: WrenchIcon },
  { label: 'Merch', to: '/merch', icon: ShirtIcon },
  { label: 'Gift Cards', to: '/gift-cards', icon: GiftIcon },
]

const navSecondary = [
  { label: 'Settings', to: '/settings', icon: SettingsIcon },
]

export function AppSidebar() {
  const { pathname } = useLocation()
  const { session, signOut } = useAuth()

  function isActive(to: string) {
    return to === '/' ? pathname === '/' : pathname.startsWith(to)
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
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navMain.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild isActive={isActive(item.to)} tooltip={item.label}>
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

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navSecondary.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild isActive={isActive(item.to)} tooltip={item.label}>
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
                  {session?.user.email?.[0].toUpperCase() ?? 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-0.5 leading-none min-w-0">
                <span className="font-semibold text-sm truncate">{session?.user.email ?? ''}</span>
                <span className="text-xs text-muted-foreground">Admin</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} className="text-muted-foreground hover:text-destructive">
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
