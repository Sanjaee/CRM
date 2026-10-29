"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import { UserItem, Department, Branch, RolePermission } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Plus, UserCheck, Shield } from "lucide-react";

const ALL_AVAILABLE_PERMISSIONS = [
  "FullAccess",
  "customers.read",
  "customers.create",
  "customers.update",
  "customers.archive",
  "invoices.read",
  "invoices.create",
  "invoices.update",
  "invoices.approve",
  "invoices.issue",
  "invoices.cancel",
  "payments.read",
  "payments.record",
  "departments.manage",
  "branches.manage",
  "users.manage",
  "roles.manage",
  "audit.read",
  "reports.export",
];

export default function RbacUsersView() {
  const queryClient = useQueryClient();
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("Administrator");

  // User form
  const [userForm, setUserForm] = useState({
    fullName: "",
    email: "",
    phoneNo: "",
    loginId: "",
    password: "Password123!",
    role: "Staff",
    departmentCode: "TKT",
    branchCode: "PL",
  });

  const { data: users, isLoading: usersLoading } = useQuery<UserItem[]>({
    queryKey: ["users"],
    queryFn: () => apiFetch("/api/v1/users"),
  });

  const { data: departments } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: () => apiFetch("/api/v1/departments"),
  });

  const { data: branches } = useQuery<Branch[]>({
    queryKey: ["branches"],
    queryFn: () => apiFetch("/api/v1/branches"),
  });

  const { data: rolePermissions } = useQuery<RolePermission[]>({
    queryKey: ["role-permissions"],
    queryFn: () => apiFetch("/api/v1/users/roles/permissions"),
  });

  const createUserMutation = useMutation({
    mutationFn: (data: typeof userForm) =>
      apiFetch("/api/v1/users", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setIsCreateUserOpen(false);
      toast.success("Staff user created and assigned successfully.");
      setUserForm({
        fullName: "",
        email: "",
        phoneNo: "",
        loginId: "",
        password: "Password123!",
        role: "Staff",
        departmentCode: "TKT",
        branchCode: "PL",
      });
    },
    onError: (err: any) => toast.error(err.message || "Failed to create user."),
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: ({ role, permissions }: { role: string; permissions: string[] }) =>
      apiFetch(`/api/v1/users/roles/${role}/permissions`, {
        method: "PUT",
        body: JSON.stringify({ permissions }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
      toast.success("Role permissions updated successfully.");
    },
    onError: (err: any) => toast.error(err.message || "Failed to update permissions."),
  });

  const currentRoleObj = rolePermissions?.find((r) => r.role === selectedRole);
  const currentPermissions = currentRoleObj?.permissions || [];

  const handleTogglePermission = (perm: string) => {
    let next: string[];
    if (currentPermissions.includes(perm)) {
      next = currentPermissions.filter((p) => p !== perm);
    } else {
      next = [...currentPermissions, perm];
    }
    updatePermissionsMutation.mutate({ role: selectedRole, permissions: next });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            RBAC & User Administration
          </h1>
          <p className="text-xs text-muted-foreground">
            Role-Based Access Control, granular permission matrices, and back-office staff accounts.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setIsCreateUserOpen(true)}
          className="gap-2 bg-[#ef233c] hover:bg-[#d90429] text-white shadow-md shadow-[#ef233c]/25"
        >
          <Plus className="h-4 w-4" /> Create Admin User
        </Button>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
          <TabsTrigger value="users" className="gap-2 text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
            <UserCheck className="h-4 w-4 text-[#ef233c]" /> Users & Assignments
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2 text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
            <Shield className="h-4 w-4 text-[#ef233c]" /> Role Permission Matrix
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card className="border-border bg-card shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-900/80 border-b border-border">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="font-semibold text-zinc-400 text-xs">User No</TableHead>
                  <TableHead className="font-semibold text-zinc-400 text-xs">Full Name</TableHead>
                  <TableHead className="font-semibold text-zinc-400 text-xs">Login ID</TableHead>
                  <TableHead className="font-semibold text-zinc-400 text-xs">Role</TableHead>
                  <TableHead className="font-semibold text-zinc-400 text-xs">Department</TableHead>
                  <TableHead className="font-semibold text-zinc-400 text-xs">Branch Office</TableHead>
                  <TableHead className="font-semibold text-zinc-400 text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-xs">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : (
                  users?.map((u) => (
                    <TableRow key={u.id} className="border-border hover:bg-zinc-900/50 transition-colors">
                      <TableCell className="font-mono text-xs font-semibold text-[#ef233c]">
                        {u.userNo}
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold text-white text-xs">{u.fullName}</p>
                        <p className="text-[11px] text-muted-foreground">{u.email}</p>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-300">{u.loginId}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] border-zinc-700 bg-zinc-800 text-zinc-300">
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-zinc-300 font-medium">
                        {u.departmentName || u.departmentCode || "Global"}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-300 font-medium">
                        {u.branchName || u.branchCode || "Head Office"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                          Active
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Roles & Permissions Matrix Tab */}
        <TabsContent value="roles">
          <Card className="border-border bg-card shadow-sm p-6 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase text-muted-foreground mr-2">Select Role:</span>
              {["Administrator", "Director", "Manager", "Staff", "Auditor"].map((r) => (
                <Button
                  key={r}
                  size="sm"
                  variant={selectedRole === r ? "default" : "outline"}
                  onClick={() => setSelectedRole(r)}
                  className={
                    selectedRole === r
                      ? "bg-[#ef233c] text-white hover:bg-[#d90429] shadow-sm shadow-[#ef233c]/20"
                      : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                  }
                >
                  {r}
                </Button>
              ))}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white">
                Permissions Configuration for: <span className="text-[#ef233c]">{selectedRole}</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Toggle granular permissions. Policy enforcement is processed in real time by ASP.NET Core backend.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                {ALL_AVAILABLE_PERMISSIONS.map((perm) => {
                  const isChecked = currentPermissions.includes(perm);
                  return (
                    <label
                      key={perm}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? "bg-[#ef233c]/10 border-[#ef233c]/40 text-white"
                          : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                      }`}
                    >
                      <span className="font-mono text-xs">{perm}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleTogglePermission(perm)}
                        disabled={updatePermissionsMutation.isPending}
                        className="rounded text-[#ef233c] focus:ring-[#ef233c] h-4 w-4"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create User Dialog */}
      <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
        <DialogContent className="max-w-md bg-card border-border text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">Create Administrative User</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Assign new staff credentials, role tier, department, and branch.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Full Name *</label>
              <Input
                value={userForm.fullName}
                onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                placeholder="e.g. Dewi Lestari"
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-[#ef233c]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Email Address *</label>
              <Input
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                placeholder="dewi@wahanatravel.id"
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-[#ef233c]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Phone</label>
              <Input
                value={userForm.phoneNo}
                onChange={(e) => setUserForm({ ...userForm, phoneNo: e.target.value })}
                placeholder="0812..."
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-[#ef233c]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Login ID *</label>
                <Input
                  value={userForm.loginId}
                  onChange={(e) => setUserForm({ ...userForm, loginId: e.target.value })}
                  placeholder="dewi.staff"
                  className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-[#ef233c]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Password</label>
                <Input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white focus:border-[#ef233c]"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Role Tier</label>
              <select
                className="w-full rounded-md border border-zinc-800 p-2 text-xs bg-zinc-900 text-white focus:outline-none focus:border-[#ef233c]"
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
              >
                <option value="Staff">Staff</option>
                <option value="Manager">Manager</option>
                <option value="Director">Director</option>
                <option value="Administrator">Administrator</option>
                <option value="Auditor">Auditor</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Department</label>
                <select
                  className="w-full rounded-md border border-zinc-800 p-2 text-xs bg-zinc-900 text-white focus:outline-none focus:border-[#ef233c]"
                  value={userForm.departmentCode}
                  onChange={(e) => setUserForm({ ...userForm, departmentCode: e.target.value })}
                >
                  {departments?.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Branch Office</label>
                <select
                  className="w-full rounded-md border border-zinc-800 p-2 text-xs bg-zinc-900 text-white focus:outline-none focus:border-[#ef233c]"
                  value={userForm.branchCode}
                  onChange={(e) => setUserForm({ ...userForm, branchCode: e.target.value })}
                >
                  {branches?.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.code} - {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateUserOpen(false)}
              className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              className="bg-[#ef233c] hover:bg-[#d90429] text-white shadow-md shadow-[#ef233c]/25"
              disabled={!userForm.fullName || !userForm.loginId || createUserMutation.isPending}
              onClick={() => createUserMutation.mutate(userForm)}
            >
              {createUserMutation.isPending ? "Creating..." : "Create Staff"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
