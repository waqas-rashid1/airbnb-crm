import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import {
  BookingPlatform,
  BookingStatus,
  ExpenseCategory,
  OwnerTransactionType,
  ReimbursementStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  await prisma.reimbursement.deleteMany();
  await prisma.ownerTransaction.deleteMany();
  await prisma.owner.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.document.deleteMany();
  await prisma.property.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.user.deleteMany();
  await prisma.report.deleteMany();

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error(
      "Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before seeding. These are never committed to git."
    );
  }

  const passwordHash = await hash(adminPassword, 12);
  const admin = await prisma.user.create({
    data: {
      email: adminEmail.toLowerCase(),
      name: "Waqas",
      passwordHash,
    },
  });
  console.log(`✓ Admin user created: ${admin.email} (password stored hashed in DB only)`);

  const property = await prisma.property.create({
    data: {
      name: "Downtown Airbnb Suite",
      buildingName: null,
      roomNumber: null,
      floor: null,
      city: "Lahore",
      address: "Lahore, Pakistan",
      unitType: "Apartment",
      monthlyRent: 190000,
      securityDeposit: 190000,
      dealerCommission: 30000,
      stampPaper: 2000,
      leaseStart: new Date("2026-07-18"),
      leaseEnd: null,
      landlordName: null,
      landlordPhone: null,
      landlordEmail: null,
      landlordNotes: null,
    },
  });
  console.log(`✓ Property: ${property.name}`);

  await prisma.settings.create({
    data: {
      currency: "PKR",
      currencySymbol: "Rs",
      defaultCheckInTime: "15:00",
      defaultCheckOutTime: "11:00",
      expenseCategories: [
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
      ],
      bookingPlatforms: ["AIRBNB", "BOOKING_COM", "DIRECT", "OTHER"],
    },
  });
  console.log("✓ Settings");

  const waqas = await prisma.owner.create({
    data: {
      propertyId: property.id,
      name: "Waqas",
      investment: 2000,
      balance: 2000,
      notes: "Minor investor",
    },
  });
  await prisma.ownerTransaction.create({
    data: {
      ownerId: waqas.id,
      type: OwnerTransactionType.INVESTMENT,
      amount: 2000,
      date: new Date("2026-07-18"),
      description: "Initial investment (contract fee covered)",
      balanceAfter: 2000,
    },
  });

  const naseeb = await prisma.owner.create({
    data: {
      propertyId: property.id,
      name: "Naseeb",
      investment: 410000,
      balance: 410000,
      notes: "Primary investor",
    },
  });
  await prisma.ownerTransaction.create({
    data: {
      ownerId: naseeb.id,
      type: OwnerTransactionType.INVESTMENT,
      amount: 410000,
      date: new Date("2026-07-01"),
      description: "Initial investment (rent + security + commission)",
      balanceAfter: 410000,
    },
  });
  console.log("✓ Owners: Waqas (2,000), Naseeb (410,000)");

  // Only real booking
  await prisma.booking.create({
    data: {
      bookingCode: "BK-2026-0001",
      propertyId: property.id,
      guestName: "Guest",
      phone: null,
      platform: BookingPlatform.AIRBNB,
      checkInDate: new Date("2026-07-18T15:00:00"),
      checkInTime: "15:00",
      checkOutDate: new Date("2026-07-19T11:00:00"),
      checkOutTime: "11:00",
      nights: 1,
      guestsCount: 2,
      revenue: 12000,
      cleaningFee: 0,
      platformFee: 0,
      discount: 0,
      extraCharges: 0,
      netRevenue: 12000,
      status: BookingStatus.COMPLETED,
      notes: "Sat 18 Jul → Sun 19 Jul",
    },
  });
  console.log("✓ Booking: 18–19 Jul 2026, Revenue 12,000");

  // Real expenses only
  await prisma.expense.createMany({
    data: [
      {
        propertyId: property.id,
        date: new Date("2026-07-01"),
        category: ExpenseCategory.RENT,
        description: "Monthly rent",
        paidBy: "Naseeb",
        amount: 190000,
        isRecurring: true,
        isRefundable: false,
        reimbursementStatus: ReimbursementStatus.PENDING,
        reimbursedAmount: 0,
      },
      {
        propertyId: property.id,
        date: new Date("2026-07-01"),
        category: ExpenseCategory.SECURITY_DEPOSIT,
        description: "Security deposit (refundable)",
        paidBy: "Naseeb",
        amount: 190000,
        isRecurring: false,
        isRefundable: true,
        reimbursementStatus: ReimbursementStatus.PENDING,
        reimbursedAmount: 0,
      },
      {
        propertyId: property.id,
        date: new Date("2026-07-01"),
        category: ExpenseCategory.COMMISSION,
        description: "Commission to Rizwan",
        paidBy: "Naseeb",
        amount: 30000,
        isRecurring: false,
        isRefundable: false,
        reimbursementStatus: ReimbursementStatus.PENDING,
        reimbursedAmount: 0,
      },
      {
        propertyId: property.id,
        date: new Date("2026-07-18"),
        category: ExpenseCategory.CONTRACT,
        description: "Contract fee for stamp #625",
        paidBy: "Waqas",
        amount: 2000,
        isRecurring: false,
        isRefundable: false,
        reimbursementStatus: ReimbursementStatus.PENDING,
        reimbursedAmount: 0,
      },
    ],
  });
  console.log("✓ Expenses: rent 190k, security 190k, commission 30k (Naseeb); contract 2k (Waqas)");
  console.log("✓ Assets: none (page kept empty)");

  console.log("\n✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
