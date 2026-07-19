import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { toNumber } from "@/lib/calculations";
import { propertyLabel } from "@/lib/property-context";
import { PropertyForm } from "@/components/property/property-form";
import { PageHeader } from "@/components/shared/page-header";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [property, documents, settings] = await Promise.all([
    prisma.property.findUnique({ where: { id } }),
    prisma.document.findMany({
      where: { propertyId: id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.settings.findFirst(),
  ]);

  if (!property) notFound();

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
        title={propertyLabel(property)}
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
