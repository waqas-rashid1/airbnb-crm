"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import {
  createOwner,
  createOwnerTransaction,
  deleteOwner,
} from "@/actions/owners";
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
  ownerSchema,
  ownerTransactionSchema,
  type OwnerInput,
  type OwnerTransactionInput,
} from "@/schemas";
import {
  formatCurrency,
  formatDate,
  OWNER_TX_LABELS,
} from "@/lib/calculations";
import type { FormPropertyOption } from "@/components/bookings/booking-form";

export type SerializedOwnerTransaction = {
  id: string;
  type: string;
  amount: number | string;
  date: string | Date;
  description?: string | null;
  balanceAfter: number | string;
};

export type SerializedOwner = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  investment: number | string;
  withdrawal: number | string;
  profitDist: number | string;
  balance: number | string;
  notes?: string | null;
  transactions: SerializedOwnerTransaction[];
};

type OwnersViewProps = {
  owners: SerializedOwner[];
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

export function OwnersView({
  owners,
  currencySymbol = "Rs",
  properties,
  selectedPropertyId,
}: OwnersViewProps) {
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [txOpen, setTxOpen] = useState(false);
  const [txOwnerId, setTxOwnerId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const ownerForm = useForm<OwnerInput>({
    resolver: zodResolver(ownerSchema),
    defaultValues: {
      propertyId: selectedPropertyId ?? "",
      name: "",
      email: "",
      phone: "",
      notes: "",
    },
  });

  const txForm = useForm<OwnerTransactionInput>({
    resolver: zodResolver(ownerTransactionSchema),
    defaultValues: {
      ownerId: "",
      type: "INVESTMENT",
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      description: "",
    },
  });

  useEffect(() => {
    if (ownerOpen) {
      ownerForm.reset({
        propertyId: selectedPropertyId ?? "",
        name: "",
        email: "",
        phone: "",
        notes: "",
      });
    }
  }, [ownerOpen, selectedPropertyId, ownerForm]);

  useEffect(() => {
    if (txOpen && txOwnerId) {
      txForm.reset({
        ownerId: txOwnerId,
        type: "INVESTMENT",
        amount: 0,
        date: new Date().toISOString().slice(0, 10),
        description: "",
      });
    }
  }, [txOpen, txOwnerId, txForm]);

  async function onCreateOwner(data: OwnerInput) {
    const result = await createOwner(data);
    if (result.success) {
      toast.success("Owner added");
      setOwnerOpen(false);
      ownerForm.reset({
        propertyId: selectedPropertyId ?? "",
        name: "",
        email: "",
        phone: "",
        notes: "",
      });
    } else {
      toast.error(result.error);
    }
  }

  async function onCreateTx(data: OwnerTransactionInput) {
    const result = await createOwnerTransaction(data);
    if (result.success) {
      toast.success("Transaction recorded");
      setTxOpen(false);
      setTxOwnerId(null);
    } else {
      toast.error(result.error);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const result = await deleteOwner(deleteId);
    setDeleting(false);
    if (result.success) {
      toast.success("Owner deleted");
      setDeleteId(null);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setOwnerOpen(true)}>
          <Plus className="h-4 w-4" />
          Add owner
        </Button>
      </div>

      {owners.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No owners yet"
          description="Add owners to track investments, withdrawals, and profit distributions."
          action={
            <Button size="sm" onClick={() => setOwnerOpen(true)}>
              <Plus className="h-4 w-4" />
              Add owner
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {owners.map((owner) => (
            <Card key={owner.id} className="shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-base">{owner.name}</CardTitle>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {[owner.email, owner.phone].filter(Boolean).join(" · ") || "No contact"}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setTxOwnerId(owner.id);
                      setTxOpen(true);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Transaction
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    onClick={() => setDeleteId(owner.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Metric
                    label="Investment"
                    value={formatCurrency(Number(owner.investment), currencySymbol)}
                  />
                  <Metric
                    label="Withdrawal"
                    value={formatCurrency(Number(owner.withdrawal), currencySymbol)}
                  />
                  <Metric
                    label="Profit dist."
                    value={formatCurrency(Number(owner.profitDist), currencySymbol)}
                  />
                  <Metric
                    label="Balance"
                    value={formatCurrency(Number(owner.balance), currencySymbol)}
                    highlight
                  />
                </div>

                <div>
                  <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Transaction history
                  </h4>
                  {owner.transactions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No transactions yet.</p>
                  ) : (
                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {owner.transactions.map((tx) => (
                            <TableRow key={tx.id}>
                              <TableCell className="text-xs text-muted-foreground">
                                {formatDate(tx.date)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-[10px]">
                                  {OWNER_TX_LABELS[tx.type] ?? tx.type}
                                </Badge>
                                {tx.description ? (
                                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                                    {tx.description}
                                  </div>
                                ) : null}
                              </TableCell>
                              <TableCell className="text-right text-sm font-medium tabular-nums">
                                {formatCurrency(Number(tx.amount), currencySymbol)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={ownerOpen} onOpenChange={setOwnerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add owner</DialogTitle>
            <DialogDescription>Create a new property owner profile.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={ownerForm.handleSubmit(onCreateOwner)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Property</Label>
              <Select
                value={ownerForm.watch("propertyId") || undefined}
                onValueChange={(v) =>
                  ownerForm.setValue("propertyId", v, { shouldValidate: true })
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
              {ownerForm.formState.errors.propertyId && (
                <p className="text-xs text-destructive">
                  {ownerForm.formState.errors.propertyId.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner-name">Name</Label>
              <Input id="owner-name" {...ownerForm.register("name")} />
              {ownerForm.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {ownerForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="owner-email">Email</Label>
                <Input id="owner-email" type="email" {...ownerForm.register("email")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner-phone">Phone</Label>
                <Input id="owner-phone" {...ownerForm.register("phone")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner-notes">Notes</Label>
              <Textarea id="owner-notes" rows={2} {...ownerForm.register("notes")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOwnerOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={ownerForm.formState.isSubmitting}>
                {ownerForm.formState.isSubmitting ? "Saving…" : "Add owner"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={txOpen} onOpenChange={setTxOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add transaction</DialogTitle>
            <DialogDescription>
              Record an investment, withdrawal, or profit distribution.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={txForm.handleSubmit(onCreateTx)} className="space-y-4">
            <input type="hidden" {...txForm.register("ownerId")} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={txForm.watch("type")}
                  onValueChange={(v) =>
                    txForm.setValue("type", v as OwnerTransactionInput["type"], {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(OWNER_TX_LABELS).map(([k, label]) => (
                      <SelectItem key={k} value={k}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tx-date">Date</Label>
                <Input id="tx-date" type="date" {...txForm.register("date")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-amount">Amount</Label>
              <Input
                id="tx-amount"
                type="number"
                step="0.01"
                min={0}
                {...txForm.register("amount")}
              />
              {txForm.formState.errors.amount && (
                <p className="text-xs text-destructive">
                  {txForm.formState.errors.amount.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-desc">Description</Label>
              <Input id="tx-desc" {...txForm.register("description")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTxOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={txForm.formState.isSubmitting}>
                {txForm.formState.isSubmitting ? "Saving…" : "Save transaction"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete owner?"
        description="This will remove the owner and all associated transactions."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}

function Metric({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2">
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className={`mt-0.5 text-sm font-semibold tabular-nums ${highlight ? "text-foreground" : ""}`}>
        {value}
      </div>
    </div>
  );
}
