"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth, type ActionResult } from "@/lib/safe-action";
import { resolvePropertyId } from "@/lib/property-context";
import { bookingSchema, type BookingInput } from "@/schemas";
import {
  calculateNights,
  calculateNetRevenue,
  generateBookingCode,
} from "@/lib/calculations";

export async function createBooking(input: BookingInput): Promise<ActionResult> {
  try {
    await requireAuth();
    const parsed = bookingSchema.parse(input);
    const propertyId = await resolvePropertyId(parsed.propertyId);

    const count = await prisma.booking.count({ where: { propertyId } });
    const nights = calculateNights(parsed.checkInDate, parsed.checkOutDate);
    const netRevenue = calculateNetRevenue(parsed);

    const booking = await prisma.booking.create({
      data: {
        bookingCode: generateBookingCode(count + 1),
        propertyId,
        guestName: parsed.guestName,
        phone: parsed.phone || null,
        platform: parsed.platform,
        checkInDate: new Date(parsed.checkInDate),
        checkInTime: parsed.checkInTime,
        checkOutDate: new Date(parsed.checkOutDate),
        checkOutTime: parsed.checkOutTime,
        nights,
        guestsCount: parsed.guestsCount,
        revenue: parsed.revenue,
        cleaningFee: parsed.cleaningFee,
        platformFee: parsed.platformFee,
        discount: parsed.discount,
        extraCharges: parsed.extraCharges,
        netRevenue,
        status: parsed.status,
        notes: parsed.notes || null,
      },
    });

    revalidatePath("/bookings");
    revalidatePath("/dashboard");
    revalidatePath("/reimburse");
    return { success: true, data: booking };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to create booking" };
  }
}

export async function updateBooking(
  id: string,
  input: BookingInput
): Promise<ActionResult> {
  try {
    await requireAuth();
    const parsed = bookingSchema.parse(input);
    const nights = calculateNights(parsed.checkInDate, parsed.checkOutDate);
    const netRevenue = calculateNetRevenue(parsed);
    const propertyId = await resolvePropertyId(parsed.propertyId);

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        propertyId,
        guestName: parsed.guestName,
        phone: parsed.phone || null,
        platform: parsed.platform,
        checkInDate: new Date(parsed.checkInDate),
        checkInTime: parsed.checkInTime,
        checkOutDate: new Date(parsed.checkOutDate),
        checkOutTime: parsed.checkOutTime,
        nights,
        guestsCount: parsed.guestsCount,
        revenue: parsed.revenue,
        cleaningFee: parsed.cleaningFee,
        platformFee: parsed.platformFee,
        discount: parsed.discount,
        extraCharges: parsed.extraCharges,
        netRevenue,
        status: parsed.status,
        notes: parsed.notes || null,
      },
    });

    revalidatePath("/bookings");
    revalidatePath("/dashboard");
    revalidatePath("/reimburse");
    return { success: true, data: booking };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update booking" };
  }
}

export async function deleteBooking(id: string): Promise<ActionResult> {
  try {
    await requireAuth();
    await prisma.booking.delete({ where: { id } });
    revalidatePath("/bookings");
    revalidatePath("/dashboard");
    revalidatePath("/reimburse");
    return { success: true, data: null };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete booking" };
  }
}
