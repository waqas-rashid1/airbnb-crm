import { prisma } from "@/lib/db";
import {
  getSelectedProperty,
  listProperties,
} from "@/lib/property-context";
import { toNumber } from "@/lib/calculations";
import { OwnersView } from "@/components/owners/owners-view";
import { PageHeader } from "@/components/shared/page-header";

export default async function OwnersPage() {
  const [property, properties] = await Promise.all([
    getSelectedProperty(),
    listProperties(),
  ]);

  if (!property) {
    return <p className="text-muted-foreground">No property configured.</p>;
  }

  const [owners, settings] = await Promise.all([
    prisma.owner.findMany({
      where: { propertyId: property.id },
      include: { transactions: { orderBy: { date: "desc" } } },
      orderBy: { name: "asc" },
    }),
    prisma.settings.findFirst(),
  ]);

  const serialized = owners.map((o) => ({
    id: o.id,
    name: o.name,
    email: o.email,
    phone: o.phone,
    investment: toNumber(o.investment),
    withdrawal: toNumber(o.withdrawal),
    profitDist: toNumber(o.profitDist),
    balance: toNumber(o.balance),
    notes: o.notes,
    transactions: o.transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: toNumber(t.amount),
      date: t.date.toISOString(),
      description: t.description,
      balanceAfter: toNumber(t.balanceAfter),
    })),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Owners & Investors"
        description="Investments, withdrawals, and profit distribution"
      />
      <OwnersView
        owners={serialized}
        currencySymbol={settings?.currencySymbol || "Rs"}
        properties={properties}
        selectedPropertyId={property.id}
      />
    </div>
  );
}
