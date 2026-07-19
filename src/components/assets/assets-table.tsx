"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Package, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createAsset, updateAsset, deleteAsset } from "@/actions/assets";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { assetSchema, type AssetInput } from "@/schemas";
import { formatCurrency, formatDate } from "@/lib/calculations";
import type { FormPropertyOption } from "@/components/bookings/booking-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SerializedAsset = {
  id: string;
  propertyId: string;
  name: string;
  purchaseDate?: string | Date | null;
  cost: number | string;
  currentValue: number | string;
  isRefundable: boolean;
  notes?: string | null;
};

type AssetsTableProps = {
  assets: SerializedAsset[];
  currencySymbol?: string;
  properties: FormPropertyOption[];
  selectedPropertyId?: string | null;
};

function optionLabel(p: FormPropertyOption): string {
  const parts = [
    p.roomNumber ? `Apt. ${p.roomNumber}` : null,
    p.buildingName,
  ].filter(Boolean);
  if (parts.length) return parts.join(" · ");
  return p.name;
}

const formDefaults: AssetInput = {
  propertyId: "",
  name: "",
  purchaseDate: "",
  cost: 0,
  currentValue: 0,
  isRefundable: false,
  notes: "",
};

function toDateInput(value?: string | Date | null): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toISOString().slice(0, 10);
}

export function AssetsTable({
  assets,
  currencySymbol = "Rs",
  properties,
  selectedPropertyId,
}: AssetsTableProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SerializedAsset | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<AssetInput>({
    resolver: zodResolver(assetSchema) as never,
    defaultValues: {
      ...formDefaults,
      propertyId: selectedPropertyId ?? "",
    },
  });

  useEffect(() => {
    if (!formOpen) return;
    if (editing) {
      form.reset({
        propertyId: editing.propertyId,
        name: editing.name,
        purchaseDate: toDateInput(editing.purchaseDate),
        cost: Number(editing.cost),
        currentValue: Number(editing.currentValue),
        isRefundable: editing.isRefundable,
        notes: editing.notes ?? "",
      });
    } else {
      form.reset({
        ...formDefaults,
        propertyId: selectedPropertyId ?? "",
      });
    }
  }, [formOpen, editing, form, selectedPropertyId]);

  const columns = useMemo<ColumnDef<SerializedAsset>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Asset",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.name}</div>
            {row.original.notes ? (
              <div className="text-xs text-muted-foreground line-clamp-1">
                {row.original.notes}
              </div>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "purchaseDate",
        header: "Purchased",
        cell: ({ row }) =>
          row.original.purchaseDate ? (
            <span className="text-muted-foreground">
              {formatDate(row.original.purchaseDate)}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "cost",
        header: "Cost",
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatCurrency(Number(row.original.cost), currencySymbol)}
          </span>
        ),
      },
      {
        accessorKey: "currentValue",
        header: "Current value",
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">
            {formatCurrency(Number(row.original.currentValue), currencySymbol)}
          </span>
        ),
      },
      {
        accessorKey: "isRefundable",
        header: "Type",
        cell: ({ row }) =>
          row.original.isRefundable ? (
            <Badge variant="success">Refundable</Badge>
          ) : (
            <Badge variant="secondary">Non-refundable</Badge>
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
              className="h-8 w-8 text-destructive"
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
    data: assets,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  async function onSubmit(data: AssetInput) {
    const result = editing
      ? await updateAsset(editing.id, data)
      : await createAsset(data);

    if (result.success) {
      toast.success(editing ? "Asset updated" : "Asset created");
      setFormOpen(false);
      setEditing(null);
    } else {
      toast.error(result.error);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const result = await deleteAsset(deleteId);
    setDeleting(false);
    if (result.success) {
      toast.success("Asset deleted");
      setDeleteId(null);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add asset
        </Button>
      </div>

      {assets.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No assets yet"
          description="Track furniture, deposits, and other property assets."
          action={
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add asset
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
              {assets.length} asset{assets.length === 1 ? "" : "s"}
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

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit asset" : "New asset"}</DialogTitle>
            <DialogDescription>Track purchase cost and current value.</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Property</Label>
              <Select
                value={form.watch("propertyId") || undefined}
                onValueChange={(v) =>
                  form.setValue("propertyId", v, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {optionLabel(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.propertyId && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.propertyId.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-name">Name</Label>
              <Input id="asset-name" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase date</Label>
              <Input id="purchaseDate" type="date" {...form.register("purchaseDate")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cost">Cost</Label>
                <Input id="cost" type="number" step="0.01" min={0} {...form.register("cost")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentValue">Current value</Label>
                <Input
                  id="currentValue"
                  type="number"
                  step="0.01"
                  min={0}
                  {...form.register("currentValue")}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isRefundable"
                checked={form.watch("isRefundable")}
                onCheckedChange={(checked) =>
                  form.setValue("isRefundable", checked === true, { shouldValidate: true })
                }
              />
              <Label htmlFor="isRefundable" className="font-normal">
                Refundable (e.g. security deposit)
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-notes">Notes</Label>
              <Textarea id="asset-notes" rows={2} {...form.register("notes")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving…" : "Save asset"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete asset?"
        description="This will permanently remove the asset from your inventory."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
