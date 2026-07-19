"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingsTable, type SerializedBooking } from "@/components/bookings/bookings-table";
import { BookingsCalendar } from "@/components/bookings/bookings-calendar";

export function BookingsPageClient({
  bookings,
  currencySymbol,
}: {
  bookings: SerializedBooking[];
  currencySymbol: string;
}) {
  return (
    <Tabs defaultValue="table" className="space-y-4">
      <TabsList>
        <TabsTrigger value="table">Table</TabsTrigger>
        <TabsTrigger value="calendar">Calendar</TabsTrigger>
      </TabsList>
      <TabsContent value="table">
        <BookingsTable bookings={bookings} currencySymbol={currencySymbol} />
      </TabsContent>
      <TabsContent value="calendar">
        <BookingsCalendar bookings={bookings} />
      </TabsContent>
    </Tabs>
  );
}
