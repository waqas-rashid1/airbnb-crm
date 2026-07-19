"use client";

import { LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/actions/auth";

export function UserMenu({ name }: { name?: string | null }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
            <User className="h-3.5 w-3.5" />
          </div>
          <span className="hidden sm:inline">{name || "Admin"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5 text-sm">
          <p className="font-medium">{name || "Admin"}</p>
          <p className="text-xs text-muted-foreground">Administrator</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => logoutAction()}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
