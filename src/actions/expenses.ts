"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth, requireProperty, type ActionResult } from "@/lib/safe-action";
import { expenseSchema, type ExpenseInput } from "@/schemas";

export async function createExpense(input: ExpenseInput): Promise<ActionResult> {
  try {
    await requireAuth();
    const property = await requireProperty();
    const parsed = expenseSchema.parse(input);

    const expense = await prisma.expense.create({
      data: {
        propertyId: property.id,
        date: new Date(parsed.date),
        category: parsed.category,
        description: parsed.description,
        paidBy: parsed.paidBy || null,
        amount: parsed.amount,
        receiptUrl: parsed.receiptUrl || null,
        isRecurring: parsed.isRecurring,
        monthlyNote: parsed.monthlyNote || null,
      },
    });

    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return { success: true, data: expense };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to create expense" };
  }
}

export async function updateExpense(
  id: string,
  input: ExpenseInput
): Promise<ActionResult> {
  try {
    await requireAuth();
    const parsed = expenseSchema.parse(input);

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        date: new Date(parsed.date),
        category: parsed.category,
        description: parsed.description,
        paidBy: parsed.paidBy || null,
        amount: parsed.amount,
        receiptUrl: parsed.receiptUrl || null,
        isRecurring: parsed.isRecurring,
        monthlyNote: parsed.monthlyNote || null,
      },
    });

    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return { success: true, data: expense };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update expense" };
  }
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  try {
    await requireAuth();
    await prisma.expense.delete({ where: { id } });
    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return { success: true, data: null };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete expense" };
  }
}
