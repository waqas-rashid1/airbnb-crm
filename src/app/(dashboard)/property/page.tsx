import { prisma } from "@/lib/db";
import { getPrimaryProperty } from "@/lib/safe-action";
import { toNumber } from "@/lib/calculations";
import { PropertyForm } from "@/components/property/property-form";
import { PageHeader } from "@/components/shared/page-header";

export default async function PropertyPage() {
  const property = await getPrimaryProperty();
  if (!property) {
    return <p className="text-muted-foreground">No property configured.</p>;
  }

  const [documents, settings] = await Promise.all([
    prisma.document.findMany({
      where: { propertyId: property.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.settings.findFirst(),
  ]);

  const serialized = {
    id: property.id,
    name: property.name,
    buildingName: property.buildingName,
    roomNumber: property.roomNumber,
    floor: property.floor,
    city: property.city,
    address: property.address,
    unitType: property.unitType,
    monthlyRent: toNumber(property.monthlyRent),
    securityDeposit: toNumber(property.securityDeposit),
    dealerCommission: toNumber(property.dealerCommission),
    stampPaper: toNumber(property.stampPaper),
    leaseStart: property.leaseStart?.toISOString() ?? null,
    leaseEnd: property.leaseEnd?.toISOString() ?? null,
    landlordName: property.landlordName,
    landlordPhone: property.landlordPhone,
    landlordEmail: property.landlordEmail,
    landlordNotes: property.landlordNotes,
  };

  const docs = documents.map((d) => ({
    id: d.id,
    name: d.name,
    type: d.type,
    url: d.url,
    size: d.size,
    mimeType: d.mimeType,
    createdAt: d.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Property"
        description="Lease details, landlord info, and documents"
      />
      <PropertyForm
        property={serialized}
        documents={docs}
        currencySymbol={settings?.currencySymbol || "Rs"}
      />
    </div>
  );
}
