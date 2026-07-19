import { prisma } from "@/lib/db";
import { SettingsForm } from "@/components/settings/settings-form";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EXPENSE_LABELS, PLATFORM_LABELS } from "@/lib/calculations";

export default async function SettingsPage() {
  const settings = await prisma.settings.findFirst();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Currency, default times, and system preferences"
      />
      <SettingsForm
        settings={
          settings
            ? {
                currency: settings.currency,
                currencySymbol: settings.currencySymbol,
                defaultCheckInTime: settings.defaultCheckInTime,
                defaultCheckOutTime: settings.defaultCheckOutTime,
              }
            : null
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expense Categories</CardTitle>
            <CardDescription>Built-in categories used across the app</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.values(EXPENSE_LABELS).map((label) => (
                <span
                  key={label}
                  className="rounded-md border bg-muted/40 px-2.5 py-1 text-xs"
                >
                  {label}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Booking Platforms</CardTitle>
            <CardDescription>Supported reservation sources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.values(PLATFORM_LABELS).map((label) => (
                <span
                  key={label}
                  className="rounded-md border bg-muted/40 px-2.5 py-1 text-xs"
                >
                  {label}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
