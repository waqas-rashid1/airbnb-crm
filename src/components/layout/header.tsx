"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { CommandSearch } from "@/components/layout/command-search";

const labels: Record<string, string> = {
  dashboard: "Dashboard",
  bookings: "Bookings",
  expenses: "Expenses",
  owners: "Owners",
  assets: "Assets",
  property: "Property",
  reports: "Reports",
  settings: "Settings",
};

export function Header({ userName }: { userName?: string | null }) {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-md lg:px-6">
      <div className="flex items-center gap-2 pl-12 lg:pl-0">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground">
            Home
          </Link>
          {parts.map((part, i) => (
            <span key={part} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5" />
              <Link
                href={`/${parts.slice(0, i + 1).join("/")}`}
                className={
                  i === parts.length - 1
                    ? "font-medium text-foreground"
                    : "hover:text-foreground"
                }
              >
                {labels[part] || part}
              </Link>
            </span>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <CommandSearch />
        <ThemeToggle />
        <UserMenu name={userName} />
      </div>
    </header>
  );
}
