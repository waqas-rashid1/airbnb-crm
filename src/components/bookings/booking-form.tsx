"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { bookingSchema, type BookingInput } from "@/schemas";
import {
  calculateNights,
  calculateNetRevenue,
  formatCurrency,
  PLATFORM_LABELS,
  STATUS_LABELS,
} from "@/lib/calculations";

export type FormPropertyOption = {
  id: string;
  name: string;
  buildingName: string | null;
  roomNumber: string | null;
  floor?: string | null;
  city?: string | null;
};

function optionLabel(p: FormPropertyOption): string {
  const parts = [
    p.roomNumber ? `Apt. ${p.roomNumber}` : null,
    p.buildingName,
  ].filter(Boolean);
  if (parts.length) return parts.join(" · ");
  return p.name;
}

type BookingFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  defaultValues?: Partial<BookingInput>;
  onSubmit: (data: BookingInput) => Promise<void> | void;
  currencySymbol?: string;
  properties: FormPropertyOption[];
  defaultPropertyId?: string | null;
};

const defaults: BookingInput = {
  propertyId: "",
  guestName: "",
  phone: "",
  platform: "AIRBNB",
  checkInDate: "",
  checkInTime: "15:00",
  checkOutDate: "",
  checkOutTime: "11:00",
  guestsCount: 1,
  revenue: 0,
  cleaningFee: 0,
  platformFee: 0,
  discount: 0,
  extraCharges: 0,
  status: "UPCOMING",
  notes: "",
};

export function BookingForm({
  open,
  onOpenChange,
  title = "Booking",
  defaultValues,
  onSubmit,
  currencySymbol = "Rs",
  properties,
  defaultPropertyId,
}: BookingFormProps) {
  const form = useForm<BookingInput>({
    // Zod `.default()` makes input/output differ; cast keeps RHF types aligned
    resolver: zodResolver(bookingSchema) as never,
    defaultValues: {
      ...defaults,
      propertyId: defaultPropertyId ?? "",
      ...defaultValues,
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    if (open) {
      reset({
        ...defaults,
        propertyId: defaultPropertyId ?? "",
        ...defaultValues,
      });
    }
  }, [open, defaultValues, defaultPropertyId, reset]);

  const watched = watch();
  const nights = useMemo(() => {
    if (!watched.checkInDate || !watched.checkOutDate) return 0;
    return calculateNights(watched.checkInDate, watched.checkOutDate);
  }, [watched.checkInDate, watched.checkOutDate]);

  const netPreview = useMemo(
    () =>
      calculateNetRevenue({
        revenue: Number(watched.revenue) || 0,
        cleaningFee: Number(watched.cleaningFee) || 0,
        platformFee: Number(watched.platformFee) || 0,
        discount: Number(watched.discount) || 0,
        extraCharges: Number(watched.extraCharges) || 0,
      }),
    [
      watched.revenue,
      watched.cleaningFee,
      watched.platformFee,
      watched.discount,
      watched.extraCharges,
    ]
  );

  const submit = handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Enter booking details. Nights and net revenue update automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>Property</Label>
            <Select
              value={watched.propertyId || undefined}
              onValueChange={(v) =>
                setValue("propertyId", v, { shouldValidate: true })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {optionLabel(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.propertyId && (
              <p className="text-xs text-destructive">{errors.propertyId.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="guestName">Guest name</Label>
              <Input id="guestName" {...register("guestName")} />
              {errors.guestName && (
                <p className="text-xs text-destructive">{errors.guestName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register("phone")} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select
                value={watched.platform}
                onValueChange={(v) =>
                  setValue("platform", v as BookingInput["platform"], { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PLATFORM_LABELS).map(([k, label]) => (
                    <SelectItem key={k} value={k}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={watched.status}
                onValueChange={(v) =>
                  setValue("status", v as BookingInput["status"], { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([k, label]) => (
                    <SelectItem key={k} value={k}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="checkInDate">Check-in date</Label>
              <Input id="checkInDate" type="date" {...register("checkInDate")} />
              {errors.checkInDate && (
                <p className="text-xs text-destructive">{errors.checkInDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkInTime">Check-in time</Label>
              <Input id="checkInTime" type="time" {...register("checkInTime")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkOutDate">Check-out date</Label>
              <Input id="checkOutDate" type="date" {...register("checkOutDate")} />
              {errors.checkOutDate && (
                <p className="text-xs text-destructive">{errors.checkOutDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkOutTime">Check-out time</Label>
              <Input id="checkOutTime" type="time" {...register("checkOutTime")} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="guestsCount">Guests</Label>
              <Input id="guestsCount" type="number" min={1} {...register("guestsCount")} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Nights (auto)</Label>
              <div className="flex h-9 items-center rounded-md border bg-muted/40 px-3 text-sm font-medium">
                {nights} night{nights === 1 ? "" : "s"}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="revenue">Revenue</Label>
              <Input id="revenue" type="number" step="0.01" min={0} {...register("revenue")} />
              {errors.revenue && (
                <p className="text-xs text-destructive">{errors.revenue.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cleaningFee">Cleaning fee</Label>
              <Input id="cleaningFee" type="number" step="0.01" min={0} {...register("cleaningFee")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="platformFee">Platform fee</Label>
              <Input id="platformFee" type="number" step="0.01" min={0} {...register("platformFee")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount">Discount</Label>
              <Input id="discount" type="number" step="0.01" min={0} {...register("discount")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="extraCharges">Extra charges</Label>
              <Input id="extraCharges" type="number" step="0.01" min={0} {...register("extraCharges")} />
            </div>
            <div className="space-y-2">
              <Label>Net revenue</Label>
              <div className="flex h-9 items-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                {formatCurrency(netPreview, currencySymbol)}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} {...register("notes")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save booking"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
