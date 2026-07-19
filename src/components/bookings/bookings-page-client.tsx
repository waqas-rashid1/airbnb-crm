"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingsTable, type SerializedBooking } from "@/components/bookings/bookings-table";
import { BookingsCalendar } from "@/components/bookings/bookings-calendar";
import type { FormPropertyOption } from "@/components/bookings/booking-form";

export function BookingsPageClient({
  bookings,
  currencySymbol,
  properties,
  selectedPropertyId,
}: {
  bookings: SerializedBooking[];
  currencySymbol: string;
  properties: FormPropertyOption[];
  selectedPropertyId?: string | null;
}) {
  return (
    <Tabs defaultValue="table" className="space-y-4">
      <TabsList>
        <TabsTrigger value="table">Table</TabsTrigger>
        <TabsTrigger value="calendar">Calendar</TabsTrigger>
      </TabsList>
      <TabsContent value="table">
        <BookingsTable
          bookings={bookings}
          currencySymbol={currencySymbol}
          properties={properties}
          selectedPropertyId={selectedPropertyId}
        />
      </TabsContent>
      <TabsContent value="calendar">
        <BookingsCalendar bookings={bookings} />
      </TabsContent>
    </Tabs>
  );
}
