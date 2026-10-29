"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import { DashboardStats } from "@/lib/types";
import { SectionCards } from "@/components/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2Icon, GitBranchIcon } from "lucide-react";

export default function DashboardView() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: () => apiFetch<DashboardStats>("/api/v1/dashboard/stats"),
  });

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards stats={stats} isLoading={isLoading} />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @3xl/main:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Organizational Scope</CardTitle>
            <CardDescription>Active operating entities & branch network</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Building2Icon className="size-4" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">Departments Active</div>
                <div className="text-xs text-muted-foreground">Hierarchical operations & FAT units</div>
              </div>
              <span className="text-xl font-semibold tabular-nums">{stats?.totalDepartments ?? 0}</span>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <GitBranchIcon className="size-4" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">Branch Network</div>
                <div className="text-xs text-muted-foreground">Pluit, Kuningan, Palem, Kebayoran, Roxy</div>
              </div>
              <span className="text-xl font-semibold tabular-nums">{stats?.totalBranches ?? 0}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Financial Compliance</CardTitle>
            <CardDescription>Invoice pipeline & tax status</CardDescription>
            <CardAction>
              <Badge variant="outline">Faktur Pajak 1.1%</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active invoices in pipeline</span>
              <span className="font-semibold tabular-nums">{stats?.activeInvoices ?? 0}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Overdue payments</span>
              <span className="font-semibold tabular-nums text-primary">{stats?.overdueInvoices ?? 0}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pending approvals</span>
              <span className="font-semibold tabular-nums">{stats?.pendingApprovals ?? 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
