"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import { Customer } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Search, Building, Mail, Phone, MapPin, Eye, FileSpreadsheet } from "lucide-react";

export default function CustomersView() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    alias: "",
    customerType: "Corporate",
    businessType: "PT",
    businessNature: "",
    emailAddress: "",
    phoneNo: "",
    officeAddress: "",
    officeCity: "Jakarta Pusat",
    officePostalCode: "10220",
    customBillingAddress: false,
    taxIdType: "NPWP",
    taxIdNo: "",
    creditLimit: 100000000,
    dueDays: 30,
    notes: "",
    assignedOfficer: "admin",
  });

  const { data, isLoading } = useQuery<{ items: Customer[]; totalCount: number; totalPages: number }>({
    queryKey: ["customers", search, page],
    queryFn: () =>
      apiFetch(`/api/v1/customers?search=${encodeURIComponent(search)}&page=${page}&pageSize=10`),
  });

  const createMutation = useMutation({
    mutationFn: (newCust: typeof formData) =>
      apiFetch("/api/v1/customers", {
        method: "POST",
        body: JSON.stringify(newCust),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setIsCreateOpen(false);
      toast.success("Customer created successfully.");
      setFormData({
        name: "",
        alias: "",
        customerType: "Corporate",
        businessType: "PT",
        businessNature: "",
        emailAddress: "",
        phoneNo: "",
        officeAddress: "",
        officeCity: "Jakarta Pusat",
        officePostalCode: "10220",
        customBillingAddress: false,
        taxIdType: "NPWP",
        taxIdNo: "",
        creditLimit: 100000000,
        dueDays: 30,
        notes: "",
        assignedOfficer: "admin",
      });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create customer.");
    },
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const handleExport = () => {
    if (!data?.items?.length) return;
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Customer No,Name,Type,Credit Limit,Due Days,Total Invoiced,Outstanding Balance,Email,Phone"]
        .concat(
          data.items.map(
            (c) =>
              `"${c.customerNo}","${c.name}","${c.customerType}","${c.creditLimit}","${c.dueDays}","${c.totalInvoiced}","${c.outstandingBalance}","${c.emailAddress || ""}","${c.phoneNo || ""}"`
          )
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Wahana_Customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Customer list exported successfully.");
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Customer CRM</h1>
          <p className="text-xs text-muted-foreground">
            Corporate accounts, credit limits, contact profiles, and billing histories.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-2 border-border bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" /> Export CSV
          </Button>
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="gap-2 bg-[#ef233c] hover:bg-[#d90429] text-white shadow-md shadow-[#ef233c]/25"
          >
            <Plus className="h-4 w-4" /> New Customer
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search code, company name, email..."
            className="pl-9 text-xs bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-[#ef233c] focus:ring-[#ef233c]/20"
          />
        </div>
      </div>

      {/* Table Container */}
      <Card className="border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-900/80 border-b border-border">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="font-semibold text-zinc-400 text-xs">Code</TableHead>
              <TableHead className="font-semibold text-zinc-400 text-xs">Customer Name</TableHead>
              <TableHead className="font-semibold text-zinc-400 text-xs">Type</TableHead>
              <TableHead className="font-semibold text-zinc-400 text-xs">Credit Limit</TableHead>
              <TableHead className="font-semibold text-zinc-400 text-xs">Terms</TableHead>
              <TableHead className="font-semibold text-zinc-400 text-xs">Outstanding</TableHead>
              <TableHead className="font-semibold text-zinc-400 text-xs">Status</TableHead>
              <TableHead className="text-right font-semibold text-zinc-400 text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground text-xs">
                  Loading customers...
                </TableCell>
              </TableRow>
            ) : data?.items?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground text-xs">
                  No customer records found.
                </TableCell>
              </TableRow>
            ) : (
              data?.items?.map((c) => (
                <TableRow key={c.id} className="border-border hover:bg-zinc-900/50 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold text-[#ef233c]">
                    {c.customerNo}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-white text-xs">{c.name}</p>
                      {c.alias && <p className="text-[11px] text-muted-foreground">{c.alias}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-medium border-zinc-700 bg-zinc-800 text-zinc-300">
                      {c.customerType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-zinc-300">
                    {formatCurrency(c.creditLimit)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.dueDays} Days</TableCell>
                  <TableCell className="text-xs font-semibold text-[#ef233c]">
                    {formatCurrency(c.outstandingBalance)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        c.isActive
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                          : "border-zinc-700 bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {c.isActive ? "Active" : "Archived"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCustomer(c)}
                      className="h-7 px-2.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1 text-[#ef233c]" /> Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Bar */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-zinc-950/40">
            <span className="text-xs text-muted-foreground">
              Page {page} of {data.totalPages} ({data.totalCount} customers)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-7 text-xs border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-7 text-xs border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Customer Detail Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-2xl bg-card border-border text-white">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle className="text-lg font-bold text-white">
                {selectedCustomer?.name}
              </DialogTitle>
              <Badge className="bg-[#ef233c]/20 text-[#ef233c] border border-[#ef233c]/30 text-xs">
                {selectedCustomer?.customerNo}
              </Badge>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Corporate profile, financial standing, and operational contact info.
            </DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <div className="grid grid-cols-2 gap-4 py-2 text-xs">
              <div className="space-y-3 rounded-xl bg-zinc-900/80 p-4 border border-zinc-800">
                <h4 className="font-bold text-[10px] uppercase tracking-wider text-[#ef233c]">
                  Corporate Information
                </h4>
                <div className="flex items-start gap-2 text-zinc-300">
                  <Building className="h-4 w-4 text-zinc-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-white">
                      {selectedCustomer.businessType} • {selectedCustomer.businessNature || "General"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{selectedCustomer.customerType}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-zinc-300">
                  <MapPin className="h-4 w-4 text-zinc-500 mt-0.5 shrink-0" />
                  <p className="text-[11px]">
                    {selectedCustomer.officeAddress}, {selectedCustomer.officeCity} {selectedCustomer.officePostalCode}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-zinc-300 text-[11px]">
                  <Mail className="h-4 w-4 text-zinc-500 shrink-0" />
                  <span>{selectedCustomer.emailAddress || "-"}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300 text-[11px]">
                  <Phone className="h-4 w-4 text-zinc-500 shrink-0" />
                  <span>{selectedCustomer.phoneNo || "-"}</span>
                </div>
              </div>

              <div className="space-y-3 rounded-xl bg-zinc-900/80 p-4 border border-zinc-800">
                <h4 className="font-bold text-[10px] uppercase tracking-wider text-[#ef233c]">
                  Financial Terms
                </h4>
                <div className="flex justify-between border-b border-zinc-800/80 pb-1.5 text-[11px]">
                  <span className="text-muted-foreground">Tax ID ({selectedCustomer.taxIdType}):</span>
                  <span className="font-mono text-zinc-300">{selectedCustomer.taxIdNo || "None"}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800/80 pb-1.5 text-[11px]">
                  <span className="text-muted-foreground">Credit Limit:</span>
                  <span className="font-semibold text-white">
                    {formatCurrency(selectedCustomer.creditLimit)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-800/80 pb-1.5 text-[11px]">
                  <span className="text-muted-foreground">Payment Due Term:</span>
                  <span className="font-semibold text-white">{selectedCustomer.dueDays} Days</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800/80 pb-1.5 text-[11px]">
                  <span className="text-muted-foreground">Total Invoiced:</span>
                  <span className="font-semibold text-white">
                    {formatCurrency(selectedCustomer.totalInvoiced)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Outstanding Balance:</span>
                  <span className="font-bold text-[#ef233c]">
                    {formatCurrency(selectedCustomer.outstandingBalance)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedCustomer(null)}
              className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Customer Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-xl bg-card border-border text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">Register New Customer</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Create an individual or corporate travel customer profile.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-medium text-zinc-300">Official Company Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. PT Astra International Tbk"
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-[#ef233c]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Alias / Brand Name</label>
              <Input
                value={formData.alias}
                onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                placeholder="e.g. Astra Group"
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-[#ef233c]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Customer Classification</label>
              <select
                className="w-full rounded-md border border-zinc-800 p-2 text-xs bg-zinc-900 text-white focus:outline-none focus:border-[#ef233c]"
                value={formData.customerType}
                onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}
              >
                <option value="Corporate">Corporate</option>
                <option value="Individual">Individual</option>
                <option value="Government">Government</option>
                <option value="B2B">B2B Partner</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Corporate Email</label>
              <Input
                value={formData.emailAddress}
                onChange={(e) => setFormData({ ...formData, emailAddress: e.target.value })}
                placeholder="finance@company.com"
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-[#ef233c]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Office Phone</label>
              <Input
                value={formData.phoneNo}
                onChange={(e) => setFormData({ ...formData, phoneNo: e.target.value })}
                placeholder="021-..."
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-[#ef233c]"
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-medium text-zinc-300">Office Address</label>
              <Input
                value={formData.officeAddress}
                onChange={(e) => setFormData({ ...formData, officeAddress: e.target.value })}
                placeholder="Street name, building, floor"
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-[#ef233c]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Credit Limit (IDR)</label>
              <Input
                type="number"
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                className="bg-zinc-900 border-zinc-800 text-white focus:border-[#ef233c]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Due Days</label>
              <Input
                type="number"
                value={formData.dueDays}
                onChange={(e) => setFormData({ ...formData, dueDays: Number(e.target.value) })}
                className="bg-zinc-900 border-zinc-800 text-white focus:border-[#ef233c]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              className="bg-[#ef233c] hover:bg-[#d90429] text-white shadow-md shadow-[#ef233c]/25"
              disabled={!formData.name || createMutation.isPending}
              onClick={() => createMutation.mutate(formData)}
            >
              {createMutation.isPending ? "Saving..." : "Save Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
