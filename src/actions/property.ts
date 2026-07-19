"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth, type ActionResult } from "@/lib/safe-action";
import { resolvePropertyId } from "@/lib/property-context";
import { propertySchema, settingsSchema, type PropertyInput, type SettingsInput } from "@/schemas";
import { uploadFile } from "@/lib/supabase";

export async function createProperty(input: PropertyInput): Promise<ActionResult> {
  try {
    await requireAuth();
    const parsed = propertySchema.parse(input);

    const created = await prisma.property.create({
      data: {
        name: parsed.name,
        buildingName: parsed.buildingName || null,
        roomNumber: parsed.roomNumber || null,
        floor: parsed.floor || null,
        city: parsed.city || null,
        address: parsed.address,
        unitType: parsed.unitType || null,
        monthlyRent: parsed.monthlyRent,
        securityDeposit: parsed.securityDeposit,
        dealerCommission: parsed.dealerCommission,
        stampPaper: parsed.stampPaper,
        leaseStart: parsed.leaseStart ? new Date(parsed.leaseStart) : null,
        leaseEnd: parsed.leaseEnd ? new Date(parsed.leaseEnd) : null,
        landlordName: parsed.landlordName || null,
        landlordPhone: parsed.landlordPhone || null,
        landlordEmail: parsed.landlordEmail || null,
        landlordNotes: parsed.landlordNotes || null,
      },
    });

    revalidatePath("/property");
    revalidatePath("/dashboard");
    return { success: true, data: created };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to create property" };
  }
}

export async function updateProperty(
  id: string,
  input: PropertyInput
): Promise<ActionResult> {
  try {
    await requireAuth();
    const parsed = propertySchema.parse(input);

    const updated = await prisma.property.update({
      where: { id },
      data: {
        name: parsed.name,
        buildingName: parsed.buildingName || null,
        roomNumber: parsed.roomNumber || null,
        floor: parsed.floor || null,
        city: parsed.city || null,
        address: parsed.address,
        unitType: parsed.unitType || null,
        monthlyRent: parsed.monthlyRent,
        securityDeposit: parsed.securityDeposit,
        dealerCommission: parsed.dealerCommission,
        stampPaper: parsed.stampPaper,
        leaseStart: parsed.leaseStart ? new Date(parsed.leaseStart) : null,
        leaseEnd: parsed.leaseEnd ? new Date(parsed.leaseEnd) : null,
        landlordName: parsed.landlordName || null,
        landlordPhone: parsed.landlordPhone || null,
        landlordEmail: parsed.landlordEmail || null,
        landlordNotes: parsed.landlordNotes || null,
      },
    });

    revalidatePath("/property");
    revalidatePath(`/property/${id}`);
    revalidatePath("/dashboard");
    return { success: true, data: updated };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update property" };
  }
}

export async function deleteProperty(id: string): Promise<ActionResult> {
  try {
    await requireAuth();
    const count = await prisma.property.count();
    if (count <= 1) {
      return { success: false, error: "Cannot delete the only property" };
    }
    await prisma.property.delete({ where: { id } });
    revalidatePath("/property");
    revalidatePath("/dashboard");
    return { success: true, data: null };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete property" };
  }
}

export async function updateSettings(input: SettingsInput): Promise<ActionResult> {
  try {
    await requireAuth();
    const parsed = settingsSchema.parse(input);

    const existing = await prisma.settings.findFirst();
    const settings = existing
      ? await prisma.settings.update({ where: { id: existing.id }, data: parsed })
      : await prisma.settings.create({ data: parsed });

    revalidatePath("/settings");
    return { success: true, data: settings };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update settings" };
  }
}

export async function uploadDocument(formData: FormData): Promise<ActionResult> {
  try {
    await requireAuth();
    const propertyId =
      (formData.get("propertyId") as string) || (await resolvePropertyId());
    const file = formData.get("file") as File | null;
    const name = (formData.get("name") as string) || file?.name || "Document";
    const type = (formData.get("type") as string) || "OTHER";

    if (!file) return { success: false, error: "No file provided" };

    const path = `documents/${propertyId}/${Date.now()}-${file.name}`;
    const result = await uploadFile("documents", path, file);

    if ("error" in result) {
      return { success: false, error: result.error };
    }

    const doc = await prisma.document.create({
      data: {
        propertyId,
        name,
        type: type as "PROPERTY" | "EXPENSE_RECEIPT" | "LEASE" | "OTHER",
        url: result.url,
        size: file.size,
        mimeType: file.type,
      },
    });

    revalidatePath("/property");
    revalidatePath(`/property/${propertyId}`);
    return { success: true, data: doc };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to upload document" };
  }
}

export async function deleteDocument(id: string): Promise<ActionResult> {
  try {
    await requireAuth();
    await prisma.document.delete({ where: { id } });
    revalidatePath("/property");
    return { success: true, data: null };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete document" };
  }
}

export async function uploadReceipt(formData: FormData): Promise<ActionResult<{ url: string }>> {
  try {
    await requireAuth();
    const propertyId =
      (formData.get("propertyId") as string) || (await resolvePropertyId());
    const file = formData.get("file") as File | null;
    if (!file) return { success: false, error: "No file provided" };

    const path = `receipts/${propertyId}/${Date.now()}-${file.name}`;
    const result = await uploadFile("receipts", path, file);
    if ("error" in result) return { success: false, error: result.error };

    return { success: true, data: { url: result.url } };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to upload receipt" };
  }
}
