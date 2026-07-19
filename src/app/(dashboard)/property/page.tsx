import { prisma } from "@/lib/db";
import { toNumber } from "@/lib/calculations";
import { PropertiesView } from "@/components/property/properties-view";
import { PageHeader } from "@/components/shared/page-header";

export default async function PropertyListPage() {
  const [properties, settings, bookingCounts, expenseCounts, ownerCounts] =
    await Promise.all([
      prisma.property.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.settings.findFirst(),
      prisma.booking.groupBy({
        by: ["propertyId"],
        _count: { _all: true },
      }),
      prisma.expense.groupBy({
        by: ["propertyId"],
        _count: { _all: true },
      }),
      prisma.owner.groupBy({
        by: ["propertyId"],
        _count: { _all: true },
      }),
    ]);

  const bookingMap = new Map(
    bookingCounts.map((r) => [r.propertyId, r._count._all])
  );
  const expenseMap = new Map(
    expenseCounts.map((r) => [r.propertyId, r._count._all])
  );
  const ownerMap = new Map(
    ownerCounts.map((r) => [r.propertyId, r._count._all])
  );

  const serialized = properties.map((p) => ({
    id: p.id,
    name: p.name,
    buildingName: p.buildingName,
    roomNumber: p.roomNumber,
    floor: p.floor,
    city: p.city,
    address: p.address,
    monthlyRent: toNumber(p.monthlyRent),
    bookingCount: bookingMap.get(p.id) ?? 0,
    expenseCount: expenseMap.get(p.id) ?? 0,
    ownerCount: ownerMap.get(p.id) ?? 0,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Properties"
        description="Manage all properties, leases, and documents"
      />
      <PropertiesView
        properties={serialized}
        currencySymbol={settings?.currencySymbol || "Rs"}
      />
    </div>
  );
}
