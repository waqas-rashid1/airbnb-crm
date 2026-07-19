import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function getPrimaryProperty() {
  const property = await prisma.property.findFirst({
    orderBy: { createdAt: "asc" },
  });
  return property;
}

export async function requireProperty() {
  await requireAuth();
  const property = await getPrimaryProperty();
  if (!property) {
    throw new Error("No property configured");
  }
  return property;
}

export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };
