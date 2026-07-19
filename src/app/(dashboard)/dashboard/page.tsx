import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Wallet,
  Shield,
  Percent,
  CalendarCheck,
  Moon,
  LogIn,
  LogOut,
} from "lucide-react";
import { getPrimaryProperty } from "@/lib/safe-action";
import {
  getDashboardMetrics,
  getMonthlySeries,
  getExpenseBreakdown,
  getCashFlowSeries,
} from "@/lib/analytics";
import { prisma } from "@/lib/db";
import { formatCurrency, EXPENSE_LABELS } from "@/lib/calculations";
import { MetricCard } from "@/components/dashboard/metric-card";
import {
  RevenueChart,
  ExpenseBreakdownChart,
  BookingTrendChart,
  CashFlowChart,
  ProfitLossChart,
} from "@/components/dashboard/charts";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const property = await getPrimaryProperty();
  if (!property) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <p className="text-muted-foreground">No property found. Run the database seed.</p>
      </div>
    );
  }

  const settings = await prisma.settings.findFirst();
  const symbol = settings?.currencySymbol || "Rs";

  const [metrics, monthly, expenses, cashFlow] = await Promise.all([
    getDashboardMetrics(property.id),
    getMonthlySeries(property.id, 12),
    getExpenseBreakdown(property.id),
    getCashFlowSeries(property.id, 12),
  ]);

  const expenseChart = expenses.map((e) => ({
    ...e,
    name: EXPENSE_LABELS[e.name] || e.name,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`${property.name} · Financial overview`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(metrics.totalRevenue, symbol)}
          icon={DollarSign}
        />
        <MetricCard
          title="Total Expenses"
          value={formatCurrency(metrics.totalExpenses, symbol)}
          icon={TrendingDown}
        />
        <MetricCard
          title="Net Profit"
          value={formatCurrency(metrics.netProfit, symbol)}
          icon={TrendingUp}
          trend={{ value: metrics.netProfit >= 0 ? 100 : -100, label: "YTD" }}
        />
        <MetricCard
          title="Cash Balance"
          value={formatCurrency(metrics.cashBalance, symbol)}
          icon={Wallet}
        />
        <MetricCard
          title="Refundable Assets"
          value={formatCurrency(metrics.refundableAssets, symbol)}
          icon={Shield}
        />
        <MetricCard
          title="Occupancy Rate"
          value={`${metrics.occupancyRate}%`}
          icon={Percent}
          subtitle="This month"
        />
        <MetricCard
          title="Total Bookings"
          value={String(metrics.totalBookings)}
          icon={CalendarCheck}
          subtitle="This year"
        />
        <MetricCard
          title="Avg Revenue / Night"
          value={formatCurrency(metrics.avgRevenuePerNight, symbol)}
          icon={Moon}
        />
        <MetricCard
          title="Upcoming Check-ins"
          value={String(metrics.upcomingCheckIns)}
          icon={LogIn}
          subtitle="Next 7 days"
        />
        <MetricCard
          title="Upcoming Check-outs"
          value={String(metrics.upcomingCheckOuts)}
          icon={LogOut}
          subtitle="Next 7 days"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by Month</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={monthly} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseBreakdownChart data={expenseChart} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Booking Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <BookingTrendChart data={monthly} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <CashFlowChart data={cashFlow} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Monthly Profit / Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfitLossChart data={monthly} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
