"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/authStore";
import { apiFetch } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, User, Plane, ShieldCheck, ArrowRight, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  loginId: z.string().min(1, "Login ID is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      loginId: "admin",
      password: "Admin123!",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const res = await apiFetch<any>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });

      login(res.profile);
      toast.success(`Welcome back, ${res.profile.fullName}!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to log in.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      {/* Left Reference Hero Panel */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-12 text-white border-r border-zinc-800 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ef233c] text-white shadow-lg shadow-[#ef233c]/30">
            <Plane className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">WahanaTravel</h2>
            <p className="text-xs font-semibold tracking-widest text-[#ef233c] uppercase">Admin Portal</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#ef233c]/15 px-4 py-1.5 text-xs font-semibold text-[#ef233c] ring-1 ring-[#ef233c]/30">
            <ShieldCheck className="h-4 w-4" /> Enterprise CRM & Invoice System
          </div>
          <h1 className="text-4xl font-extrabold leading-tight text-white">
            End-to-End Travel Operations, Invoicing & Financial Workflow.
          </h1>
          <p className="max-w-md text-sm text-zinc-400">
            Streamlined corporate travel booking management, multi-tier approvals, granular RBAC, and automated payment allocation.
          </p>

          <div className="flex items-center gap-4 text-xs font-bold tracking-wider">
            <span className="text-[#ef233c]">DREAM</span>
            <span className="text-zinc-600">•</span>
            <span className="text-sky-400">EXPLORE</span>
            <span className="text-zinc-600">•</span>
            <span className="text-emerald-400">DISCOVER</span>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-6 text-xs text-zinc-500">
          <p>Version 1.0.0.0 | Production Stack | PT Wahana Mazmur Wisata</p>
          <p className="mt-1 text-zinc-600">Wahana Travel IT R&D Teams</p>
        </div>
      </div>

      {/* Right Login Box */}
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <Card className="w-full max-w-md border-border bg-card shadow-2xl">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-white">Welcome Back!</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ef233c] text-white lg:hidden">
                <Plane className="h-5 w-5" />
              </div>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Please enter your credentials to access your administrative dashboard and services.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Login ID</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <Input
                    {...register("loginId")}
                    placeholder="Enter login ID"
                    className="pl-9 text-sm bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-[#ef233c] focus:ring-[#ef233c]/20"
                    disabled={isLoading}
                  />
                </div>
                {errors.loginId && (
                  <p className="text-xs text-[#ef233c]">{errors.loginId.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <Input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    className="pl-9 pr-10 text-sm bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-[#ef233c] focus:ring-[#ef233c]/20"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-[#ef233c]">{errors.password.message}</p>
                )}
              </div>

              <div
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    const res = await apiFetch<any>("/api/v1/auth/login", {
                      method: "POST",
                      body: JSON.stringify({ loginId: "admin", password: "Admin123!" }),
                    });
                    login(res.profile);
                    toast.success(`Welcome back, ${res.profile.fullName}!`);
                  } catch (err: any) {
                    toast.error(err.message || "Failed to log in.");
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className="rounded-xl bg-zinc-900/90 hover:bg-zinc-800/90 cursor-pointer transition-colors p-3 text-xs text-zinc-400 border border-zinc-800"
                title="Click to Instant-Login as Admin"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-200">Default Demo Credentials:</span>
                  <span className="text-[10px] bg-[#ef233c] text-white font-medium px-2 py-0.5 rounded">Quick Fill & Login</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span>ID: <code className="font-mono text-zinc-300">admin</code></span>
                  <span>Pass: <code className="font-mono text-zinc-300">Admin123!</code></span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#ef233c] hover:bg-[#d90429] text-white font-medium shadow-lg shadow-[#ef233c]/25 h-10 rounded-xl"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Login to Portal"}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
