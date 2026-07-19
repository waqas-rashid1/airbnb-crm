import { prisma } from "@/lib/db";
import {
  getSelectedProperty,
  propertyLabel,
} from "@/lib/property-context";
import { toNumber } from "@/lib/calculations";
import { ReportsView } from "@/components/reports/reports-view";
import { PageHeader } from "@/components/shared/page-header";

export default async function ReportsPage() {
  const property = await getSelectedProperty();
  if (!property) {
    return <p className="text-muted-foreground">No property configured.</p>;
  }

  const [bookings, expenses, owners, assets, settings] = await Promise.all([
    prisma.booking.findMany({
      where: { propertyId: property.id },
      orderBy: { checkInDate: "desc" },
    }),
    prisma.expense.findMany({
      where: { propertyId: property.id },
      orderBy: { date: "desc" },
    }),
    prisma.owner.findMany({
      where: { propertyId: property.id },
      include: { transactions: true },
    }),
    prisma.asset.findMany({ where: { propertyId: property.id } }),
    prisma.settings.findFirst(),
  ]);

  const symbol = settings?.currencySymbol || "Rs";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description={`${propertyLabel(property)} · Profit & loss, cash flow, occupancy, and exports`}
      />
      <ReportsView
        bookings={bookings.map((b) => ({
          id: b.id,
          propertyId: b.propertyId,
          bookingCode: b.bookingCode,
          guestName: b.guestName,
          phone: b.phone,
          platform: b.platform,
          checkInDate: b.checkInDate.toISOString(),
          checkInTime: b.checkInTime,
          checkOutDate: b.checkOutDate.toISOString(),
          checkOutTime: b.checkOutTime,
          nights: b.nights,
          guestsCount: b.guestsCount,
          revenue: toNumber(b.revenue),
          cleaningFee: toNumber(b.cleaningFee),
          platformFee: toNumber(b.platformFee),
          discount: toNumber(b.discount),
          extraCharges: toNumber(b.extraCharges),
          netRevenue: toNumber(b.netRevenue),
          status: b.status,
          notes: b.notes,
        }))}
        expenses={expenses.map((e) => ({
          id: e.id,
          propertyId: e.propertyId,
          date: e.date.toISOString(),
          category: e.category,
          description: e.description,
          paidBy: e.paidBy,
          amount: toNumber(e.amount),
          receiptUrl: e.receiptUrl,
          isRecurring: e.isRecurring,
          monthlyNote: e.monthlyNote,
        }))}
        owners={owners.map((o) => ({
          id: o.id,
          name: o.name,
          email: o.email,
          phone: o.phone,
          investment: toNumber(o.investment),
          withdrawal: toNumber(o.withdrawal),
          profitDist: toNumber(o.profitDist),
          balance: toNumber(o.balance),
          notes: o.notes,
          transactions: o.transactions.map((t) => ({
            id: t.id,
            type: t.type,
            amount: toNumber(t.amount),
            date: t.date.toISOString(),
            description: t.description,
            balanceAfter: toNumber(t.balanceAfter),
          })),
        }))}
        assets={assets.map((a) => ({
          id: a.id,
          propertyId: a.propertyId,
          name: a.name,
          purchaseDate: a.purchaseDate?.toISOString() ?? null,
          cost: toNumber(a.cost),
          currentValue: toNumber(a.currentValue),
          isRefundable: a.isRefundable,
          notes: a.notes,
        }))}
        currencySymbol={symbol}
      />
    </div>
  );
}
