"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth, requireProperty, type ActionResult } from "@/lib/safe-action";
import { assetSchema, type AssetInput } from "@/schemas";

export async function createAsset(input: AssetInput): Promise<ActionResult> {
  try {
    await requireAuth();
    const property = await requireProperty();
    const parsed = assetSchema.parse(input);

    const asset = await prisma.asset.create({
      data: {
        propertyId: property.id,
        name: parsed.name,
        purchaseDate: parsed.purchaseDate ? new Date(parsed.purchaseDate) : null,
        cost: parsed.cost,
        currentValue: parsed.currentValue,
        isRefundable: parsed.isRefundable,
        notes: parsed.notes || null,
      },
    });

    revalidatePath("/assets");
    revalidatePath("/dashboard");
    return { success: true, data: asset };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to create asset" };
  }
}

export async function updateAsset(id: string, input: AssetInput): Promise<ActionResult> {
  try {
    await requireAuth();
    const parsed = assetSchema.parse(input);

    const asset = await prisma.asset.update({
      where: { id },
      data: {
        name: parsed.name,
        purchaseDate: parsed.purchaseDate ? new Date(parsed.purchaseDate) : null,
        cost: parsed.cost,
        currentValue: parsed.currentValue,
        isRefundable: parsed.isRefundable,
        notes: parsed.notes || null,
      },
    });

    revalidatePath("/assets");
    revalidatePath("/dashboard");
    return { success: true, data: asset };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update asset" };
  }
}

export async function deleteAsset(id: string): Promise<ActionResult> {
  try {
    await requireAuth();
    await prisma.asset.delete({ where: { id } });
    revalidatePath("/assets");
    revalidatePath("/dashboard");
    return { success: true, data: null };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete asset" };
  }
}
