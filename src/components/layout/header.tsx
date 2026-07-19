"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { CommandSearch } from "@/components/layout/command-search";
import {
  PropertySwitcher,
  type PropertySwitcherItem,
} from "@/components/layout/property-switcher";

const labels: Record<string, string> = {
  dashboard: "Dashboard",
  bookings: "Bookings",
  expenses: "Expenses",
  reimburse: "Reimburse",
  owners: "Owners",
  assets: "Assets",
  property: "Property",
  notes: "Notes & Tasks",
  reports: "Reports",
  settings: "Settings",
};

type HeaderProps = {
  userName?: string | null;
  properties: PropertySwitcherItem[];
  selectedPropertyId: string | null;
};

export function Header({
  userName,
  properties,
  selectedPropertyId,
}: HeaderProps) {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background/90 px-4 backdrop-blur-sm lg:px-6">
      <div className="flex min-w-0 items-center gap-2 pl-12 lg:pl-0">
        <nav className="flex items-center gap-1 truncate text-[13px] text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground">
            Home
          </Link>
          {parts.map((part, i) => (
            <span key={`${part}-${i}`} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
              <Link
                href={`/${parts.slice(0, i + 1).join("/")}`}
                className={
                  i === parts.length - 1
                    ? "truncate font-medium text-foreground"
                    : "truncate hover:text-foreground"
                }
              >
                {labels[part] || part}
              </Link>
            </span>
          ))}
        </nav>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <PropertySwitcher
          properties={properties}
          selectedId={selectedPropertyId}
        />
        <CommandSearch />
        <ThemeToggle />
        <UserMenu name={userName} />
      </div>
    </header>
  );
}
