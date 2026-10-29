"use client";

import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/authStore";
import LoginForm from "@/components/LoginForm";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import DashboardView from "@/components/DashboardView";
import CustomersView from "@/components/CustomersView";
import InvoicesView from "@/components/InvoicesView";
import PaymentsView from "@/components/PaymentsView";
import DepartmentsView from "@/components/DepartmentsView";
import BranchesView from "@/components/BranchesView";
import RbacUsersView from "@/components/RbacUsersView";

const TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  customers: "Customer CRM",
  invoices: "Invoices",
  payments: "Payments",
  departments: "Departments",
  branches: "Branches",
  rbac: "Roles & Users",
};

export default function Home() {
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [currentTab, setCurrentTab] = useState("dashboard");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
        <div className="flex items-center gap-3">
          <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm font-semibold">WahanaTravel Admin Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" activeTab={currentTab} onTabChange={setCurrentTab} />
      <SidebarInset>
        <SiteHeader title={TITLES[currentTab] ?? "Dashboard"} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {currentTab === "dashboard" ? (
              <DashboardView />
            ) : (
              <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
                {currentTab === "customers" && <CustomersView />}
                {currentTab === "invoices" && <InvoicesView />}
                {currentTab === "payments" && <PaymentsView />}
                {currentTab === "departments" && <DepartmentsView />}
                {currentTab === "branches" && <BranchesView />}
                {currentTab === "rbac" && <RbacUsersView />}
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
