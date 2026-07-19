"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth, type ActionResult } from "@/lib/safe-action";
import { resolvePropertyId } from "@/lib/property-context";
import { taskSchema, type TaskInput } from "@/schemas";
import type { TaskStatus } from "@prisma/client";

function revalidateTasks() {
  revalidatePath("/notes");
  revalidatePath("/dashboard");
}

export async function createTask(input: TaskInput): Promise<ActionResult> {
  try {
    await requireAuth();
    const parsed = taskSchema.parse(input);
    const propertyId = await resolvePropertyId(parsed.propertyId);

    const task = await prisma.task.create({
      data: {
        propertyId,
        title: parsed.title.trim(),
        description: parsed.description?.trim() || null,
        status: parsed.status,
        priority: parsed.priority,
        dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
        completedAt: parsed.status === "DONE" ? new Date() : null,
      },
    });

    revalidateTasks();
    return { success: true, data: task };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to create task",
    };
  }
}

export async function updateTask(
  id: string,
  input: TaskInput
): Promise<ActionResult> {
  try {
    await requireAuth();
    const parsed = taskSchema.parse(input);
    const propertyId = await resolvePropertyId(parsed.propertyId);
    const existing = await prisma.task.findUniqueOrThrow({ where: { id } });

    const task = await prisma.task.update({
      where: { id },
      data: {
        propertyId,
        title: parsed.title.trim(),
        description: parsed.description?.trim() || null,
        status: parsed.status,
        priority: parsed.priority,
        dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
        completedAt:
          parsed.status === "DONE"
            ? existing.completedAt ?? new Date()
            : null,
      },
    });

    revalidateTasks();
    return { success: true, data: task };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to update task",
    };
  }
}

export async function setTaskStatus(
  id: string,
  status: TaskStatus
): Promise<ActionResult> {
  try {
    await requireAuth();
    const task = await prisma.task.update({
      where: { id },
      data: {
        status,
        completedAt: status === "DONE" ? new Date() : null,
      },
    });
    revalidateTasks();
    return { success: true, data: task };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to update status",
    };
  }
}

export async function deleteTask(id: string): Promise<ActionResult> {
  try {
    await requireAuth();
    await prisma.task.delete({ where: { id } });
    revalidateTasks();
    return { success: true, data: null };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to delete task",
    };
  }
}
