import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export type DashboardMetrics = {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  cashBalance: number;
  refundableAssets: number;
  occupancyRate: number;
  totalBookings: number;
  avgRevenuePerNight: number;
  upcomingCheckIns: number;
  upcomingCheckOuts: number;
  avgBookingValue: number;
};

export type ChartPoint = {
  name: string;
  value: number;
  [key: string]: string | number;
};

export type MonthlySeries = {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  bookings: number;
};
