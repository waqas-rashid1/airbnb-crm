import { prisma } from "@/lib/db";
import { toNumber, formatCurrency } from "@/lib/calculations";

export type FundSource = {
  id: string;
  label: string;
  available: number;
  description: string;
};

/**
 * Bootstrap funding sources available for reimbursements on a property.
 * Shows booking revenue, operating profit, and owner investment pools.
 */
export async function getFundSources(propertyId: string): Promise<FundSource[]> {
  const [bookings, expenses, owners, reimbursements] = await Promise.all([
    prisma.booking.findMany({
      where: { propertyId, status: { not: "CANCELLED" } },
    }),
    prisma.expense.findMany({ where: { propertyId } }),
    prisma.owner.findMany({ where: { propertyId } }),
    prisma.reimbursement.findMany({
      where: { expense: { propertyId } },
    }),
  ]);

  const bookingRevenue = bookings.reduce((s, b) => s + toNumber(b.netRevenue), 0);
  const operatingExpenses = expenses
    .filter((e) => !e.isRefundable)
    .reduce((s, e) => s + toNumber(e.amount), 0);
  const refundableHeld = expenses
    .filter((e) => e.isRefundable)
    .reduce((s, e) => s + toNumber(e.amount), 0);
  const alreadyReimbursed = reimbursements.reduce((s, r) => s + toNumber(r.amount), 0);
  const ownerInvestment = owners.reduce((s, o) => s + toNumber(o.investment), 0);
  const operatingProfit = bookingRevenue - operatingExpenses;

  // Cash pool roughly: investments + revenue - all cash out - already paid reimbursements tracked separately
  // Available booking revenue for reimbursement = revenue not yet used for reimbursements (simplified)
  const availableFromRevenue = Math.max(0, bookingRevenue - alreadyReimbursed);
  const availableProfit = Math.max(0, operatingProfit);
  const availableInvestment = Math.max(0, ownerInvestment - operatingExpenses - refundableHeld);

  const sources: FundSource[] = [
    {
      id: "booking_revenue",
      label: `Booking revenue (${formatCurrency(bookingRevenue)})`,
      available: availableFromRevenue,
      description: `Net booking revenue Rs ${bookingRevenue.toLocaleString()}; available after prior reimbursements`,
    },
    {
      id: "operating_profit",
      label: `Operating profit (${formatCurrency(operatingProfit)})`,
      available: availableProfit,
      description: "Revenue minus operating expenses (excludes refundable deposits)",
    },
    {
      id: "owner_investment",
      label: `Owner investment pool (${formatCurrency(ownerInvestment)})`,
      available: Math.max(0, availableInvestment),
      description: "Capital injected by owners for bootstrap",
    },
    {
      id: "bootstrap_cash",
      label: "Bootstrap cash (manual)",
      available: Number.POSITIVE_INFINITY,
      description: "Pay from general bootstrap / external cash",
    },
  ];

  for (const o of owners) {
    sources.push({
      id: `owner:${o.name}`,
      label: `Owner: ${o.name} (inv. ${formatCurrency(toNumber(o.investment))})`,
      available: toNumber(o.balance),
      description: `Running owner balance Rs ${toNumber(o.balance).toLocaleString()}`,
    });
  }

  return sources;
}

export async function getPropertyFundSummary(propertyId: string) {
  const [bookings, expenses, owners] = await Promise.all([
    prisma.booking.findMany({
      where: { propertyId, status: { not: "CANCELLED" } },
    }),
    prisma.expense.findMany({ where: { propertyId } }),
    prisma.owner.findMany({ where: { propertyId } }),
  ]);

  const revenue = bookings.reduce((s, b) => s + toNumber(b.netRevenue), 0);
  const operating = expenses
    .filter((e) => !e.isRefundable)
    .reduce((s, e) => s + toNumber(e.amount), 0);
  const refundable = expenses
    .filter((e) => e.isRefundable)
    .reduce((s, e) => s + toNumber(e.amount), 0);
  const investment = owners.reduce((s, o) => s + toNumber(o.investment), 0);

  return {
    revenue,
    operatingExpenses: operating,
    refundableHeld: refundable,
    operatingProfit: revenue - operating,
    investment,
    cashBalance: investment + revenue - operating - refundable,
  };
}
