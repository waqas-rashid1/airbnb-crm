"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth, type ActionResult } from "@/lib/safe-action";
import { reimbursementSchema, type ReimbursementInput } from "@/schemas";
import { toNumber } from "@/lib/calculations";
import type { ReimbursementStatus } from "@prisma/client";

function deriveStatus(amount: number, reimbursed: number): ReimbursementStatus {
  if (reimbursed <= 0) return "PENDING";
  if (reimbursed + 0.001 >= amount) return "REIMBURSED";
  return "PARTIAL";
}

export async function createReimbursement(
  input: ReimbursementInput
): Promise<ActionResult> {
  try {
    await requireAuth();
    const parsed = reimbursementSchema.parse(input);
    const expense = await prisma.expense.findUniqueOrThrow({
      where: { id: parsed.expenseId },
    });

    const already = toNumber(expense.reimbursedAmount);
    const expenseAmount = toNumber(expense.amount);
    const outstanding = expenseAmount - already;
    if (parsed.amount > outstanding + 0.001) {
      return {
        success: false,
        error: `Amount exceeds outstanding balance (${outstanding.toLocaleString()})`,
      };
    }

    const newReimbursed = already + parsed.amount;

    const [reimbursement] = await prisma.$transaction([
      prisma.reimbursement.create({
        data: {
          expenseId: parsed.expenseId,
          amount: parsed.amount,
          date: new Date(parsed.date),
          paidTo: parsed.paidTo,
          paidFrom: parsed.paidFrom || null,
          notes: parsed.notes || null,
        },
      }),
      prisma.expense.update({
        where: { id: parsed.expenseId },
        data: {
          reimbursedAmount: newReimbursed,
          reimbursementStatus: deriveStatus(expenseAmount, newReimbursed),
        },
      }),
    ]);

    revalidatePath("/reimburse");
    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return { success: true, data: reimbursement };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to create reimbursement",
    };
  }
}

export async function deleteReimbursement(id: string): Promise<ActionResult> {
  try {
    await requireAuth();
    const existing = await prisma.reimbursement.findUniqueOrThrow({
      where: { id },
      include: { expense: true },
    });

    const expenseAmount = toNumber(existing.expense.amount);
    const newReimbursed = Math.max(
      0,
      toNumber(existing.expense.reimbursedAmount) - toNumber(existing.amount)
    );

    await prisma.$transaction([
      prisma.reimbursement.delete({ where: { id } }),
      prisma.expense.update({
        where: { id: existing.expenseId },
        data: {
          reimbursedAmount: newReimbursed,
          reimbursementStatus:
            existing.expense.reimbursementStatus === "NOT_NEEDED"
              ? "NOT_NEEDED"
              : deriveStatus(expenseAmount, newReimbursed),
        },
      }),
    ]);

    revalidatePath("/reimburse");
    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return { success: true, data: null };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to delete reimbursement",
    };
  }
}
