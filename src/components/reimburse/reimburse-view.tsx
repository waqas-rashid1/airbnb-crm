"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Banknote,
  CircleDollarSign,
  HandCoins,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  createReimbursement,
  deleteReimbursement,
} from "@/actions/reimbursements";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  reimbursementSchema,
  type ReimbursementInput,
} from "@/schemas";
import type { FundSource } from "@/lib/fund-sources";
import {
  EXPENSE_LABELS,
  REIMBURSEMENT_STATUS_LABELS,
  formatCurrency,
  formatDate,
} from "@/lib/calculations";

export type SerializedExpense = {
  id: string;
  date: string;
  category: string;
  description: string;
  paidBy: string | null;
  amount: number;
  isRefundable: boolean;
  reimbursementStatus: string;
  reimbursedAmount: number;
  reimbursements: Array<{
    id: string;
    amount: number;
    date: string;
    paidTo: string;
    paidFrom: string | null;
    notes: string | null;
  }>;
};

type FundSummary = {
  revenue: number;
  operatingExpenses: number;
  refundableHeld: number;
  operatingProfit: number;
  investment: number;
  cashBalance: number;
};

type ReimburseViewProps = {
  expenses: SerializedExpense[];
  currencySymbol?: string;
  fundSources: FundSource[];
  fundSummary: FundSummary;
  propertyLabel?: string;
};

type PersonBreakdown = {
  name: string;
  fronted: number;
  reimbursed: number;
  outstanding: number;
};

function outstandingOf(e: SerializedExpense): number {
  return Math.max(0, e.amount - e.reimbursedAmount);
}

function formatAvailable(
  source: FundSource | undefined,
  currencySymbol: string
): string {
  if (!source) return "";
  if (!Number.isFinite(source.available)) return "Manual / unlimited";
  return `Available: ${formatCurrency(source.available, currencySymbol)}`;
}

export function ReimburseView({
  expenses,
  currencySymbol = "Rs",
  fundSources,
  fundSummary,
  propertyLabel,
}: ReimburseViewProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<SerializedExpense | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [paidFromId, setPaidFromId] = useState<string>("");

  const form = useForm<ReimbursementInput>({
    resolver: zodResolver(reimbursementSchema) as never,
    defaultValues: {
      expenseId: "",
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      paidTo: "",
      paidFrom: "",
      notes: "",
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  const selectedSource = useMemo(
    () => fundSources.find((s) => s.id === paidFromId),
    [fundSources, paidFromId]
  );

  const totals = useMemo(() => {
    let fronted = 0;
    let reimbursed = 0;
    let outstanding = 0;
    let refundableHeld = 0;

    for (const e of expenses) {
      fronted += e.amount;
      reimbursed += e.reimbursedAmount;
      outstanding += outstandingOf(e);
      if (e.isRefundable) {
        refundableHeld += outstandingOf(e);
      }
    }

    return { fronted, reimbursed, outstanding, refundableHeld };
  }, [expenses]);

  const byPerson = useMemo(() => {
    const map = new Map<string, PersonBreakdown>();
    for (const e of expenses) {
      const name = e.paidBy?.trim() || "Unassigned";
      const entry = map.get(name) ?? {
        name,
        fronted: 0,
        reimbursed: 0,
        outstanding: 0,
      };
      entry.fronted += e.amount;
      entry.reimbursed += e.reimbursedAmount;
      entry.outstanding += outstandingOf(e);
      map.set(name, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.outstanding - a.outstanding);
  }, [expenses]);

  const outstandingExpenses = useMemo(
    () =>
      expenses
        .filter((e) => outstandingOf(e) > 0.001)
        .sort((a, b) => outstandingOf(b) - outstandingOf(a)),
    [expenses]
  );

  const history = useMemo(() => {
    const rows: Array<{
      id: string;
      amount: number;
      date: string;
      paidTo: string;
      paidFrom: string | null;
      notes: string | null;
      expenseDescription: string;
      expenseCategory: string;
    }> = [];

    for (const e of expenses) {
      for (const r of e.reimbursements) {
        rows.push({
          ...r,
          expenseDescription: e.description,
          expenseCategory: e.category,
        });
      }
    }

    return rows.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [expenses]);

  function openRecord(expense: SerializedExpense) {
    const outstanding = outstandingOf(expense);
    setSelected(expense);
    setPaidFromId("");
    reset({
      expenseId: expense.id,
      amount: Number(outstanding.toFixed(2)),
      date: new Date().toISOString().slice(0, 10),
      paidTo: expense.paidBy ?? "",
      paidFrom: "",
      notes: "",
    });
    setDialogOpen(true);
  }

  async function onSubmit(data: ReimbursementInput) {
    const result = await createReimbursement(data);
    if (result.success) {
      toast.success("Reimbursement recorded");
      setDialogOpen(false);
      setSelected(null);
      setPaidFromId("");
    } else {
      toast.error(result.error);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const result = await deleteReimbursement(deleteId);
    setDeleting(false);
    if (result.success) {
      toast.success("Reimbursement deleted");
      setDeleteId(null);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-6">
      {propertyLabel ? (
        <p className="text-sm text-muted-foreground">
          Paying from funds for <span className="font-medium text-foreground">{propertyLabel}</span>
        </p>
      ) : null}

      <div className="grid gap-3 rounded-xl border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Revenue
          </div>
          <div className="mt-0.5 text-lg font-semibold tabular-nums">
            {formatCurrency(fundSummary.revenue, currencySymbol)}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Operating profit
          </div>
          <div className="mt-0.5 text-lg font-semibold tabular-nums">
            {formatCurrency(fundSummary.operatingProfit, currencySymbol)}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Investment
          </div>
          <div className="mt-0.5 text-lg font-semibold tabular-nums">
            {formatCurrency(fundSummary.investment, currencySymbol)}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Cash balance
          </div>
          <div className="mt-0.5 text-lg font-semibold tabular-nums">
            {formatCurrency(fundSummary.cashBalance, currencySymbol)}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total fronted"
          value={formatCurrency(totals.fronted, currencySymbol)}
          icon={Banknote}
          subtitle="All reimbursable outlays"
        />
        <MetricCard
          title="Outstanding"
          value={formatCurrency(totals.outstanding, currencySymbol)}
          icon={CircleDollarSign}
          subtitle="Still to be repaid"
        />
        <MetricCard
          title="Reimbursed total"
          value={formatCurrency(totals.reimbursed, currencySymbol)}
          icon={HandCoins}
          subtitle="Already paid back"
        />
        <MetricCard
          title="Refundable held"
          value={formatCurrency(totals.refundableHeld, currencySymbol)}
          icon={Shield}
          subtitle="Deposits & refundable items"
        />
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base">By person</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {byPerson.length === 0 ? (
            <p className="text-sm text-muted-foreground">No expenses yet.</p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Person</TableHead>
                    <TableHead className="text-right">Fronted</TableHead>
                    <TableHead className="text-right">Reimbursed</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byPerson.map((p) => (
                    <TableRow key={p.name}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(p.fronted, currencySymbol)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {formatCurrency(p.reimbursed, currencySymbol)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(p.outstanding, currencySymbol)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Outstanding expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {outstandingExpenses.length === 0 ? (
            <EmptyState
              title="All caught up"
              description="No expenses with an outstanding reimbursement balance."
            />
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Paid by</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Reimbursed</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outstandingExpenses.map((e) => {
                    const outstanding = outstandingOf(e);
                    return (
                      <TableRow key={e.id}>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge variant="secondary">
                              {EXPENSE_LABELS[e.category] ?? e.category}
                            </Badge>
                            {e.isRefundable ? (
                              <Badge variant="outline" className="text-[10px]">
                                Refundable
                              </Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{e.description}</div>
                          <div className="text-xs text-muted-foreground tabular-nums">
                            {formatDate(e.date)}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {e.paidBy || "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(e.amount, currencySymbol)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {formatCurrency(e.reimbursedAmount, currencySymbol)}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatCurrency(outstanding, currencySymbol)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              e.reimbursementStatus === "PARTIAL"
                                ? "outline"
                                : "secondary"
                            }
                            className="text-[10px]"
                          >
                            {REIMBURSEMENT_STATUS_LABELS[e.reimbursementStatus] ??
                              e.reimbursementStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRecord(e)}
                          >
                            Record reimbursement
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Reimbursement history</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No reimbursements recorded yet.
            </p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Expense</TableHead>
                    <TableHead>Paid to</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {formatDate(r.date)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{r.expenseDescription}</div>
                        <div className="text-xs text-muted-foreground">
                          {EXPENSE_LABELS[r.expenseCategory] ?? r.expenseCategory}
                          {r.notes ? ` · ${r.notes}` : ""}
                        </div>
                      </TableCell>
                      <TableCell>{r.paidTo}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.paidFrom || "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(r.amount, currencySymbol)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(r.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setSelected(null);
            setPaidFromId("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record reimbursement</DialogTitle>
            <DialogDescription>
              {selected
                ? `Repay ${selected.paidBy || "the payer"} for “${selected.description}”.`
                : "Log a repayment against an expense."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...register("expenseId")} />
            <input type="hidden" {...register("paidFrom")} />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min={0.01}
                  {...register("amount")}
                />
                {errors.amount && (
                  <p className="text-xs text-destructive">{errors.amount.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" {...register("date")} />
                {errors.date && (
                  <p className="text-xs text-destructive">{errors.date.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paidTo">Paid to</Label>
              <Input id="paidTo" {...register("paidTo")} />
              {errors.paidTo && (
                <p className="text-xs text-destructive">{errors.paidTo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Paid from</Label>
              <Select
                value={paidFromId || undefined}
                onValueChange={(id) => {
                  setPaidFromId(id);
                  const source = fundSources.find((s) => s.id === id);
                  setValue("paidFrom", source?.label ?? id, {
                    shouldValidate: true,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select fund source" />
                </SelectTrigger>
                <SelectContent>
                  {fundSources.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedSource ? (
                <p className="text-xs text-muted-foreground">
                  {formatAvailable(selectedSource, currencySymbol)}
                  {selectedSource.description
                    ? ` · ${selectedSource.description}`
                    : ""}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" rows={2} {...register("notes")} />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : "Save reimbursement"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete reimbursement?"
        description="This will remove the reimbursement and recalculate the expense balance."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
