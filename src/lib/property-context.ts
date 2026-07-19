import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const PROPERTY_COOKIE = "staycrm_property_id";

export type PropertyOption = {
  id: string;
  name: string;
  buildingName: string | null;
  roomNumber: string | null;
  floor: string | null;
  city: string | null;
};

export function propertyLabel(p: {
  name: string;
  buildingName?: string | null;
  roomNumber?: string | null;
  floor?: string | null;
}): string {
  const parts = [
    p.roomNumber ? `Apt. ${p.roomNumber}` : null,
    p.buildingName,
    p.floor ? `${p.floor} fl` : null,
  ].filter(Boolean);
  if (parts.length) return parts.join(" · ");
  return p.name;
}

export async function listProperties(): Promise<PropertyOption[]> {
  return prisma.property.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      buildingName: true,
      roomNumber: true,
      floor: true,
      city: true,
    },
  });
}

export async function getSelectedProperty(preferredId?: string | null) {
  const cookieStore = await cookies();
  const cookieId = cookieStore.get(PROPERTY_COOKIE)?.value;
  const id = preferredId || cookieId;

  if (id) {
    const found = await prisma.property.findUnique({ where: { id } });
    if (found) return found;
  }

  return prisma.property.findFirst({ orderBy: { createdAt: "asc" } });
}

export async function requireSelectedProperty(preferredId?: string | null) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const property = await getSelectedProperty(preferredId);
  if (!property) throw new Error("No property configured");
  return property;
}

export async function resolvePropertyId(explicitId?: string | null) {
  if (explicitId) {
    const found = await prisma.property.findUnique({ where: { id: explicitId } });
    if (found) return found.id;
  }
  const selected = await getSelectedProperty();
  if (!selected) throw new Error("No property configured");
  return selected.id;
}
