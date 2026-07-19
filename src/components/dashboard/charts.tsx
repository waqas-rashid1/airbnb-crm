"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPoint, MonthlySeries } from "@/types";
import { formatCurrency } from "@/lib/calculations";

const CHART_COLORS = [
  "hsl(var(--chart-1, 221 83% 53%))",
  "hsl(var(--chart-2, 142 71% 45%))",
  "hsl(var(--chart-3, 38 92% 50%))",
  "hsl(var(--chart-4, 0 72% 51%))",
  "hsl(var(--chart-5, 262 83% 58%))",
  "hsl(200 80% 50%)",
  "hsl(320 70% 50%)",
  "hsl(160 60% 40%)",
];

const tooltipStyle = {
  borderRadius: "8px",
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--popover))",
  fontSize: "12px",
};

type CurrencyProps = { currencySymbol?: string };

export function RevenueChart({
  data,
  currencySymbol = "Rs",
}: { data: MonthlySeries[] } & CurrencyProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(221 83% 53%)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="hsl(221 83% 53%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatCurrency(v, currencySymbol)}
          width={72}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value: number) => [formatCurrency(value, currencySymbol), "Revenue"]}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="hsl(221 83% 53%)"
          fill="url(#revenueFill)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ExpenseBreakdownChart({
  data,
  currencySymbol = "Rs",
}: { data: ChartPoint[] } & CurrencyProps) {
  if (!data.length) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
        No expense data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value: number) => formatCurrency(value, currencySymbol)}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          wrapperStyle={{ fontSize: 11 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function BookingTrendChart({ data }: { data: MonthlySeries[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={32}
        />
        <Tooltip contentStyle={tooltipStyle} />
        <Line
          type="monotone"
          dataKey="bookings"
          stroke="hsl(142 71% 45%)"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CashFlowChart({
  data,
  currencySymbol = "Rs",
}: { data: ChartPoint[] } & CurrencyProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="cashFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(262 83% 58%)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="hsl(262 83% 58%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatCurrency(v, currencySymbol)}
          width={72}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value: number) => [formatCurrency(value, currencySymbol), "Balance"]}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="hsl(262 83% 58%)"
          fill="url(#cashFill)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ProfitLossChart({
  data,
  currencySymbol = "Rs",
}: { data: MonthlySeries[] } & CurrencyProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatCurrency(v, currencySymbol)}
          width={72}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value: number) => [formatCurrency(value, currencySymbol), "P&L"]}
        />
        <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.profit >= 0 ? "hsl(142 71% 45%)" : "hsl(0 72% 51%)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
