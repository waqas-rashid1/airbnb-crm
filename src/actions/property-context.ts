"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { PROPERTY_COOKIE } from "@/lib/property-context";
import { requireAuth } from "@/lib/safe-action";

export async function setSelectedProperty(propertyId: string) {
  await requireAuth();
  const cookieStore = await cookies();
  cookieStore.set(PROPERTY_COOKIE, propertyId, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
}
