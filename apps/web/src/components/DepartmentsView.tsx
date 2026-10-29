"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import { Department } from "@/lib/types";
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
import { Plus, Building2, Users, Layers } from "lucide-react";

export default function DepartmentsView() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    parentDepartmentCode: "",
  });

  const { data: departments, isLoading } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: () => apiFetch("/api/v1/departments"),
  });

  const createMutation = useMutation({
    mutationFn: (newDept: typeof formData) =>
      apiFetch("/api/v1/departments", {
        method: "POST",
        body: JSON.stringify(newDept),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setIsCreateOpen(false);
      toast.success("Department created successfully.");
      setFormData({ code: "", name: "", description: "", parentDepartmentCode: "" });
    },
    onError: (err: any) => toast.error(err.message || "Failed to create department."),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Departments Management</h1>
          <p className="text-xs text-muted-foreground">
            Organizational departments, parent-child hierarchies, and assigned administrative staff.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          className="gap-2 bg-[#ef233c] hover:bg-[#d90429] text-white shadow-md shadow-[#ef233c]/25"
        >
          <Plus className="h-4 w-4" /> Add Department
        </Button>
      </div>

      {/* Department Cards Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-xs">Loading departments...</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments?.map((dept) => (
            <Card
              key={dept.id}
              className="border-border bg-card shadow-sm transition-all hover:border-[#ef233c]/50"
            >
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#ef233c] bg-[#ef233c]/15 px-2 py-0.5 rounded border border-[#ef233c]/30">
                      {dept.code}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        dept.isActive
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                          : "border-zinc-700 bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {dept.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-bold text-white mt-1">
                    {dept.name}
                  </CardTitle>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400">
                  <Building2 className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <p className="text-muted-foreground line-clamp-2 min-h-[32px]">
                  {dept.description || "Operational department for corporate travel services."}
                </p>

                {dept.parentDepartmentCode && (
                  <div className="flex items-center gap-1.5 text-zinc-300 font-medium text-[11px]">
                    <Layers className="h-3.5 w-3.5 text-[#ef233c]" />
                    <span>Parent Division: <strong>{dept.parentDepartmentCode}</strong></span>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-zinc-800/80 pt-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                    <Users className="h-3.5 w-3.5 text-zinc-500" />
                    <span>Assigned Staff:</span>
                  </div>
                  <span className="font-bold text-xs text-white bg-zinc-800 px-2.5 py-0.5 rounded-full border border-zinc-700">
                    {dept.userCount}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Department Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md bg-card border-border text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">Add New Department</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Create an organizational unit with code and hierarchy.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Department Code *</label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. MKT"
                maxLength={10}
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-[#ef233c]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Department Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Marketing & Partnerships"
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-[#ef233c]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Description</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Scope and responsibilities"
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-[#ef233c]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Parent Department (Optional)</label>
              <select
                className="w-full rounded-md border border-zinc-800 p-2 text-xs bg-zinc-900 text-white focus:outline-none focus:border-[#ef233c]"
                value={formData.parentDepartmentCode}
                onChange={(e) => setFormData({ ...formData, parentDepartmentCode: e.target.value })}
              >
                <option value="">None (Top-Level Department)</option>
                {departments?.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
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
              disabled={!formData.code || !formData.name || createMutation.isPending}
              onClick={() => createMutation.mutate(formData)}
            >
              {createMutation.isPending ? "Creating..." : "Save Department"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
