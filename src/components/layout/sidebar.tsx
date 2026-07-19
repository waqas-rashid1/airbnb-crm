"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Receipt,
  Wallet,
  Users,
  Package,
  Building2,
  FileBarChart,
  Settings,
  ListTodo,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand/logo";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/reimburse", label: "Reimburse", icon: Wallet },
  { href: "/owners", label: "Owners", icon: Users },
  { href: "/assets", label: "Assets", icon: Package },
  { href: "/property", label: "Property", icon: Building2 },
  { href: "/notes", label: "Notes & Tasks", icon: ListTodo },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const Nav = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <BrandLogo size="sm" />
      </div>
      <nav className="flex-1 space-y-0.5 p-2.5">
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13.5px] font-medium",
                active
                  ? "bg-white text-foreground shadow-sm ring-1 ring-border dark:bg-card"
                  : "text-sidebar-foreground hover:bg-white/70 hover:text-foreground dark:hover:bg-card/60"
              )}
            >
              {active ? (
                <span className="absolute bottom-1.5 left-0 top-1.5 w-[2px] rounded-r bg-[hsl(var(--brand))]" />
              ) : null}
              <item.icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-[hsl(var(--brand))]" : "opacity-70"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border px-4 py-3">
        <p className="text-[12px] leading-snug text-muted-foreground">
          Hostora · multi-unit ops
        </p>
      </div>
    </div>
  );

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed left-4 top-3 z-50 lg:hidden"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-56 border-r border-sidebar-border bg-sidebar transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {Nav}
      </aside>
    </>
  );
}
