"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/bookings", label: "Bookings" },
  { href: "/expenses", label: "Expenses" },
  { href: "/reimburse", label: "Reimburse" },
  { href: "/owners", label: "Owners" },
  { href: "/assets", label: "Assets" },
  { href: "/property", label: "Property" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
];

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = links.filter((l) =>
    l.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="hidden gap-2 text-muted-foreground md:flex"
        onClick={() => setOpen(true)}
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search...</span>
        <kbd className="pointer-events-none ml-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:flex">
          ⌘K
        </kbd>
      </Button>
      <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)}>
        <Search className="h-4 w-4" />
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[20vh]"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-xl border bg-popover shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Jump to page..."
                className="flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="max-h-64 overflow-y-auto p-1">
              {filtered.map((item) => (
                <button
                  key={item.href}
                  className="flex w-full items-center rounded-md px-3 py-2 text-sm hover:bg-accent"
                  onClick={() => {
                    router.push(item.href);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  {item.label}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="p-4 text-center text-sm text-muted-foreground">No results</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
