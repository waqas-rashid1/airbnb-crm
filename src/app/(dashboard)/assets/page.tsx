import { prisma } from "@/lib/db";
import {
  getSelectedProperty,
  listProperties,
} from "@/lib/property-context";
import { toNumber } from "@/lib/calculations";
import { AssetsTable } from "@/components/assets/assets-table";
import { PageHeader } from "@/components/shared/page-header";

export default async function AssetsPage() {
  const [property, properties] = await Promise.all([
    getSelectedProperty(),
    listProperties(),
  ]);

  if (!property) {
    return <p className="text-muted-foreground">No property configured.</p>;
  }

  const [assets, settings] = await Promise.all([
    prisma.asset.findMany({
      where: { propertyId: property.id },
      orderBy: { name: "asc" },
    }),
    prisma.settings.findFirst(),
  ]);

  const serialized = assets.map((a) => ({
    id: a.id,
    propertyId: a.propertyId,
    name: a.name,
    purchaseDate: a.purchaseDate?.toISOString() ?? null,
    cost: toNumber(a.cost),
    currentValue: toNumber(a.currentValue),
    isRefundable: a.isRefundable,
    notes: a.notes,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assets"
        description="Refundable deposits and property inventory"
      />
      <AssetsTable
        assets={serialized}
        currencySymbol={settings?.currencySymbol || "Rs"}
        properties={properties}
        selectedPropertyId={property.id}
      />
    </div>
  );
}
