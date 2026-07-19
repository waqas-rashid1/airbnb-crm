import { prisma } from "@/lib/db";
import { toNumber, calculateOccupancyRate, monthKey } from "@/lib/calculations";
import type { DashboardMetrics, MonthlySeries, ChartPoint } from "@/types";
import {
  startOfYear,
  endOfYear,
  startOfMonth,
  endOfMonth,
  addDays,
  format,
  subMonths,
} from "date-fns";

export async function getDashboardMetrics(
  propertyId: string,
  year = new Date().getFullYear()
): Promise<DashboardMetrics> {
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 0, 1));
  const today = new Date();
  const nextWeek = addDays(today, 7);

  const [bookings, expenses, assets, owners] = await Promise.all([
    prisma.booking.findMany({ where: { propertyId } }),
    prisma.expense.findMany({ where: { propertyId } }),
    prisma.asset.findMany({ where: { propertyId } }),
    prisma.owner.findMany({ where: { propertyId } }),
  ]);

  const activeBookings = bookings.filter((b) => b.status !== "CANCELLED");
  const yearBookings = activeBookings.filter(
    (b) => b.checkInDate >= yearStart && b.checkInDate <= yearEnd
  );
  const yearExpenses = expenses.filter(
    (e) => e.date >= yearStart && e.date <= yearEnd
  );

  const totalRevenue = yearBookings.reduce((s, b) => s + toNumber(b.netRevenue), 0);
  const totalExpenses = yearExpenses.reduce((s, e) => s + toNumber(e.amount), 0);
  const netProfit = totalRevenue - totalExpenses;

  const totalInvestment = owners.reduce((s, o) => s + toNumber(o.investment), 0);
  const totalWithdrawals = owners.reduce((s, o) => s + toNumber(o.withdrawal), 0);
  const allTimeRevenue = activeBookings.reduce((s, b) => s + toNumber(b.netRevenue), 0);
  const allTimeExpenses = expenses.reduce((s, e) => s + toNumber(e.amount), 0);
  const cashBalance = totalInvestment + allTimeRevenue - allTimeExpenses - totalWithdrawals;

  const refundableAssets = assets
    .filter((a) => a.isRefundable)
    .reduce((s, a) => s + toNumber(a.currentValue), 0);

  const occupancyRate = calculateOccupancyRate(
    activeBookings.map((b) => ({
      checkInDate: b.checkInDate,
      checkOutDate: b.checkOutDate,
      status: b.status,
    })),
    startOfMonth(today),
    endOfMonth(today)
  );

  const totalNights = yearBookings.reduce((s, b) => s + b.nights, 0);
  const avgRevenuePerNight = totalNights > 0 ? totalRevenue / totalNights : 0;
  const avgBookingValue =
    yearBookings.length > 0 ? totalRevenue / yearBookings.length : 0;

  const upcomingCheckIns = activeBookings.filter(
    (b) =>
      b.status === "UPCOMING" &&
      b.checkInDate >= today &&
      b.checkInDate <= nextWeek
  ).length;

  const upcomingCheckOuts = activeBookings.filter(
    (b) =>
      (b.status === "CHECKED_IN" || b.status === "UPCOMING") &&
      b.checkOutDate >= today &&
      b.checkOutDate <= nextWeek
  ).length;

  return {
    totalRevenue,
    totalExpenses,
    netProfit,
    cashBalance,
    refundableAssets,
    occupancyRate,
    totalBookings: yearBookings.length,
    avgRevenuePerNight,
    upcomingCheckIns,
    upcomingCheckOuts,
    avgBookingValue,
  };
}

export async function getMonthlySeries(
  propertyId: string,
  months = 12
): Promise<MonthlySeries[]> {
  const now = new Date();
  const start = startOfMonth(subMonths(now, months - 1));

  const [bookings, expenses] = await Promise.all([
    prisma.booking.findMany({
      where: {
        propertyId,
        status: { not: "CANCELLED" },
        checkInDate: { gte: start },
      },
    }),
    prisma.expense.findMany({
      where: { propertyId, date: { gte: start } },
    }),
  ]);

  const map = new Map<string, MonthlySeries>();

  for (let i = 0; i < months; i++) {
    const d = subMonths(now, months - 1 - i);
    const key = monthKey(d);
    map.set(key, {
      month: format(d, "MMM yyyy"),
      revenue: 0,
      expenses: 0,
      profit: 0,
      bookings: 0,
    });
  }

  for (const b of bookings) {
    const key = monthKey(b.checkInDate);
    const row = map.get(key);
    if (row) {
      row.revenue += toNumber(b.netRevenue);
      row.bookings += 1;
    }
  }

  for (const e of expenses) {
    const key = monthKey(e.date);
    const row = map.get(key);
    if (row) {
      row.expenses += toNumber(e.amount);
    }
  }

  for (const row of map.values()) {
    row.profit = row.revenue - row.expenses;
  }

  return Array.from(map.values());
}

export async function getExpenseBreakdown(
  propertyId: string,
  year = new Date().getFullYear()
): Promise<ChartPoint[]> {
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 0, 1));

  const expenses = await prisma.expense.findMany({
    where: { propertyId, date: { gte: yearStart, lte: yearEnd } },
  });

  const map = new Map<string, number>();
  for (const e of expenses) {
    map.set(e.category, (map.get(e.category) || 0) + toNumber(e.amount));
  }

  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export async function getCashFlowSeries(
  propertyId: string,
  months = 12
): Promise<ChartPoint[]> {
  const series = await getMonthlySeries(propertyId, months);
  let running = 0;

  const owners = await prisma.owner.findMany({ where: { propertyId } });
  running = owners.reduce((s, o) => s + toNumber(o.investment) - toNumber(o.withdrawal), 0);

  // Approximate: start from investment then add monthly net
  // Recalculate properly from beginning of series
  const expensesBefore = await prisma.expense.aggregate({
    where: {
      propertyId,
      date: { lt: startOfMonth(subMonths(new Date(), months - 1)) },
    },
    _sum: { amount: true },
  });
  const revenueBefore = await prisma.booking.aggregate({
    where: {
      propertyId,
      status: { not: "CANCELLED" },
      checkInDate: { lt: startOfMonth(subMonths(new Date(), months - 1)) },
    },
    _sum: { netRevenue: true },
  });

  running =
    owners.reduce((s, o) => s + toNumber(o.investment) - toNumber(o.withdrawal), 0) +
    toNumber(revenueBefore._sum.netRevenue) -
    toNumber(expensesBefore._sum.amount);

  return series.map((m) => {
    running += m.revenue - m.expenses;
    return { name: m.month, value: Math.round(running) };
  });
}
