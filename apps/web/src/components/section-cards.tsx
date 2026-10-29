"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUpIcon, TrendingDownIcon, AlertTriangleIcon } from "lucide-react"
import type { DashboardStats } from "@/lib/types"

const idr = (v?: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(v ?? 0)

export function SectionCards({
  stats,
  isLoading,
}: {
  stats?: DashboardStats
  isLoading?: boolean
}) {
  const cards = [
    {
      label: "Total Revenue",
      value: idr(stats?.totalReceivables),
      badge: { icon: <TrendingUpIcon className="size-3.5" />, text: "+12.5%", color: "text-emerald-400" },
      footer: "Trending up this month",
      sub: "Across all corporate accounts",
      footIcon: <TrendingUpIcon className="size-3.5 text-emerald-400" />,
    },
    {
      label: "Collected This Month",
      value: idr(stats?.totalCollectedMonth),
      badge: { icon: <TrendingUpIcon className="size-3.5" />, text: "Settled", color: "text-emerald-400" },
      footer: "Settled via automated bank allocations",
      sub: "Settlement speed on track",
      footIcon: <TrendingUpIcon className="size-3.5 text-emerald-400" />,
    },
    {
      label: "Active Accounts",
      value: (stats?.totalCustomers ?? 0).toLocaleString("id-ID"),
      badge: { icon: <TrendingUpIcon className="size-3.5" />, text: "+12.5%", color: "text-emerald-400" },
      footer: "Strong user retention",
      sub: `${stats?.activeInvoices ?? 0} active invoices in pipeline`,
      footIcon: <TrendingUpIcon className="size-3.5 text-emerald-400" />,
    },
    {
      label: "Pending Approvals",
      value: (stats?.pendingApprovals ?? 0).toLocaleString("id-ID"),
      badge: {
        icon: <TrendingDownIcon className="size-3.5" />,
        text: "-20%",
        color: "text-amber-400",
      },
      footer: `${stats?.overdueInvoices ?? 0} overdue invoices`,
      sub: "Awaiting manager confirmation",
      footIcon: <AlertTriangleIcon className="size-3.5 text-primary" />,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:px-6 xl:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label} className="flex flex-col justify-between border-border/70 bg-card p-6 shadow-sm hover:border-border transition-all">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{c.label}</span>
              <Badge variant="outline" className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium ${c.badge.color}`}>
                {c.badge.icon}
                {c.badge.text}
              </Badge>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-bold tracking-tight text-white tabular-nums">
                {isLoading ? <Skeleton className="h-9 w-32" /> : c.value}
              </span>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-1 border-t border-border/40 pt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <span>{c.footer}</span>
              {c.footIcon}
            </div>
            <span>{c.sub}</span>
          </div>
        </Card>
      ))}
    </div>
  )
}
