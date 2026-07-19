"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth, requireProperty, type ActionResult } from "@/lib/safe-action";
import {
  ownerSchema,
  ownerTransactionSchema,
  type OwnerInput,
  type OwnerTransactionInput,
} from "@/schemas";
import { toNumber } from "@/lib/calculations";

export async function createOwner(input: OwnerInput): Promise<ActionResult> {
  try {
    await requireAuth();
    const property = await requireProperty();
    const parsed = ownerSchema.parse(input);

    const owner = await prisma.owner.create({
      data: {
        propertyId: property.id,
        name: parsed.name,
        email: parsed.email || null,
        phone: parsed.phone || null,
        notes: parsed.notes || null,
      },
    });

    revalidatePath("/owners");
    revalidatePath("/dashboard");
    return { success: true, data: owner };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to create owner" };
  }
}

export async function updateOwner(id: string, input: OwnerInput): Promise<ActionResult> {
  try {
    await requireAuth();
    const parsed = ownerSchema.parse(input);

    const owner = await prisma.owner.update({
      where: { id },
      data: {
        name: parsed.name,
        email: parsed.email || null,
        phone: parsed.phone || null,
        notes: parsed.notes || null,
      },
    });

    revalidatePath("/owners");
    return { success: true, data: owner };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update owner" };
  }
}

export async function deleteOwner(id: string): Promise<ActionResult> {
  try {
    await requireAuth();
    await prisma.owner.delete({ where: { id } });
    revalidatePath("/owners");
    revalidatePath("/dashboard");
    return { success: true, data: null };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete owner" };
  }
}

export async function createOwnerTransaction(
  input: OwnerTransactionInput
): Promise<ActionResult> {
  try {
    await requireAuth();
    const parsed = ownerTransactionSchema.parse(input);
    const owner = await prisma.owner.findUniqueOrThrow({ where: { id: parsed.ownerId } });

    let investment = toNumber(owner.investment);
    let withdrawal = toNumber(owner.withdrawal);
    let profitDist = toNumber(owner.profitDist);
    let balance = toNumber(owner.balance);

    if (parsed.type === "INVESTMENT") {
      investment += parsed.amount;
      balance += parsed.amount;
    } else if (parsed.type === "WITHDRAWAL") {
      withdrawal += parsed.amount;
      balance -= parsed.amount;
    } else {
      profitDist += parsed.amount;
      balance -= parsed.amount;
    }

    const [tx] = await prisma.$transaction([
      prisma.ownerTransaction.create({
        data: {
          ownerId: parsed.ownerId,
          type: parsed.type,
          amount: parsed.amount,
          date: new Date(parsed.date),
          description: parsed.description || null,
          balanceAfter: balance,
        },
      }),
      prisma.owner.update({
        where: { id: parsed.ownerId },
        data: { investment, withdrawal, profitDist, balance },
      }),
    ]);

    revalidatePath("/owners");
    revalidatePath("/dashboard");
    return { success: true, data: tx };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to create transaction",
    };
  }
}
