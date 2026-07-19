"use client";

import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Pencil, Plus, Search, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { createExpense, updateExpense, deleteExpense } from "@/actions/expenses";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { ExpenseInput } from "@/schemas";
import {
  EXPENSE_LABELS,
  REIMBURSEMENT_STATUS_LABELS,
  formatCurrency,
  formatDate,
} from "@/lib/calculations";
import type { FormPropertyOption } from "@/components/bookings/booking-form";

export type SerializedExpense = {
  id: string;
  propertyId: string;
  date: string | Date;
  category: string;
  description: string;
  paidBy?: string | null;
  amount: number | string;
  receiptUrl?: string | null;
  isRecurring: boolean;
  isRefundable?: boolean;
  reimbursementStatus?: string;
  reimbursedAmount?: number | string;
  monthlyNote?: string | null;
};

type ExpensesTableProps = {
  expenses: SerializedExpense[];
  currencySymbol?: string;
  properties: FormPropertyOption[];
  selectedPropertyId?: string | null;
};

function toDateInput(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toISOString().slice(0, 10);
}

export function ExpensesTable({
  expenses,
  currencySymbol = "Rs",
  properties,
  selectedPropertyId,
}: ExpensesTableProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SerializedExpense | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return expenses.filter((e) => {
      if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        e.description.toLowerCase().includes(q) ||
        (e.paidBy ?? "").toLowerCase().includes(q) ||
        (EXPENSE_LABELS[e.category] ?? e.category).toLowerCase().includes(q)
      );
    });
  }, [expenses, search, categoryFilter]);

  const columns = useMemo<ColumnDef<SerializedExpense>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {formatDate(row.original.date)}
          </span>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <Badge variant="secondary">
            {EXPENSE_LABELS[row.original.category] ?? row.original.category}
          </Badge>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.description}</div>
            {row.original.paidBy ? (
              <div className="text-xs text-muted-foreground">Paid by {row.original.paidBy}</div>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">
            {formatCurrency(Number(row.original.amount), currencySymbol)}
          </span>
        ),
      },
      {
        id: "reimbursement",
        header: "Reimburse",
        cell: ({ row }) => {
          const status = row.original.reimbursementStatus ?? "NOT_NEEDED";
          if (status === "NOT_NEEDED") {
            return <span className="text-xs text-muted-foreground">—</span>;
          }
          return (
            <Badge
              variant={status === "REIMBURSED" ? "secondary" : "outline"}
              className="text-[10px]"
            >
              {REIMBURSEMENT_STATUS_LABELS[status] ?? status}
            </Badge>
          );
        },
      },
      {
        id: "meta",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.isRefundable ? (
              <Badge variant="outline" className="text-[10px]">
                Refundable
              </Badge>
            ) : null}
            {row.original.isRecurring ? (
              <Badge variant="outline" className="text-[10px]">
                Recurring
              </Badge>
            ) : null}
            {row.original.receiptUrl ? (
              <a
                href={row.original.receiptUrl}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setEditing(row.original);
                setFormOpen(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => setDeleteId(row.original.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [currencySymbol]
  );

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const formDefaults: Partial<ExpenseInput> | undefined = editing
    ? {
        propertyId: editing.propertyId,
        date: toDateInput(editing.date),
        category: editing.category as ExpenseInput["category"],
        description: editing.description,
        paidBy: editing.paidBy ?? "",
        amount: Number(editing.amount),
        receiptUrl: editing.receiptUrl ?? "",
        isRecurring: editing.isRecurring,
        isRefundable: editing.isRefundable ?? false,
        monthlyNote: editing.monthlyNote ?? "",
      }
    : {
        propertyId: selectedPropertyId ?? "",
        isRefundable: false,
      };

  async function handleSubmit(data: ExpenseInput) {
    const result = editing
      ? await updateExpense(editing.id, data)
      : await createExpense(data);

    if (result.success) {
      toast.success(editing ? "Expense updated" : "Expense created");
      setFormOpen(false);
      setEditing(null);
    } else {
      toast.error(result.error);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const result = await deleteExpense(deleteId);
    setDeleting(false);
    if (result.success) {
      toast.success("Expense deleted");
      setDeleteId(null);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search expenses…"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {Object.entries(EXPENSE_LABELS).map(([k, label]) => (
                <SelectItem key={k} value={k}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add expense
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No expenses found"
          description="Add your first expense to start tracking costs."
          action={
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add expense
            </Button>
          }
        />
      ) : (
        <>
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {filtered.length} expense{filtered.length === 1 ? "" : "s"}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
              >
                Previous
              </Button>
              <span>
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      <ExpenseForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        title={editing ? "Edit expense" : "New expense"}
        defaultValues={formDefaults}
        onSubmit={handleSubmit}
        properties={properties}
        defaultPropertyId={selectedPropertyId}
      />

      <ConfirmDelete
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete expense?"
        description="This will permanently remove the expense from your records."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
