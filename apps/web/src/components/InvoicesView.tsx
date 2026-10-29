"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import { Invoice, Customer, InvoiceItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
import { Plus, Search, FileText, Check, Send, Trash2, Printer } from "lucide-react";

export default function InvoicesView() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Load Customers for selection
  const { data: customersData } = useQuery<{ items: Customer[] }>({
    queryKey: ["customers-selector"],
    queryFn: () => apiFetch("/api/v1/customers?page=1&pageSize=50"),
  });

  // Load Invoices
  const { data, isLoading } = useQuery<{ items: Invoice[]; totalCount: number; totalPages: number }>({
    queryKey: ["invoices", search, statusFilter, page],
    queryFn: () =>
      apiFetch(
        `/api/v1/invoices?search=${encodeURIComponent(search)}&invoiceStatus=${statusFilter}&page=${page}&pageSize=10`
      ),
  });

  // Create Invoice Form State
  const [customerId, setCustomerId] = useState("");
  const [paymentType, setPaymentType] = useState("Credit");
  const [dueDays, setDueDays] = useState(30);
  const [enableGST, setEnableGST] = useState(true);
  const [enableStampDuty, setEnableStampDuty] = useState(true);
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      itemDescription: "Garuda Indonesia GA-182 CGK - KNO",
      pnrCode: "W6HJ8K",
      passengerName: "Bambang Soeprapto",
      route: "CGK - KNO",
      quantity: 1,
      unitPrice: 3500000,
      discount: 0,
      subTotal: 3500000,
    },
  ]);

  const createMutation = useMutation({
    mutationFn: () =>
      apiFetch("/api/v1/invoices", {
        method: "POST",
        body: JSON.stringify({
          customerId,
          productGroup: "FLIGHT",
          productCode: "DOM_AIRLINE",
          paymentType,
          invoiceType: "Regular",
          dueDays,
          enableGST,
          enableStampDuty,
          items,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setIsCreateOpen(false);
      toast.success("Draft invoice created successfully.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create invoice.");
    },
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/v1/invoices/${id}/submit`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setSelectedInvoice(null);
      toast.success("Invoice submitted for managerial approval.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit invoice.");
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/v1/invoices/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ approvalNotes: "Approved and finalized for payment billing" }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setSelectedInvoice(null);
      toast.success("Invoice approved & finalized!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to approve invoice.");
    },
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Draft":
        return <Badge variant="outline" className="border-zinc-700 bg-zinc-800 text-zinc-300 text-[10px]">Draft</Badge>;
      case "Submitted":
        return <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px]">Submitted</Badge>;
      case "Approved":
        return <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px]">Approved</Badge>;
      case "Finalized":
        return <Badge variant="outline" className="border-sky-500/30 bg-sky-500/10 text-sky-400 text-[10px]">Finalized</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        itemDescription: "",
        pnrCode: "",
        passengerName: "",
        route: "",
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        subTotal: 0,
      },
    ]);
  };

  const handleUpdateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    if (field === "quantity" || field === "unitPrice" || field === "discount") {
      const q = updated[index].quantity || 1;
      const p = updated[index].unitPrice || 0;
      const d = updated[index].discount || 0;
      updated[index].subTotal = q * p - d;
    }
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Invoices & Billing</h1>
          <p className="text-xs text-muted-foreground">
            Create flight billing, manage workflow approvals, and review financial balances.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            if (customersData?.items?.length) {
              setCustomerId(customersData.items[0].id);
            }
            setIsCreateOpen(true);
          }}
          className="gap-2 bg-[#ef233c] hover:bg-[#d90429] text-white shadow-md shadow-[#ef233c]/25"
        >
          <Plus className="h-4 w-4" /> Create Invoice
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search invoice number, customer..."
            className="pl-9 text-xs bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-[#ef233c]"
          />
        </div>
        <select
          className="rounded-md border border-zinc-800 p-2 text-xs bg-zinc-900 text-white focus:outline-none focus:border-[#ef233c]"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Submitted">Submitted (Needs Approval)</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Finalized">Finalized</option>
        </select>
      </div>

      {/* Table Container */}
      <Card className="border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-900/80 border-b border-border">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="font-semibold text-zinc-400 text-xs">Invoice No</TableHead>
              <TableHead className="font-semibold text-zinc-400 text-xs">Customer</TableHead>
              <TableHead className="font-semibold text-zinc-400 text-xs">Product</TableHead>
              <TableHead className="font-semibold text-zinc-400 text-xs">Due Date</TableHead>
              <TableHead className="font-semibold text-zinc-400 text-xs">Status</TableHead>
              <TableHead className="font-semibold text-zinc-400 text-xs">Billing Amount</TableHead>
              <TableHead className="font-semibold text-zinc-400 text-xs">Paid Amount</TableHead>
              <TableHead className="font-semibold text-zinc-400 text-xs">Remaining</TableHead>
              <TableHead className="text-right font-semibold text-zinc-400 text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-muted-foreground text-xs">
                  Loading invoices...
                </TableCell>
              </TableRow>
            ) : data?.items?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-muted-foreground text-xs">
                  No invoices found.
                </TableCell>
              </TableRow>
            ) : (
              data?.items?.map((inv) => (
                <TableRow key={inv.id} className="border-border hover:bg-zinc-900/50 transition-colors">
                  <TableCell className="font-mono text-xs font-bold text-[#ef233c]">
                    {inv.invoiceNo}
                  </TableCell>
                  <TableCell className="font-medium text-white text-xs">
                    {inv.customerName}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] border-zinc-700 bg-zinc-800 text-zinc-300">
                      {inv.productGroup}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("id-ID") : "-"}
                  </TableCell>
                  <TableCell>{getStatusBadge(inv.invoiceStatus)}</TableCell>
                  <TableCell className="font-semibold text-white text-xs">
                    {formatCurrency(inv.billingAmount)}
                  </TableCell>
                  <TableCell className="font-medium text-emerald-400 text-xs">
                    {formatCurrency(inv.paidAmount)}
                  </TableCell>
                  <TableCell className="font-bold text-[#ef233c] text-xs">
                    {formatCurrency(inv.remainingAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedInvoice(inv)}
                      className="h-7 px-2.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800"
                    >
                      View
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
              Page {page} of {data.totalPages} ({data.totalCount} invoices)
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

      {/* Invoice Detail & Workflow Modal */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-3xl bg-card border-border text-white">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-lg font-bold text-white">
                  {selectedInvoice?.invoiceNo}
                </DialogTitle>
                {selectedInvoice && getStatusBadge(selectedInvoice.invoiceStatus)}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="gap-1.5 border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
              >
                <Printer className="h-4 w-4" /> Print / PDF
              </Button>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Billed to <strong className="text-zinc-200">{selectedInvoice?.customerName}</strong> ({selectedInvoice?.customerNo})
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4 py-2">
              {/* Items Breakdown Table */}
              <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-950/40">
                <Table>
                  <TableHeader className="bg-zinc-900 border-b border-zinc-800">
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-xs font-semibold text-zinc-400">Description</TableHead>
                      <TableHead className="text-xs font-semibold text-zinc-400">PNR</TableHead>
                      <TableHead className="text-xs font-semibold text-zinc-400">Passenger</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-zinc-400">Qty</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-zinc-400">Price</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-zinc-400">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedInvoice.items?.map((it, idx) => (
                      <TableRow key={idx} className="border-zinc-850 hover:bg-zinc-900/40">
                        <TableCell className="text-xs font-medium text-white">{it.itemDescription}</TableCell>
                        <TableCell className="text-xs font-mono text-[#ef233c]">{it.pnrCode || "-"}</TableCell>
                        <TableCell className="text-xs text-zinc-400">{it.passengerName || "-"}</TableCell>
                        <TableCell className="text-right text-xs text-zinc-300">{it.quantity}</TableCell>
                        <TableCell className="text-right text-xs text-zinc-300">{formatCurrency(it.unitPrice)}</TableCell>
                        <TableCell className="text-right text-xs font-semibold text-white">{formatCurrency(it.subTotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pricing Totals Box */}
              <div className="flex justify-end">
                <div className="w-72 space-y-2 rounded-xl bg-zinc-900/80 p-3.5 text-xs border border-zinc-800">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Net Fare:</span>
                    <span className="text-zinc-200">{formatCurrency(selectedInvoice.netFare)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Service Fee:</span>
                    <span className="text-zinc-200">{formatCurrency(selectedInvoice.serviceFee)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>PPN (1.1%):</span>
                    <span className="text-zinc-200">{formatCurrency(selectedInvoice.gst)}</span>
                  </div>
                  {selectedInvoice.enableStampDuty && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Stamp Duty:</span>
                      <span className="text-zinc-200">{formatCurrency(selectedInvoice.stampDutyFee)}</span>
                    </div>
                  )}
                  <div className="border-t border-zinc-800 pt-2 flex justify-between font-bold text-sm text-white">
                    <span>Total Billing:</span>
                    <span className="text-[#ef233c]">{formatCurrency(selectedInvoice.billingAmount)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-medium">
                    <span>Paid to Date:</span>
                    <span>{formatCurrency(selectedInvoice.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between text-[#ef233c] font-bold">
                    <span>Remaining Balance:</span>
                    <span>{formatCurrency(selectedInvoice.remainingAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedInvoice?.invoiceStatus === "Draft" && (
              <Button
                onClick={() => submitMutation.mutate(selectedInvoice.id)}
                disabled={submitMutation.isPending}
                className="bg-[#ef233c] hover:bg-[#d90429] text-white gap-2 shadow-md shadow-[#ef233c]/25"
              >
                <Send className="h-4 w-4" /> Submit for Approval
              </Button>
            )}

            {selectedInvoice?.invoiceStatus === "Submitted" && (
              <Button
                onClick={() => approveMutation.mutate(selectedInvoice.id)}
                disabled={approveMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                <Check className="h-4 w-4" /> Approve & Finalize
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => setSelectedInvoice(null)}
              className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Invoice Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">New Flight Invoice</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Draft an invoice with flight line items, PPN 1.1%, and optional stamp duty.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Select Customer *</label>
                <select
                  className="w-full rounded-md border border-zinc-800 p-2 text-xs bg-zinc-900 text-white focus:outline-none focus:border-[#ef233c]"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                >
                  {customersData?.items?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.customerNo})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Payment Term (Days)</label>
                <Input
                  type="number"
                  value={dueDays}
                  onChange={(e) => setDueDays(Number(e.target.value))}
                  className="bg-zinc-900 border-zinc-800 text-white focus:border-[#ef233c]"
                />
              </div>
            </div>

            {/* Tax & Stamp Options */}
            <div className="flex items-center gap-6 rounded-xl bg-zinc-900/80 p-3 border border-zinc-800">
              <label className="flex items-center gap-2 text-xs font-medium text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableGST}
                  onChange={(e) => setEnableGST(e.target.checked)}
                  className="rounded text-[#ef233c] focus:ring-[#ef233c]"
                />
                Calculate GST (PPN 1.1%)
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableStampDuty}
                  onChange={(e) => setEnableStampDuty(e.target.checked)}
                  className="rounded text-[#ef233c] focus:ring-[#ef233c]"
                />
                Apply Materai (Rp 10,000 for &gt;= Rp 5M)
              </label>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#ef233c]">
                  Line Items
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  className="h-7 text-xs border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                >
                  <Plus className="mr-1 h-3 w-3" /> Add Item
                </Button>
              </div>

              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-6 gap-2 rounded-xl border border-zinc-800 p-3 bg-zinc-900/60">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-medium text-muted-foreground">Description</label>
                    <Input
                      value={item.itemDescription}
                      onChange={(e) => handleUpdateItem(idx, "itemDescription", e.target.value)}
                      placeholder="e.g. Flight Ticket GA-182"
                      className="text-xs h-8 bg-zinc-900 border-zinc-800 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-muted-foreground">PNR</label>
                    <Input
                      value={item.pnrCode}
                      onChange={(e) => handleUpdateItem(idx, "pnrCode", e.target.value)}
                      placeholder="PNR"
                      className="text-xs h-8 bg-zinc-900 border-zinc-800 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-muted-foreground">Passenger</label>
                    <Input
                      value={item.passengerName}
                      onChange={(e) => handleUpdateItem(idx, "passengerName", e.target.value)}
                      placeholder="Pax Name"
                      className="text-xs h-8 bg-zinc-900 border-zinc-800 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-muted-foreground">Price (IDR)</label>
                    <Input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => handleUpdateItem(idx, "unitPrice", Number(e.target.value))}
                      className="text-xs h-8 bg-zinc-900 border-zinc-800 text-white"
                    />
                  </div>
                  <div className="flex items-end justify-between gap-1">
                    <div className="space-y-1 flex-1">
                      <label className="text-[10px] font-medium text-muted-foreground">Qty</label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(idx, "quantity", Number(e.target.value))}
                        className="text-xs h-8 bg-zinc-900 border-zinc-800 text-white"
                      />
                    </div>
                    {items.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(idx)}
                        className="h-8 w-8 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
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
              disabled={!customerId || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? "Creating..." : "Create Draft Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
