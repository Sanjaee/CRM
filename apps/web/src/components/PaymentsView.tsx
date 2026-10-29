"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import { Payment, Invoice } from "@/lib/types";
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
import { Plus, Search, Split } from "lucide-react";

export default function PaymentsView() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [allocatingPayment, setAllocatingPayment] = useState<Payment | null>(null);

  // New Payment Form State
  const [recordForm, setRecordForm] = useState({
    receivedAt: new Date().toISOString(),
    receivedAccount: "BCA 088-2918888",
    receivedAccountDesc: "BCA Wahana Travel IDR (Head Office)",
    receivedAmount: 10000000,
    referenceNo: "",
    notes: "",
  });

  // Allocation Items State
  const [selectedInvoices, setSelectedInvoices] = useState<{ [invoiceId: string]: number }>({});

  const { data, isLoading } = useQuery<{ items: Payment[]; totalCount: number; totalPages: number }>({
    queryKey: ["payments", search, page],
    queryFn: () =>
      apiFetch(`/api/v1/payments?search=${encodeURIComponent(search)}&page=${page}&pageSize=10`),
  });

  // Load Finalized Invoices with Remaining Balance
  const { data: finalizedInvoices } = useQuery<{ items: Invoice[] }>({
    queryKey: ["finalized-invoices"],
    queryFn: () => apiFetch("/api/v1/invoices?invoiceStatus=Finalized&page=1&pageSize=50"),
    enabled: !!allocatingPayment,
  });

  const recordMutation = useMutation({
    mutationFn: (newPay: typeof recordForm) =>
      apiFetch("/api/v1/payments", {
        method: "POST",
        body: JSON.stringify(newPay),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setIsRecordOpen(false);
      toast.success("Payment receipt recorded successfully.");
      setRecordForm({
        receivedAt: new Date().toISOString(),
        receivedAccount: "BCA 088-2918888",
        receivedAccountDesc: "BCA Wahana Travel IDR (Head Office)",
        receivedAmount: 10000000,
        referenceNo: "",
        notes: "",
      });
    },
    onError: (err: any) => toast.error(err.message || "Failed to record payment."),
  });

  const allocateMutation = useMutation({
    mutationFn: ({ paymentId, allocations }: { paymentId: string; allocations: any[] }) =>
      apiFetch(`/api/v1/payments/${paymentId}/allocate`, {
        method: "POST",
        body: JSON.stringify({ allocations }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setAllocatingPayment(null);
      setSelectedInvoices({});
      toast.success("Payment allocated to invoices successfully.");
    },
    onError: (err: any) => toast.error(err.message || "Allocation failed."),
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
      case "FullyAllocated":
        return <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px]">Fully Allocated</Badge>;
      case "PartiallyAllocated":
        return <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px]">Partially Allocated</Badge>;
      default:
        return <Badge variant="outline" className="border-zinc-700 bg-zinc-800 text-zinc-300 text-[10px]">Unallocated</Badge>;
    }
  };

  const handleAllocationSubmit = () => {
    if (!allocatingPayment) return;
    const allocations = Object.entries(selectedInvoices)
      .filter(([_, amt]) => amt > 0)
      .map(([invoiceId, amount]) => ({
        invoiceId,
        amount,
      }));

    if (allocations.length === 0) {
      toast.error("Please enter an allocation amount for at least one invoice.");
      return;
    }

    allocateMutation.mutate({ paymentId: allocatingPayment.id, allocations });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Payments & Allocations</h1>
          <p className="text-xs text-muted-foreground">
            Record bank receipts and execute multi-invoice payment settlements with strict ledger balance.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setIsRecordOpen(true)}
          className="gap-2 bg-[#ef233c] hover:bg-[#d90429] text-white shadow-md shadow-[#ef233c]/25"
        >
          <Plus className="h-4 w-4" /> Record Payment
        </Button>
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
            placeholder="Search payment number, bank reference..."
            className="pl-9 text-xs bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-[#ef233c]"
          />
        </div>
      </div>

      {/* Table Container */}
      <Card className="border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-900/80 border-b border-border">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="font-semibold text-zinc-400 text-xs">Payment No</TableHead>
              <TableHead className="font-semibold text-zinc-400 text-xs">Received Date</TableHead>
              <TableHead className="font-semibold text-zinc-400 text-xs">Account / Reference</TableHead>
              <TableHead className="font-semibold text-zinc-400 text-xs">Received Amount</TableHead>
              <TableHead className="font-semibold text-zinc-400 text-xs">Allocated</TableHead>
              <TableHead className="font-semibold text-zinc-400 text-xs">Unallocated</TableHead>
              <TableHead className="font-semibold text-zinc-400 text-xs">Status</TableHead>
              <TableHead className="text-right font-semibold text-zinc-400 text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground text-xs">
                  Loading payments...
                </TableCell>
              </TableRow>
            ) : data?.items?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground text-xs">
                  No payment records found.
                </TableCell>
              </TableRow>
            ) : (
              data?.items?.map((pay) => (
                <TableRow key={pay.id} className="border-border hover:bg-zinc-900/50 transition-colors">
                  <TableCell className="font-mono text-xs font-bold text-[#ef233c]">
                    {pay.paymentNo}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(pay.receivedAt).toLocaleDateString("id-ID")}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-xs font-semibold text-white">{pay.receivedAccount}</p>
                      {pay.referenceNo && (
                        <p className="text-[11px] font-mono text-muted-foreground">Ref: {pay.referenceNo}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-white text-xs">
                    {formatCurrency(pay.receivedAmount)}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-emerald-400">
                    {formatCurrency(pay.allocatedAmount)}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-amber-400">
                    {formatCurrency(pay.unallocatedAmount)}
                  </TableCell>
                  <TableCell>{getStatusBadge(pay.allocationStatus)}</TableCell>
                  <TableCell className="text-right">
                    {pay.unallocatedAmount > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAllocatingPayment(pay);
                          setSelectedInvoices({});
                        }}
                        className="h-7 text-xs gap-1 border-zinc-800 bg-zinc-900 text-zinc-200 hover:text-white hover:bg-zinc-800 hover:border-[#ef233c]/50"
                      >
                        <Split className="h-3 w-3 text-[#ef233c]" /> Allocate
                      </Button>
                    )}
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
              Page {page} of {data.totalPages} ({data.totalCount} payments)
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

      {/* Record Payment Dialog */}
      <Dialog open={isRecordOpen} onOpenChange={setIsRecordOpen}>
        <DialogContent className="max-w-md bg-card border-border text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">Record Bank Receipt</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Log funds received into corporate bank accounts for invoice matching.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Receiving Account</label>
              <Input
                value={recordForm.receivedAccount}
                onChange={(e) => setRecordForm({ ...recordForm, receivedAccount: e.target.value })}
                placeholder="Bank Name and Account No"
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-[#ef233c]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Account Description</label>
              <Input
                value={recordForm.receivedAccountDesc}
                onChange={(e) => setRecordForm({ ...recordForm, receivedAccountDesc: e.target.value })}
                placeholder="e.g. BCA Wahana Travel IDR"
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-[#ef233c]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Received Amount (IDR)</label>
              <Input
                type="number"
                value={recordForm.receivedAmount}
                onChange={(e) => setRecordForm({ ...recordForm, receivedAmount: Number(e.target.value) })}
                className="bg-zinc-900 border-zinc-800 text-white focus:border-[#ef233c]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Bank Transfer Ref Number</label>
              <Input
                value={recordForm.referenceNo}
                onChange={(e) => setRecordForm({ ...recordForm, referenceNo: e.target.value })}
                placeholder="e.g. TRF-BCA-981249"
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-[#ef233c]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Internal Remarks / Notes</label>
              <Input
                value={recordForm.notes}
                onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                placeholder="e.g. Settlement for PT Astra"
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-[#ef233c]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRecordOpen(false)}
              className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              className="bg-[#ef233c] hover:bg-[#d90429] text-white shadow-md shadow-[#ef233c]/25"
              disabled={recordForm.receivedAmount <= 0 || recordMutation.isPending}
              onClick={() => recordMutation.mutate(recordForm)}
            >
              {recordMutation.isPending ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Allocation Dialog */}
      <Dialog open={!!allocatingPayment} onOpenChange={() => setAllocatingPayment(null)}>
        <DialogContent className="max-w-3xl bg-card border-border text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">Allocate Payment to Invoices</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Assign available unallocated balance of{" "}
              <strong className="text-emerald-400 font-bold">
                {formatCurrency(allocatingPayment?.unallocatedAmount || 0)}
              </strong>{" "}
              across finalized invoices.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="max-h-64 overflow-y-auto border border-zinc-800 rounded-xl bg-zinc-950/40">
              <Table>
                <TableHeader className="bg-zinc-900 border-b border-zinc-800">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xs font-semibold text-zinc-400">Invoice No</TableHead>
                    <TableHead className="text-xs font-semibold text-zinc-400">Customer</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-zinc-400">Remaining</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-zinc-400">Allocate (IDR)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {finalizedInvoices?.items
                    ?.filter((i) => i.remainingAmount > 0)
                    .map((inv) => (
                      <TableRow key={inv.id} className="border-zinc-850 hover:bg-zinc-900/40">
                        <TableCell className="font-mono text-xs font-bold text-[#ef233c]">{inv.invoiceNo}</TableCell>
                        <TableCell className="text-xs text-zinc-200 font-medium">{inv.customerName}</TableCell>
                        <TableCell className="text-right text-xs font-bold text-[#ef233c]">
                          {formatCurrency(inv.remainingAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            max={Math.min(inv.remainingAmount, allocatingPayment?.unallocatedAmount || 0)}
                            value={selectedInvoices[inv.id] || ""}
                            onChange={(e) =>
                              setSelectedInvoices({
                                ...selectedInvoices,
                                [inv.id]: Number(e.target.value),
                              })
                            }
                            placeholder="0"
                            className="w-36 text-right text-xs h-8 ml-auto font-medium bg-zinc-900 border-zinc-800 text-white"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAllocatingPayment(null)}
              className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              className="bg-[#ef233c] hover:bg-[#d90429] text-white shadow-md shadow-[#ef233c]/25"
              disabled={allocateMutation.isPending}
              onClick={handleAllocationSubmit}
            >
              {allocateMutation.isPending ? "Confirming..." : "Confirm Allocations"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
