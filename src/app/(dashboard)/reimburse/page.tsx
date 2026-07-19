import { prisma } from "@/lib/db";
import {
  getSelectedProperty,
  propertyLabel,
} from "@/lib/property-context";
import {
  getFundSources,
  getPropertyFundSummary,
} from "@/lib/fund-sources";
import { toNumber } from "@/lib/calculations";
import { ReimburseView } from "@/components/reimburse/reimburse-view";
import { PageHeader } from "@/components/shared/page-header";

export default async function ReimbursePage() {
  const property = await getSelectedProperty();
  if (!property) {
    return <p className="text-muted-foreground">No property configured.</p>;
  }

  const [expenses, settings, fundSources, fundSummary] = await Promise.all([
    prisma.expense.findMany({
      where: { propertyId: property.id },
      include: {
        reimbursements: {
          orderBy: { date: "desc" },
        },
      },
      orderBy: { date: "desc" },
    }),
    prisma.settings.findFirst(),
    getFundSources(property.id),
    getPropertyFundSummary(property.id),
  ]);

  const serialized = expenses.map((e) => ({
    id: e.id,
    date: e.date.toISOString(),
    category: e.category,
    description: e.description,
    paidBy: e.paidBy,
    amount: toNumber(e.amount),
    isRefundable: e.isRefundable,
    reimbursementStatus: e.reimbursementStatus,
    reimbursedAmount: toNumber(e.reimbursedAmount),
    reimbursements: e.reimbursements.map((r) => ({
      id: r.id,
      amount: toNumber(r.amount),
      date: r.date.toISOString(),
      paidTo: r.paidTo,
      paidFrom: r.paidFrom,
      notes: r.notes,
    })),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reimburse"
        description={`${propertyLabel(property)} · Track money fronted and record repayments`}
      />
      <ReimburseView
        expenses={serialized}
        currencySymbol={settings?.currencySymbol || "Rs"}
        fundSources={fundSources}
        fundSummary={fundSummary}
        propertyLabel={propertyLabel(property)}
      />
    </div>
  );
}
