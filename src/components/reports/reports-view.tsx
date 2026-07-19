"use client";

import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  EXPENSE_LABELS,
  formatCurrency,
  formatDate,
  PLATFORM_LABELS,
  STATUS_LABELS,
} from "@/lib/calculations";
import type { SerializedBooking } from "@/components/bookings/bookings-table";
import type { SerializedExpense } from "@/components/expenses/expenses-table";
import type { SerializedOwner } from "@/components/owners/owners-view";
import type { SerializedAsset } from "@/components/assets/assets-table";

type ReportType = "bookings" | "expenses" | "owners" | "assets" | "pnl";

type ReportsViewProps = {
  bookings: SerializedBooking[];
  expenses: SerializedExpense[];
  owners: SerializedOwner[];
  assets: SerializedAsset[];
  currencySymbol?: string;
};

type PreviewRow = Record<string, string | number>;

function inPeriod(
  date: string | Date,
  from: string,
  to: string
): boolean {
  if (!from && !to) return true;
  const d = typeof date === "string" ? new Date(date) : date;
  const t = d.getTime();
  if (from && t < new Date(from).getTime()) return false;
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    if (t > end.getTime()) return false;
  }
  return true;
}

function escapeCsv(value: string | number): string {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadCsv(filename: string, headers: string[], rows: PreviewRow[]) {
  const lines = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => headers.map((h) => escapeCsv(row[h] ?? "")).join(",")),
  ];
  // BOM for Excel compatibility
  const blob = new Blob(["\uFEFF" + lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ReportsView({
  bookings,
  expenses,
  owners,
  assets,
  currencySymbol = "Rs",
}: ReportsViewProps) {
  const [reportType, setReportType] = useState<ReportType>("bookings");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { headers, rows, title } = useMemo(() => {
    switch (reportType) {
      case "bookings": {
        const filtered = bookings.filter((b) => inPeriod(b.checkInDate, from, to));
        return {
          title: "Bookings report",
          headers: [
            "Code",
            "Guest",
            "Platform",
            "Check-in",
            "Check-out",
            "Nights",
            "Net revenue",
            "Status",
          ],
          rows: filtered.map((b) => ({
            Code: b.bookingCode,
            Guest: b.guestName,
            Platform: PLATFORM_LABELS[b.platform] ?? b.platform,
            "Check-in": formatDate(b.checkInDate),
            "Check-out": formatDate(b.checkOutDate),
            Nights: b.nights,
            "Net revenue": Number(b.netRevenue),
            Status: STATUS_LABELS[b.status] ?? b.status,
          })),
        };
      }
      case "expenses": {
        const filtered = expenses.filter((e) => inPeriod(e.date, from, to));
        return {
          title: "Expenses report",
          headers: ["Date", "Category", "Description", "Paid by", "Amount", "Recurring"],
          rows: filtered.map((e) => ({
            Date: formatDate(e.date),
            Category: EXPENSE_LABELS[e.category] ?? e.category,
            Description: e.description,
            "Paid by": e.paidBy ?? "",
            Amount: Number(e.amount),
            Recurring: e.isRecurring ? "Yes" : "No",
          })),
        };
      }
      case "owners": {
        return {
          title: "Owners report",
          headers: ["Name", "Email", "Investment", "Withdrawal", "Profit dist.", "Balance"],
          rows: owners.map((o) => ({
            Name: o.name,
            Email: o.email ?? "",
            Investment: Number(o.investment),
            Withdrawal: Number(o.withdrawal),
            "Profit dist.": Number(o.profitDist),
            Balance: Number(o.balance),
          })),
        };
      }
      case "assets": {
        return {
          title: "Assets report",
          headers: ["Name", "Purchase date", "Cost", "Current value", "Refundable"],
          rows: assets.map((a) => ({
            Name: a.name,
            "Purchase date": a.purchaseDate ? formatDate(a.purchaseDate) : "",
            Cost: Number(a.cost),
            "Current value": Number(a.currentValue),
            Refundable: a.isRefundable ? "Yes" : "No",
          })),
        };
      }
      case "pnl": {
        const bookingRows = bookings.filter((b) => inPeriod(b.checkInDate, from, to));
        const expenseRows = expenses.filter((e) => inPeriod(e.date, from, to));
        const revenue = bookingRows
          .filter((b) => b.status !== "CANCELLED")
          .reduce((s, b) => s + Number(b.netRevenue), 0);
        const expenseTotal = expenseRows.reduce((s, e) => s + Number(e.amount), 0);
        return {
          title: "Profit & loss summary",
          headers: ["Metric", "Amount"],
          rows: [
            { Metric: "Gross booking revenue (net)", Amount: revenue },
            { Metric: "Total expenses", Amount: expenseTotal },
            { Metric: "Net profit / loss", Amount: revenue - expenseTotal },
            { Metric: "Bookings count", Amount: bookingRows.length },
            { Metric: "Expenses count", Amount: expenseRows.length },
          ],
        };
      }
    }
  }, [reportType, bookings, expenses, owners, assets, from, to]);

  function handleCsv() {
    const period =
      from || to
        ? `_${from || "start"}_${to || "end"}`
        : `_${new Date().toISOString().slice(0, 10)}`;
    downloadCsv(`${reportType}_report${period}.csv`, headers, rows);
    toast.success("CSV downloaded");
  }

  function handlePrint() {
    window.print();
  }

  const moneyCols = new Set([
    "Net revenue",
    "Amount",
    "Investment",
    "Withdrawal",
    "Profit dist.",
    "Balance",
    "Cost",
    "Current value",
  ]);

  return (
    <div className="space-y-6">
      <Card className="shadow-sm print:hidden">
        <CardHeader>
          <CardTitle className="text-base">Report options</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="space-y-2 min-w-[180px]">
            <Label>Report type</Label>
            <Select
              value={reportType}
              onValueChange={(v) => setReportType(v as ReportType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bookings">Bookings</SelectItem>
                <SelectItem value="expenses">Expenses</SelectItem>
                <SelectItem value="owners">Owners</SelectItem>
                <SelectItem value="assets">Assets</SelectItem>
                <SelectItem value="pnl">Profit &amp; loss</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="from">From</Label>
            <Input
              id="from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={handleCsv}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button type="button" variant="outline" onClick={handleCsv}>
              <FileSpreadsheet className="h-4 w-4" />
              Excel CSV
            </Button>
            <Button type="button" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              Print / PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <div id="report-print-area" className="space-y-3">
        <div className="hidden print:block">
          <h1 className="text-xl font-semibold">{title}</h1>
          {(from || to) && (
            <p className="text-sm text-muted-foreground">
              Period: {from || "…"} → {to || "…"}
            </p>
          )}
        </div>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between print:py-3">
            <CardTitle className="text-base">{title}</CardTitle>
            <span className="text-xs text-muted-foreground print:hidden">
              {rows.length} row{rows.length === 1 ? "" : "s"}
            </span>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No data for the selected filters.
              </p>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {headers.map((h) => (
                        <TableHead key={h}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(rows as PreviewRow[]).map((row, i) => (
                      <TableRow key={i}>
                        {headers.map((h) => {
                          const val = row[h];
                          const isMoney = moneyCols.has(h) && typeof val === "number";
                          return (
                            <TableCell
                              key={h}
                              className={isMoney ? "tabular-nums font-medium" : undefined}
                            >
                              {isMoney
                                ? formatCurrency(val as number, currencySymbol)
                                : String(val ?? "")}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #report-print-area, #report-print-area * { visibility: visible; }
          #report-print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}
