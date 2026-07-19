"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BrandLogo } from "@/components/brand/logo";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_420px_at_20%_-10%,hsl(var(--surface-glow)),transparent_60%),radial-gradient(700px_360px_at_90%_10%,hsl(var(--brand)/0.14),transparent_55%),hsl(var(--background))]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(hsl(var(--foreground)/0.08)_1px,transparent_1px)] [background-size:22px_22px]" />

      <Card className="glass-panel relative z-10 w-full max-w-md border-[hsl(var(--brand)/0.18)] shadow-[0_30px_80px_-40px_hsl(var(--brand)/0.55)]">
        <CardHeader className="space-y-5 text-center">
          <div className="mx-auto">
            <BrandLogo size="lg" className="justify-center" />
          </div>
          <div>
            <CardTitle className="font-display text-3xl tracking-tight">
              Welcome back
            </CardTitle>
            <CardDescription className="mt-2 text-sm">
              Sign in to manage stays, cashflow, and owners
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="h-11 rounded-xl"
              />
            </div>
            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            <Button
              type="submit"
              className="h-11 w-full rounded-xl text-base font-semibold"
              disabled={pending}
            >
              {pending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
