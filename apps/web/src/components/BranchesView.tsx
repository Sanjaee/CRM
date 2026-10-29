"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import { Branch } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, GitBranch, MapPin, Users } from "lucide-react";

export default function BranchesView() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    address: "",
    isHeadOffice: false,
  });

  const { data: branches, isLoading } = useQuery<Branch[]>({
    queryKey: ["branches"],
    queryFn: () => apiFetch("/api/v1/branches"),
  });

  const createMutation = useMutation({
    mutationFn: (newBranch: typeof formData) =>
      apiFetch("/api/v1/branches", {
        method: "POST",
        body: JSON.stringify(newBranch),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setIsCreateOpen(false);
      toast.success("Branch office created successfully.");
      setFormData({ code: "", name: "", address: "", isHeadOffice: false });
    },
    onError: (err: any) => toast.error(err.message || "Failed to create branch."),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Branch Offices</h1>
          <p className="text-xs text-muted-foreground">
            Physical branch office network, headquarters, and location-based administration.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          className="gap-2 bg-[#ef233c] hover:bg-[#d90429] text-white shadow-md shadow-[#ef233c]/25"
        >
          <Plus className="h-4 w-4" /> Add Branch
        </Button>
      </div>

      {/* Branches Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-xs">Loading branches...</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branches?.map((branch) => (
            <Card
              key={branch.id}
              className="border-border bg-card shadow-sm transition-all hover:border-[#ef233c]/50"
            >
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#ef233c] bg-[#ef233c]/15 px-2 py-0.5 rounded border border-[#ef233c]/30">
                      {branch.code}
                    </span>
                    {branch.isHeadOffice && (
                      <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px]">
                        Head Office
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-base font-bold text-white mt-1">
                    {branch.name}
                  </CardTitle>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400">
                  <GitBranch className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-start gap-1.5 text-zinc-400 min-h-[36px]">
                  <MapPin className="h-3.5 w-3.5 text-zinc-500 mt-0.5 shrink-0" />
                  <p className="line-clamp-2 text-[11px]">{branch.address}</p>
                </div>

                <div className="flex items-center justify-between border-t border-zinc-800/80 pt-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                    <Users className="h-3.5 w-3.5 text-zinc-500" />
                    <span>Stationed Users:</span>
                  </div>
                  <span className="font-bold text-xs text-white bg-zinc-800 px-2.5 py-0.5 rounded-full border border-zinc-700">
                    {branch.userCount}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Branch Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md bg-card border-border text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">Add Branch Office</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Register a Wahana Travel operational branch office.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Branch Code *</label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. BDG"
                maxLength={5}
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-[#ef233c]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Branch Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Wahana Bandung"
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-[#ef233c]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Address *</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street address, city, postal code"
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-[#ef233c]"
              />
            </div>
            <label className="flex items-center gap-2 text-xs font-medium text-zinc-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={formData.isHeadOffice}
                onChange={(e) => setFormData({ ...formData, isHeadOffice: e.target.checked })}
                className="rounded text-[#ef233c] focus:ring-[#ef233c]"
              />
              Designate as Head Office
            </label>
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
              disabled={!formData.code || !formData.name || createMutation.isPending}
              onClick={() => createMutation.mutate(formData)}
            >
              {createMutation.isPending ? "Creating..." : "Save Branch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
