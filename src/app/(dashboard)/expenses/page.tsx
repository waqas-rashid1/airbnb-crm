import { prisma } from "@/lib/db";
import { getPrimaryProperty } from "@/lib/safe-action";
import { toNumber } from "@/lib/calculations";
import { ExpensesTable } from "@/components/expenses/expenses-table";
import { PageHeader } from "@/components/shared/page-header";

export default async function ExpensesPage() {
  const property = await getPrimaryProperty();
  if (!property) {
    return <p className="text-muted-foreground">No property configured.</p>;
  }

  const [expenses, settings] = await Promise.all([
    prisma.expense.findMany({
      where: { propertyId: property.id },
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
    receiptUrl: e.receiptUrl,
    isRecurring: e.isRecurring,
    monthlyNote: e.monthlyNote,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Track operating costs, rent, and utilities"
      />
      <ExpensesTable
        expenses={serialized}
        currencySymbol={settings?.currencySymbol || "Rs"}
      />
    </div>
  );
}
