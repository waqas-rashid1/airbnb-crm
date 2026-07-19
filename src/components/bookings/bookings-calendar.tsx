"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PLATFORM_LABELS, STATUS_LABELS } from "@/lib/calculations";
import type { SerializedBooking } from "@/components/bookings/bookings-table";

type BookingsCalendarProps = {
  bookings: SerializedBooking[];
};

const STATUS_COLORS: Record<string, string> = {
  UPCOMING: "bg-amber-500/90 text-white",
  CHECKED_IN: "bg-emerald-600/90 text-white",
  COMPLETED: "bg-slate-500/80 text-white",
  CANCELLED: "bg-red-500/70 text-white line-through",
};

function toDate(value: string | Date): Date {
  return typeof value === "string" ? parseISO(value) : value;
}

export function BookingsCalendar({ bookings }: BookingsCalendarProps) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const activeBookings = useMemo(
    () => bookings.filter((b) => b.status !== "CANCELLED"),
    [bookings]
  );

  function bookingsForDay(day: Date) {
    return activeBookings.filter((b) => {
      const checkIn = toDate(b.checkInDate);
      const checkOut = toDate(b.checkOutDate);
      // Stay nights: inclusive check-in, exclusive check-out
      const lastNight = new Date(checkOut);
      lastNight.setDate(lastNight.getDate() - 1);
      if (lastNight < checkIn) return isSameDay(day, checkIn);
      return isWithinInterval(day, { start: checkIn, end: lastNight });
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{format(cursor, "MMMM yyyy")}</h3>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCursor((c) => subMonths(c, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCursor(startOfMonth(new Date()))}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCursor((c) => addMonths(c, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border bg-border">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div
            key={d}
            className="bg-muted/60 px-2 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
          >
            {d}
          </div>
        ))}

        {days.map((day) => {
          const dayBookings = bookingsForDay(day);
          const inMonth = isSameMonth(day, cursor);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[100px] bg-background p-1.5",
                !inMonth && "bg-muted/30 text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs",
                  isToday && "bg-primary font-semibold text-primary-foreground"
                )}
              >
                {format(day, "d")}
              </div>
              <div className="space-y-0.5">
                {dayBookings.slice(0, 3).map((b) => {
                  const checkIn = toDate(b.checkInDate);
                  const isStart = isSameDay(day, checkIn);
                  return (
                    <div
                      key={b.id}
                      title={`${b.guestName} · ${PLATFORM_LABELS[b.platform] ?? b.platform} · ${STATUS_LABELS[b.status] ?? b.status}`}
                      className={cn(
                        "truncate rounded px-1.5 py-0.5 text-[10px] font-medium leading-tight",
                        STATUS_COLORS[b.status] ?? "bg-primary/80 text-primary-foreground",
                        !isStart && "opacity-90"
                      )}
                    >
                      {isStart ? b.guestName : "·"}
                    </div>
                  );
                })}
                {dayBookings.length > 3 ? (
                  <div className="px-1 text-[10px] text-muted-foreground">
                    +{dayBookings.length - 3} more
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {Object.entries(STATUS_COLORS)
          .filter(([k]) => k !== "CANCELLED")
          .map(([status, color]) => (
            <div key={status} className="flex items-center gap-1.5">
              <span className={cn("inline-block h-2.5 w-2.5 rounded-sm", color.split(" ")[0])} />
              {STATUS_LABELS[status]}
            </div>
          ))}
      </div>
    </div>
  );
}
