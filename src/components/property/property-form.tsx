"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  updateProperty,
  uploadDocument,
  deleteDocument,
} from "@/actions/property";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { propertySchema, type PropertyInput } from "@/schemas";
import { formatDate } from "@/lib/calculations";

export type SerializedDocument = {
  id: string;
  name: string;
  type: string;
  url: string;
  size?: number | null;
  mimeType?: string | null;
  createdAt: string | Date;
};

export type SerializedProperty = {
  id: string;
  name: string;
  buildingName?: string | null;
  roomNumber?: string | null;
  floor?: string | null;
  city?: string | null;
  address: string;
  unitType?: string | null;
  monthlyRent: number | string;
  securityDeposit: number | string;
  dealerCommission: number | string;
  stampPaper: number | string;
  leaseStart?: string | Date | null;
  leaseEnd?: string | Date | null;
  landlordName?: string | null;
  landlordPhone?: string | null;
  landlordEmail?: string | null;
  landlordNotes?: string | null;
  documents?: SerializedDocument[];
};

type PropertyFormProps = {
  property: SerializedProperty;
  documents?: SerializedDocument[];
  currencySymbol?: string;
};

function toDateInput(value?: string | Date | null): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toISOString().slice(0, 10);
}

function formatBytes(bytes?: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const DOC_TYPES = [
  { value: "PROPERTY", label: "Property" },
  { value: "LEASE", label: "Lease" },
  { value: "EXPENSE_RECEIPT", label: "Receipt" },
  { value: "OTHER", label: "Other" },
];

export function PropertyForm({
  property,
  documents: docsProp,
}: PropertyFormProps) {
  const documents = docsProp ?? property.documents ?? [];
  const fileRef = useRef<HTMLInputElement>(null);
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("OTHER");
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<PropertyInput>({
    resolver: zodResolver(propertySchema) as never,
    defaultValues: {
      name: property.name,
      buildingName: property.buildingName ?? "",
      roomNumber: property.roomNumber ?? "",
      floor: property.floor ?? "",
      city: property.city ?? "",
      address: property.address,
      unitType: property.unitType ?? "",
      monthlyRent: Number(property.monthlyRent),
      securityDeposit: Number(property.securityDeposit),
      dealerCommission: Number(property.dealerCommission),
      stampPaper: Number(property.stampPaper),
      leaseStart: toDateInput(property.leaseStart),
      leaseEnd: toDateInput(property.leaseEnd),
      landlordName: property.landlordName ?? "",
      landlordPhone: property.landlordPhone ?? "",
      landlordEmail: property.landlordEmail ?? "",
      landlordNotes: property.landlordNotes ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      name: property.name,
      buildingName: property.buildingName ?? "",
      roomNumber: property.roomNumber ?? "",
      floor: property.floor ?? "",
      city: property.city ?? "",
      address: property.address,
      unitType: property.unitType ?? "",
      monthlyRent: Number(property.monthlyRent),
      securityDeposit: Number(property.securityDeposit),
      dealerCommission: Number(property.dealerCommission),
      stampPaper: Number(property.stampPaper),
      leaseStart: toDateInput(property.leaseStart),
      leaseEnd: toDateInput(property.leaseEnd),
      landlordName: property.landlordName ?? "",
      landlordPhone: property.landlordPhone ?? "",
      landlordEmail: property.landlordEmail ?? "",
      landlordNotes: property.landlordNotes ?? "",
    });
  }, [property, form]);

  async function onSubmit(data: PropertyInput) {
    const result = await updateProperty(property.id, data);
    if (result.success) {
      toast.success("Property updated");
    } else {
      toast.error(result.error);
    }
  }

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("Select a file to upload");
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("name", docName || file.name);
    fd.set("type", docType);
    fd.set("propertyId", property.id);
    const result = await uploadDocument(fd);
    setUploading(false);
    if (result.success) {
      toast.success("Document uploaded");
      setDocName("");
      setDocType("OTHER");
      if (fileRef.current) fileRef.current.value = "";
    } else {
      toast.error(result.error);
    }
  }

  async function handleDeleteDoc() {
    if (!deleteId) return;
    setDeleting(true);
    const result = await deleteDocument(deleteId);
    setDeleting(false);
    if (result.success) {
      toast.success("Document deleted");
      setDeleteId(null);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Property details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Property name</Label>
                <Input id="name" {...form.register("name")} />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitType">Unit type</Label>
                <Input
                  id="unitType"
                  placeholder="Studio, 1BR, apartment…"
                  {...form.register("unitType")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buildingName">Building</Label>
                <Input id="buildingName" {...form.register("buildingName")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" {...form.register("city")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roomNumber">Room / unit #</Label>
                <Input id="roomNumber" {...form.register("roomNumber")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="floor">Floor</Label>
                <Input id="floor" {...form.register("floor")} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" {...form.register("address")} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyRent">Monthly rent</Label>
                <Input
                  id="monthlyRent"
                  type="number"
                  step="0.01"
                  min={0}
                  {...form.register("monthlyRent")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="securityDeposit">Security deposit</Label>
                <Input
                  id="securityDeposit"
                  type="number"
                  step="0.01"
                  min={0}
                  {...form.register("securityDeposit")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dealerCommission">Dealer commission</Label>
                <Input
                  id="dealerCommission"
                  type="number"
                  step="0.01"
                  min={0}
                  {...form.register("dealerCommission")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stampPaper">Stamp paper</Label>
                <Input
                  id="stampPaper"
                  type="number"
                  step="0.01"
                  min={0}
                  {...form.register("stampPaper")}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="leaseStart">Lease start</Label>
                <Input id="leaseStart" type="date" {...form.register("leaseStart")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leaseEnd">Lease end</Label>
                <Input id="leaseEnd" type="date" {...form.register("leaseEnd")} />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="mb-3 text-sm font-medium">Landlord</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="landlordName">Name</Label>
                  <Input id="landlordName" {...form.register("landlordName")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="landlordPhone">Phone</Label>
                  <Input id="landlordPhone" {...form.register("landlordPhone")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="landlordEmail">Email</Label>
                  <Input id="landlordEmail" type="email" {...form.register("landlordEmail")} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="landlordNotes">Notes</Label>
                  <Textarea id="landlordNotes" rows={2} {...form.register("landlordNotes")} />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving…" : "Save property"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 rounded-lg border border-dashed p-4 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="doc-name">Document name</Label>
              <Input
                id="doc-name"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="Lease agreement"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-file">File</Label>
              <Input id="doc-file" type="file" ref={fileRef} />
            </div>
            <Button type="button" onClick={handleUpload} disabled={uploading}>
              <Upload className="h-4 w-4" />
              {uploading ? "Uploading…" : "Upload"}
            </Button>
          </div>

          {documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FileText className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium hover:underline"
                        >
                          {doc.name}
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{doc.type}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatBytes(doc.size)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(doc.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteId(doc.id)}
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

      <ConfirmDelete
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete document?"
        description="This will permanently remove the document record."
        onConfirm={handleDeleteDoc}
        loading={deleting}
      />
    </div>
  );
}
