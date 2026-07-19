import { z } from "zod";

export const bookingSchema = z
  .object({
    propertyId: z.string().min(1, "Property is required"),
    guestName: z.string().min(1, "Guest name is required"),
    phone: z.string().optional().nullable(),
    platform: z.enum(["AIRBNB", "BOOKING_COM", "DIRECT", "OTHER"]),
    checkInDate: z.string().min(1, "Check-in date is required"),
    checkInTime: z.string().default("15:00"),
    checkOutDate: z.string().min(1, "Check-out date is required"),
    checkOutTime: z.string().default("11:00"),
    guestsCount: z.coerce.number().int().min(1).default(1),
    revenue: z.coerce.number().min(0),
    cleaningFee: z.coerce.number().min(0).default(0),
    platformFee: z.coerce.number().min(0).default(0),
    discount: z.coerce.number().min(0).default(0),
    extraCharges: z.coerce.number().min(0).default(0),
    status: z.enum(["UPCOMING", "CHECKED_IN", "COMPLETED", "CANCELLED"]),
    notes: z.string().optional().nullable(),
  })
  .refine((d) => new Date(d.checkOutDate) > new Date(d.checkInDate), {
    message: "Check-out must be after check-in",
    path: ["checkOutDate"],
  });

export type BookingInput = z.infer<typeof bookingSchema>;

export const expenseCategories = [
  "RENT",
  "SECURITY_DEPOSIT",
  "ELECTRICITY",
  "GAS",
  "WATER",
  "INTERNET",
  "CLEANING",
  "LAUNDRY",
  "MAINTENANCE",
  "FURNITURE",
  "APPLIANCES",
  "LEGAL",
  "CONTRACT",
  "COMMISSION",
  "SUPPLIES",
  "SALARY",
  "MARKETING",
  "TAXES",
  "MISCELLANEOUS",
] as const;

export const expenseSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  date: z.string().min(1),
  category: z.enum(expenseCategories),
  description: z.string().min(1, "Description is required"),
  paidBy: z.string().optional().nullable(),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  receiptUrl: z.string().optional().nullable(),
  isRecurring: z.boolean().default(false),
  isRefundable: z.boolean().default(false),
  monthlyNote: z.string().optional().nullable(),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;

export const reimbursementSchema = z.object({
  expenseId: z.string().min(1),
  amount: z.coerce.number().min(0.01),
  date: z.string().min(1),
  paidTo: z.string().min(1),
  paidFrom: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type ReimbursementInput = z.infer<typeof reimbursementSchema>;

export const ownerSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type OwnerInput = z.infer<typeof ownerSchema>;

export const ownerTransactionSchema = z.object({
  ownerId: z.string().min(1),
  type: z.enum(["INVESTMENT", "WITHDRAWAL", "PROFIT_DISTRIBUTION"]),
  amount: z.coerce.number().min(0.01),
  date: z.string().min(1),
  description: z.string().optional().nullable(),
});

export type OwnerTransactionInput = z.infer<typeof ownerTransactionSchema>;

export const assetSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  name: z.string().min(1, "Name is required"),
  purchaseDate: z.string().optional().nullable(),
  cost: z.coerce.number().min(0),
  currentValue: z.coerce.number().min(0),
  isRefundable: z.boolean().default(false),
  notes: z.string().optional().nullable(),
});

export type AssetInput = z.infer<typeof assetSchema>;

export const propertySchema = z.object({
  name: z.string().min(1),
  buildingName: z.string().optional().nullable(),
  roomNumber: z.string().optional().nullable(),
  floor: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  address: z.string().min(1),
  unitType: z.string().optional().nullable(),
  monthlyRent: z.coerce.number().min(0),
  securityDeposit: z.coerce.number().min(0),
  dealerCommission: z.coerce.number().min(0).default(0),
  stampPaper: z.coerce.number().min(0).default(0),
  leaseStart: z.string().optional().nullable(),
  leaseEnd: z.string().optional().nullable(),
  landlordName: z.string().optional().nullable(),
  landlordPhone: z.string().optional().nullable(),
  landlordEmail: z.string().email().optional().nullable().or(z.literal("")),
  landlordNotes: z.string().optional().nullable(),
});

export type PropertyInput = z.infer<typeof propertySchema>;

export const settingsSchema = z.object({
  currency: z.string().min(1),
  currencySymbol: z.string().min(1),
  defaultCheckInTime: z.string().min(1),
  defaultCheckOutTime: z.string().min(1),
});

export type SettingsInput = z.infer<typeof settingsSchema>;

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const taskSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  dueDate: z.string().optional().nullable(),
});

export type TaskInput = z.infer<typeof taskSchema>;

export const noteSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  title: z.string().min(1, "Title is required").max(200),
  body: z.string().min(1, "Note content is required"),
  pinned: z.boolean().default(false),
  color: z.enum(["default", "teal", "amber", "rose", "sky"]).default("default"),
});

export type NoteInput = z.infer<typeof noteSchema>;
