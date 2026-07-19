import { prisma } from "@/lib/db";
import { getPrimaryProperty } from "@/lib/safe-action";
import { toNumber } from "@/lib/calculations";
import { ReimburseView } from "@/components/reimburse/reimburse-view";
import { PageHeader } from "@/components/shared/page-header";

export default async function ReimbursePage() {
  const property = await getPrimaryProperty();
  if (!property) {
    return <p className="text-muted-foreground">No property configured.</p>;
  }

  const [expenses, settings] = await Promise.all([
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
        description="Track money fronted for the property and record repayments"
      />
      <ReimburseView
        expenses={serialized}
        currencySymbol={settings?.currencySymbol || "Rs"}
      />
    </div>
  );
}
