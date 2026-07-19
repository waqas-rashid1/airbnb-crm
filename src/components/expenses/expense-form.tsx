"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { expenseSchema, type ExpenseInput } from "@/schemas";
import { EXPENSE_LABELS } from "@/lib/calculations";

type ExpenseFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  defaultValues?: Partial<ExpenseInput>;
  onSubmit: (data: ExpenseInput) => Promise<void> | void;
};

const defaults: ExpenseInput = {
  date: new Date().toISOString().slice(0, 10),
  category: "MISCELLANEOUS",
  description: "",
  paidBy: "",
  amount: 0,
  receiptUrl: "",
  isRecurring: false,
  isRefundable: false,
  monthlyNote: "",
};

export function ExpenseForm({
  open,
  onOpenChange,
  title = "Expense",
  defaultValues,
  onSubmit,
}: ExpenseFormProps) {
  const form = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema) as never,
    defaultValues: { ...defaults, ...defaultValues },
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    if (open) {
      reset({ ...defaults, ...defaultValues });
    }
  }, [open, defaultValues, reset]);

  const isRecurring = watch("isRecurring");
  const isRefundable = watch("isRefundable");
  const category = watch("category");

  const submit = handleSubmit(async (data) => {
    await onSubmit(data);
  });

  const categories = useMemo(() => Object.entries(EXPENSE_LABELS), []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Record a property expense.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" {...register("date")} />
              {errors.date && (
                <p className="text-xs text-destructive">{errors.date.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={(v) =>
                  setValue("category", v as ExpenseInput["category"], { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(([k, label]) => (
                    <SelectItem key={k} value={k}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-xs text-destructive">{errors.category.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" {...register("description")} />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" step="0.01" min={0} {...register("amount")} />
              {errors.amount && (
                <p className="text-xs text-destructive">{errors.amount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="paidBy">Paid by</Label>
              <Input id="paidBy" {...register("paidBy")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="receiptUrl">Receipt URL</Label>
            <Input
              id="receiptUrl"
              type="url"
              placeholder="https://…"
              {...register("receiptUrl")}
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="isRecurring"
                checked={isRecurring}
                onCheckedChange={(checked) =>
                  setValue("isRecurring", checked === true, { shouldValidate: true })
                }
              />
              <Label htmlFor="isRecurring" className="font-normal">
                Recurring monthly expense
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isRefundable"
                checked={isRefundable}
                onCheckedChange={(checked) =>
                  setValue("isRefundable", checked === true, { shouldValidate: true })
                }
              />
              <Label htmlFor="isRefundable" className="font-normal">
                Refundable (security deposit, contract, etc.)
              </Label>
            </div>
          </div>

          {isRecurring ? (
            <div className="space-y-2">
              <Label htmlFor="monthlyNote">Monthly note</Label>
              <Textarea id="monthlyNote" rows={2} {...register("monthlyNote")} />
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
