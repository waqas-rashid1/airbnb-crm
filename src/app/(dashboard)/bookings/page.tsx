import { prisma } from "@/lib/db";
import { getPrimaryProperty } from "@/lib/safe-action";
import { toNumber } from "@/lib/calculations";
import { BookingsPageClient } from "@/components/bookings/bookings-page-client";
import { PageHeader } from "@/components/shared/page-header";

export default async function BookingsPage() {
  const property = await getPrimaryProperty();
  if (!property) {
    return <p className="text-muted-foreground">No property configured.</p>;
  }

  const [bookings, settings] = await Promise.all([
    prisma.booking.findMany({
      where: { propertyId: property.id },
      orderBy: { checkInDate: "desc" },
    }),
    prisma.settings.findFirst(),
  ]);

  const serialized = bookings.map((b) => ({
    id: b.id,
    bookingCode: b.bookingCode,
    guestName: b.guestName,
    phone: b.phone,
    platform: b.platform,
    checkInDate: b.checkInDate.toISOString(),
    checkInTime: b.checkInTime,
    checkOutDate: b.checkOutDate.toISOString(),
    checkOutTime: b.checkOutTime,
    nights: b.nights,
    guestsCount: b.guestsCount,
    revenue: toNumber(b.revenue),
    cleaningFee: toNumber(b.cleaningFee),
    platformFee: toNumber(b.platformFee),
    discount: toNumber(b.discount),
    extraCharges: toNumber(b.extraCharges),
    netRevenue: toNumber(b.netRevenue),
    status: b.status,
    notes: b.notes,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings"
        description="Manage reservations, calendar, and guest stays"
      />
      <BookingsPageClient
        bookings={serialized}
        currencySymbol={settings?.currencySymbol || "Rs"}
      />
    </div>
  );
}
