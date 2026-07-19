import { differenceInCalendarDays, format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval, max, min } from "date-fns";

export function calculateNights(checkIn: Date | string, checkOut: Date | string): number {
  const inDate = typeof checkIn === "string" ? parseISO(checkIn) : checkIn;
  const outDate = typeof checkOut === "string" ? parseISO(checkOut) : checkOut;
  const nights = differenceInCalendarDays(outDate, inDate);
  return Math.max(nights, 0);
}

export function calculateNetRevenue(params: {
  revenue: number;
  cleaningFee?: number;
  platformFee?: number;
  discount?: number;
  extraCharges?: number;
}): number {
  const {
    revenue,
    cleaningFee = 0,
    platformFee = 0,
    discount = 0,
    extraCharges = 0,
  } = params;
  return revenue + cleaningFee + extraCharges - platformFee - discount;
}

export function formatCurrency(
  amount: number | string,
  symbol = "Rs",
  locale = "en-PK"
): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  if (Number.isNaN(value)) return `${symbol} 0`;
  return `${symbol} ${value.toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function formatDate(date: Date | string, pattern = "dd MMM yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, pattern);
}

export function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value) || 0;
  if (value && typeof value === "object" && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value) || 0;
}

export function generateBookingCode(seq: number): string {
  const year = new Date().getFullYear();
  return `BK-${year}-${String(seq).padStart(4, "0")}`;
}

export function calculateOccupancyRate(
  bookings: { checkInDate: Date; checkOutDate: Date; status: string }[],
  start: Date,
  end: Date
): number {
  const days = eachDayOfInterval({ start, end });
  if (days.length === 0) return 0;

  const active = bookings.filter((b) => b.status !== "CANCELLED");
  let occupied = 0;

  for (const day of days) {
    const isOccupied = active.some((b) => {
      const intervalStart = b.checkInDate;
      const intervalEnd = new Date(b.checkOutDate);
      intervalEnd.setHours(0, 0, 0, 0);
      return day >= intervalStart && day < intervalEnd;
    });
    if (isOccupied) occupied++;
  }

  return Math.round((occupied / days.length) * 1000) / 10;
}

export function monthKey(date: Date): string {
  return format(date, "yyyy-MM");
}

export function getMonthRange(year: number, month: number) {
  const start = startOfMonth(new Date(year, month - 1));
  const end = endOfMonth(start);
  return { start, end };
}

export function overlapNights(
  checkIn: Date,
  checkOut: Date,
  rangeStart: Date,
  rangeEnd: Date
): number {
  const start = max([checkIn, rangeStart]);
  const end = min([checkOut, rangeEnd]);
  if (start >= end) return 0;
  return differenceInCalendarDays(end, start);
}

export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  return isWithinInterval(date, { start, end });
}

export const PLATFORM_LABELS: Record<string, string> = {
  AIRBNB: "Airbnb",
  BOOKING_COM: "Booking.com",
  DIRECT: "Direct",
  OTHER: "Other",
};

export const STATUS_LABELS: Record<string, string> = {
  UPCOMING: "Upcoming",
  CHECKED_IN: "Checked In",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const EXPENSE_LABELS: Record<string, string> = {
  RENT: "Rent",
  ELECTRICITY: "Electricity",
  GAS: "Gas",
  WATER: "Water",
  INTERNET: "Internet",
  CLEANING: "Cleaning",
  LAUNDRY: "Laundry",
  MAINTENANCE: "Maintenance",
  FURNITURE: "Furniture",
  APPLIANCES: "Appliances",
  LEGAL: "Legal",
  COMMISSION: "Commission",
  SUPPLIES: "Supplies",
  SALARY: "Salary",
  MARKETING: "Marketing",
  TAXES: "Taxes",
  MISCELLANEOUS: "Miscellaneous",
};

export const OWNER_TX_LABELS: Record<string, string> = {
  INVESTMENT: "Investment",
  WITHDRAWAL: "Withdrawal",
  PROFIT_DISTRIBUTION: "Profit Distribution",
};
