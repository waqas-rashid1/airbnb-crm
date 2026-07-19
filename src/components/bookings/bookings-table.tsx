"use client";

import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createBooking, updateBooking, deleteBooking } from "@/actions/bookings";
import { BookingForm } from "@/components/bookings/booking-form";
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
import type { BookingInput } from "@/schemas";
import {
  formatCurrency,
  formatDate,
  PLATFORM_LABELS,
  STATUS_LABELS,
} from "@/lib/calculations";
import type { FormPropertyOption } from "@/components/bookings/booking-form";

export type SerializedBooking = {
  id: string;
  propertyId: string;
  bookingCode: string;
  guestName: string;
  phone?: string | null;
  platform: string;
  checkInDate: string | Date;
  checkInTime: string;
  checkOutDate: string | Date;
  checkOutTime: string;
  nights: number;
  guestsCount: number;
  revenue: number | string;
  cleaningFee: number | string;
  platformFee: number | string;
  discount: number | string;
  extraCharges: number | string;
  netRevenue: number | string;
  status: string;
  notes?: string | null;
};

type BookingsTableProps = {
  bookings: SerializedBooking[];
  currencySymbol?: string;
  properties: FormPropertyOption[];
  selectedPropertyId?: string | null;
};

function toDateInput(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toISOString().slice(0, 10);
}

function statusVariant(
  status: string
): "default" | "secondary" | "success" | "warning" | "destructive" | "outline" {
  switch (status) {
    case "CHECKED_IN":
      return "success";
    case "UPCOMING":
      return "warning";
    case "COMPLETED":
      return "secondary";
    case "CANCELLED":
      return "destructive";
    default:
      return "outline";
  }
}

export function BookingsTable({
  bookings,
  currencySymbol = "Rs",
  properties,
  selectedPropertyId,
}: BookingsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SerializedBooking | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (platformFilter !== "all" && b.platform !== platformFilter) return false;
      if (!q) return true;
      return (
        b.guestName.toLowerCase().includes(q) ||
        b.bookingCode.toLowerCase().includes(q) ||
        (b.phone ?? "").toLowerCase().includes(q)
      );
    });
  }, [bookings, search, statusFilter, platformFilter]);

  const columns = useMemo<ColumnDef<SerializedBooking>[]>(
    () => [
      {
        accessorKey: "bookingCode",
        header: "Code",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.bookingCode}
          </span>
        ),
      },
      {
        accessorKey: "guestName",
        header: "Guest",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.guestName}</div>
            {row.original.phone ? (
              <div className="text-xs text-muted-foreground">{row.original.phone}</div>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "platform",
        header: "Platform",
        cell: ({ row }) => PLATFORM_LABELS[row.original.platform] ?? row.original.platform,
      },
      {
        id: "dates",
        header: "Stay",
        cell: ({ row }) => (
          <div className="text-xs">
            <div>
              {formatDate(row.original.checkInDate)} → {formatDate(row.original.checkOutDate)}
            </div>
            <div className="text-muted-foreground">
              {row.original.nights}n · {row.original.guestsCount} guests
            </div>
          </div>
        ),
      },
      {
        accessorKey: "netRevenue",
        header: "Net",
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">
            {formatCurrency(Number(row.original.netRevenue), currencySymbol)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={statusVariant(row.original.status)}>
            {STATUS_LABELS[row.original.status] ?? row.original.status}
          </Badge>
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
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const formDefaults: Partial<BookingInput> | undefined = editing
    ? {
        propertyId: editing.propertyId,
        guestName: editing.guestName,
        phone: editing.phone ?? "",
        platform: editing.platform as BookingInput["platform"],
        checkInDate: toDateInput(editing.checkInDate),
        checkInTime: editing.checkInTime,
        checkOutDate: toDateInput(editing.checkOutDate),
        checkOutTime: editing.checkOutTime,
        guestsCount: editing.guestsCount,
        revenue: Number(editing.revenue),
        cleaningFee: Number(editing.cleaningFee),
        platformFee: Number(editing.platformFee),
        discount: Number(editing.discount),
        extraCharges: Number(editing.extraCharges),
        status: editing.status as BookingInput["status"],
        notes: editing.notes ?? "",
      }
    : { propertyId: selectedPropertyId ?? "" };

  async function handleSubmit(data: BookingInput) {
    const result = editing
      ? await updateBooking(editing.id, data)
      : await createBooking(data);

    if (result.success) {
      toast.success(editing ? "Booking updated" : "Booking created");
      setFormOpen(false);
      setEditing(null);
    } else {
      toast.error(result.error);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const result = await deleteBooking(deleteId);
    setDeleting(false);
    if (result.success) {
      toast.success("Booking deleted");
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
              placeholder="Search guests, code…"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.entries(STATUS_LABELS).map(([k, label]) => (
                <SelectItem key={k} value={k}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All platforms</SelectItem>
              {Object.entries(PLATFORM_LABELS).map(([k, label]) => (
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
          Add booking
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No bookings found"
          description="Try adjusting filters or add a new booking."
          action={
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add booking
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
              {filtered.length} booking{filtered.length === 1 ? "" : "s"}
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

      <BookingForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        title={editing ? "Edit booking" : "New booking"}
        defaultValues={formDefaults}
        onSubmit={handleSubmit}
        currencySymbol={currencySymbol}
        properties={properties}
        defaultPropertyId={selectedPropertyId}
      />

      <ConfirmDelete
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete booking?"
        description="This will permanently remove the booking and its revenue from reports."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
