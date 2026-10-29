"use client"

import * as React from "react"
import {
  LayoutDashboardIcon,
  UsersIcon,
  FileTextIcon,
  CreditCardIcon,
  Building2Icon,
  GitBranchIcon,
  ShieldCheckIcon,
  PlaneTakeoffIcon,
  Settings2Icon,
  CircleHelpIcon,
} from "lucide-react"

import { NavMain, type NavItem } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuthStore } from "@/lib/authStore"

const coreNav: (NavItem & { permission: string })[] = [
  { id: "dashboard", title: "Dashboard", icon: <LayoutDashboardIcon />, permission: "FullAccess" },
  { id: "customers", title: "Customer CRM", icon: <UsersIcon />, permission: "customers.read" },
  { id: "invoices", title: "Invoices", icon: <FileTextIcon />, permission: "invoices.read" },
  { id: "payments", title: "Payments", icon: <CreditCardIcon />, permission: "payments.read" },
]

const orgNav: (NavItem & { permission: string })[] = [
  { id: "departments", title: "Departments", icon: <Building2Icon />, permission: "departments.manage" },
  { id: "branches", title: "Branches", icon: <GitBranchIcon />, permission: "branches.manage" },
  { id: "rbac", title: "Roles & Users", icon: <ShieldCheckIcon />, permission: "users.manage" },
]

const secondaryNav = [
  { title: "Settings", url: "#", icon: <Settings2Icon /> },
  { title: "Get Help", url: "#", icon: <CircleHelpIcon /> },
]

export function AppSidebar({
  activeTab,
  onTabChange,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  activeTab: string
  onTabChange: (id: string) => void
}) {
  const { user, hasPermission } = useAuthStore()
  const allowed = (i: { permission: string }) =>
    i.permission === "FullAccess" || hasPermission(i.permission)

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              onClick={() => onTabChange("dashboard")}
            >
              <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <PlaneTakeoffIcon className="size-4!" />
              </span>
              <span className="text-base font-semibold">Wahana Travel</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={coreNav.filter(allowed)}
          activeId={activeTab}
          onSelect={onTabChange}
          showQuickCreate={hasPermission("invoices.create")}
        />
        <NavMain
          label="Organization"
          items={orgNav.filter(allowed)}
          activeId={activeTab}
          onSelect={onTabChange}
        />
        <NavSecondary items={secondaryNav} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user?.fullName ?? "Guest",
            email: user?.email ?? "",
            avatar: "",
            role: user?.role ?? "",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
