"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Plus } from "lucide-react";
import { toast } from "sonner";
import { createProperty } from "@/actions/property";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { propertySchema, type PropertyInput } from "@/schemas";
import { formatCurrency } from "@/lib/calculations";

export type PropertyListItem = {
  id: string;
  name: string;
  buildingName: string | null;
  roomNumber: string | null;
  floor: string | null;
  city: string | null;
  address: string;
  monthlyRent: number;
  bookingCount: number;
  expenseCount: number;
  ownerCount: number;
};

type PropertiesViewProps = {
  properties: PropertyListItem[];
  currencySymbol?: string;
};

const createDefaults: PropertyInput = {
  name: "",
  buildingName: "",
  roomNumber: "",
  floor: "",
  city: "",
  address: "",
  unitType: "",
  monthlyRent: 0,
  securityDeposit: 0,
  dealerCommission: 0,
  stampPaper: 0,
  leaseStart: "",
  leaseEnd: "",
  landlordName: "",
  landlordPhone: "",
  landlordEmail: "",
  landlordNotes: "",
};

export function PropertiesView({
  properties,
  currencySymbol = "Rs",
}: PropertiesViewProps) {
  const [open, setOpen] = useState(false);
  const form = useForm<PropertyInput>({
    resolver: zodResolver(propertySchema) as never,
    defaultValues: createDefaults,
  });

  async function onCreate(data: PropertyInput) {
    const result = await createProperty(data);
    if (result.success) {
      toast.success("Property created");
      setOpen(false);
      form.reset(createDefaults);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Add property
        </Button>
      </div>

      {properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No properties yet"
          description="Add your first property to start tracking bookings, expenses, and owners."
          action={
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              Add property
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {properties.map((p) => (
            <Link key={p.id} href={`/property/${p.id}`} className="group block">
              <Card className="h-full shadow-sm transition-colors group-hover:border-primary/40 group-hover:bg-muted/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {[
                      p.buildingName,
                      p.roomNumber ? `Apt. ${p.roomNumber}` : null,
                      p.floor ? `${p.floor} fl` : null,
                      p.city,
                    ]
                      .filter(Boolean)
                      .join(" · ") || p.address}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm font-medium tabular-nums">
                    Rent {formatCurrency(p.monthlyRent, currencySymbol)}
                    <span className="font-normal text-muted-foreground"> / mo</span>
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>{p.bookingCount} bookings</span>
                    <span>{p.expenseCount} expenses</span>
                    <span>{p.ownerCount} owners</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) form.reset(createDefaults);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add property</DialogTitle>
            <DialogDescription>
              Create a new property to manage bookings and expenses separately.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onCreate)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="create-name">Property name</Label>
                <Input id="create-name" {...form.register("name")} />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-building">Building</Label>
                <Input id="create-building" {...form.register("buildingName")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-city">City</Label>
                <Input id="create-city" {...form.register("city")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-room">Room / unit #</Label>
                <Input id="create-room" {...form.register("roomNumber")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-floor">Floor</Label>
                <Input id="create-floor" {...form.register("floor")} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="create-address">Address</Label>
                <Input id="create-address" {...form.register("address")} />
                {form.formState.errors.address && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.address.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-rent">Monthly rent</Label>
                <Input
                  id="create-rent"
                  type="number"
                  step="0.01"
                  min={0}
                  {...form.register("monthlyRent")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-deposit">Security deposit</Label>
                <Input
                  id="create-deposit"
                  type="number"
                  step="0.01"
                  min={0}
                  {...form.register("securityDeposit")}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Creating…" : "Create property"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
