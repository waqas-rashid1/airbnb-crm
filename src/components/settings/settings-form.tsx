"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { updateSettings } from "@/actions/property";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { settingsSchema, type SettingsInput } from "@/schemas";

type SettingsFormProps = {
  settings?: Partial<SettingsInput> | null;
};

const defaults: SettingsInput = {
  currency: "PKR",
  currencySymbol: "Rs",
  defaultCheckInTime: "15:00",
  defaultCheckOutTime: "11:00",
};

export function SettingsForm({ settings }: SettingsFormProps) {
  const form = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema) as never,
    defaultValues: { ...defaults, ...settings },
  });

  useEffect(() => {
    form.reset({ ...defaults, ...settings });
  }, [settings, form]);

  async function onSubmit(data: SettingsInput) {
    const result = await updateSettings(data);
    if (result.success) {
      toast.success("Settings saved");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Card className="max-w-lg shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">General settings</CardTitle>
        <CardDescription>
          Currency display and default check-in / check-out times for new bookings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency code</Label>
              <Input
                id="currency"
                placeholder="PKR"
                {...form.register("currency")}
              />
              {form.formState.errors.currency && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.currency.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="currencySymbol">Currency symbol</Label>
              <Input
                id="currencySymbol"
                placeholder="Rs"
                {...form.register("currencySymbol")}
              />
              {form.formState.errors.currencySymbol && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.currencySymbol.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="defaultCheckInTime">Default check-in</Label>
              <Input
                id="defaultCheckInTime"
                type="time"
                {...form.register("defaultCheckInTime")}
              />
              {form.formState.errors.defaultCheckInTime && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.defaultCheckInTime.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultCheckOutTime">Default check-out</Label>
              <Input
                id="defaultCheckOutTime"
                type="time"
                {...form.register("defaultCheckOutTime")}
              />
              {form.formState.errors.defaultCheckOutTime && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.defaultCheckOutTime.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving…" : "Save settings"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
