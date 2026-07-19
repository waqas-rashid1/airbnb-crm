"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { setSelectedProperty } from "@/actions/property-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type PropertySwitcherItem = {
  id: string;
  name: string;
  buildingName: string | null;
  roomNumber: string | null;
  floor: string | null;
  city: string | null;
};

function switcherLabel(p: PropertySwitcherItem): string {
  const parts = [
    p.roomNumber ? `Apt. ${p.roomNumber}` : null,
    p.buildingName,
  ].filter(Boolean);
  if (parts.length) return parts.join(" · ");
  return p.name;
}

type PropertySwitcherProps = {
  properties: PropertySwitcherItem[];
  selectedId: string | null;
};

export function PropertySwitcher({
  properties,
  selectedId,
}: PropertySwitcherProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (properties.length === 0) {
    return (
      <div className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm text-muted-foreground">
        <Building2 className="h-3.5 w-3.5" />
        No properties
      </div>
    );
  }

  return (
    <Select
      value={selectedId ?? undefined}
      disabled={pending}
      onValueChange={(id) => {
        startTransition(async () => {
          await setSelectedProperty(id);
          router.refresh();
        });
      }}
    >
      <SelectTrigger className="h-9 w-[200px] sm:w-[240px]">
        <span className="flex min-w-0 items-center gap-2">
          <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <SelectValue placeholder="Select property" />
        </span>
      </SelectTrigger>
      <SelectContent>
        {properties.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {switcherLabel(p)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
