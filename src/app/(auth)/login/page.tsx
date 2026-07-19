"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLogo } from "@/components/brand/logo";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <div className="relative hidden flex-col justify-between bg-[#0b1f1e] px-12 py-12 text-white lg:flex">
        <BrandLogo size="md" inverted />
        <div className="max-w-md space-y-4">
          <h1 className="text-[2.35rem] font-semibold leading-[1.15] tracking-tight">
            Host with clarity. Run with calm.
          </h1>
          <p className="text-[15px] leading-relaxed text-white/70">
            Hostora keeps bookings, expenses, owner capital, and reimbursements
            tidy — so your apartment business can grow without the mess.
          </p>
        </div>
        <p className="text-xs text-white/45">Hostora · property CRM</p>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 lg:hidden">
            <BrandLogo size="md" />
          </div>
          <div className="mb-8 space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
            <p className="text-sm text-muted-foreground">
              Use your Hostora admin email and password.
            </p>
          </div>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[13px]">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[13px]">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="h-10"
              />
            </div>
            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            <Button type="submit" className="h-10 w-full" disabled={pending}>
              {pending ? "Signing in..." : "Continue"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
