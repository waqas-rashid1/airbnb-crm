import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import {
  BookingPlatform,
  BookingStatus,
  ExpenseCategory,
  OwnerTransactionType,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

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
      address: "123 Main Boulevard, Lahore, Pakistan",
      monthlyRent: 190000,
      securityDeposit: 190000,
      dealerCommission: 30000,
      stampPaper: 2000,
      leaseStart: new Date("2026-01-01"),
      leaseEnd: new Date("2027-01-01"),
      landlordName: "Mr. Ahmed Khan",
      landlordPhone: "+92 300 1234567",
      landlordEmail: "landlord@example.com",
      landlordNotes: "Primary contact for lease matters",
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
      date: new Date("2026-01-01"),
      description: "Initial investment",
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
      date: new Date("2026-01-01"),
      description: "Initial investment",
      balanceAfter: 410000,
    },
  });
  console.log("✓ Owners: Waqas (2,000), Naseeb (410,000)");

  await prisma.booking.create({
    data: {
      bookingCode: "BK-2026-0001",
      propertyId: property.id,
      guestName: "Ali Hassan",
      phone: "+92 321 9876543",
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
      status: BookingStatus.UPCOMING,
      notes: "First booking — seed data",
    },
  });
  console.log("✓ Booking: 18 Jul 2026, Revenue 12,000");

  // Startup expenses
  const startupExpenses = [
    {
      date: new Date("2026-01-01"),
      category: ExpenseCategory.RENT,
      description: "January rent",
      amount: 190000,
      paidBy: "Naseeb",
    },
    {
      date: new Date("2026-01-01"),
      category: ExpenseCategory.COMMISSION,
      description: "Dealer commission",
      amount: 30000,
      paidBy: "Naseeb",
    },
    {
      date: new Date("2026-01-01"),
      category: ExpenseCategory.LEGAL,
      description: "Stamp paper",
      amount: 2000,
      paidBy: "Waqas",
    },
    {
      date: new Date("2026-02-01"),
      category: ExpenseCategory.RENT,
      description: "February rent",
      amount: 190000,
      paidBy: "Naseeb",
      isRecurring: true,
    },
    {
      date: new Date("2026-03-01"),
      category: ExpenseCategory.RENT,
      description: "March rent",
      amount: 190000,
      paidBy: "Naseeb",
      isRecurring: true,
    },
    {
      date: new Date("2026-03-15"),
      category: ExpenseCategory.ELECTRICITY,
      description: "Electricity bill March",
      amount: 8500,
      paidBy: "Naseeb",
    },
    {
      date: new Date("2026-03-20"),
      category: ExpenseCategory.INTERNET,
      description: "Internet installation + first month",
      amount: 5500,
      paidBy: "Naseeb",
    },
    {
      date: new Date("2026-04-01"),
      category: ExpenseCategory.RENT,
      description: "April rent",
      amount: 190000,
      paidBy: "Naseeb",
      isRecurring: true,
    },
    {
      date: new Date("2026-05-01"),
      category: ExpenseCategory.RENT,
      description: "May rent",
      amount: 190000,
      paidBy: "Naseeb",
      isRecurring: true,
    },
    {
      date: new Date("2026-06-01"),
      category: ExpenseCategory.RENT,
      description: "June rent",
      amount: 190000,
      paidBy: "Naseeb",
      isRecurring: true,
    },
    {
      date: new Date("2026-06-10"),
      category: ExpenseCategory.CLEANING,
      description: "Deep cleaning before listing",
      amount: 4000,
      paidBy: "Naseeb",
    },
    {
      date: new Date("2026-07-01"),
      category: ExpenseCategory.RENT,
      description: "July rent",
      amount: 190000,
      paidBy: "Naseeb",
      isRecurring: true,
    },
  ];

  for (const exp of startupExpenses) {
    await prisma.expense.create({
      data: {
        propertyId: property.id,
        ...exp,
        isRecurring: exp.isRecurring ?? false,
      },
    });
  }
  console.log(`✓ Expenses: ${startupExpenses.length} records`);

  // Assets
  const assets = [
    {
      name: "Security Deposit",
      cost: 190000,
      currentValue: 190000,
      isRefundable: true,
      purchaseDate: new Date("2026-01-01"),
      notes: "Refundable security deposit with landlord",
    },
    {
      name: "AC Unit",
      cost: 85000,
      currentValue: 75000,
      isRefundable: false,
      purchaseDate: new Date("2026-01-15"),
    },
    {
      name: "Smart TV 55\"",
      cost: 65000,
      currentValue: 55000,
      isRefundable: false,
      purchaseDate: new Date("2026-01-20"),
    },
    {
      name: "King Bed Set",
      cost: 45000,
      currentValue: 40000,
      isRefundable: false,
      purchaseDate: new Date("2026-01-10"),
    },
    {
      name: "Dining Table Set",
      cost: 25000,
      currentValue: 22000,
      isRefundable: false,
      purchaseDate: new Date("2026-01-12"),
    },
    {
      name: "Refrigerator",
      cost: 55000,
      currentValue: 48000,
      isRefundable: false,
      purchaseDate: new Date("2026-01-18"),
    },
    {
      name: "Washing Machine",
      cost: 40000,
      currentValue: 35000,
      isRefundable: false,
      purchaseDate: new Date("2026-02-01"),
    },
  ];

  for (const asset of assets) {
    await prisma.asset.create({
      data: { propertyId: property.id, ...asset },
    });
  }
  console.log(`✓ Assets: ${assets.length} items`);

  // Additional sample bookings for charts
  const sampleBookings = [
    {
      code: "BK-2026-0002",
      guest: "Sara Ahmed",
      checkIn: "2026-06-05",
      checkOut: "2026-06-08",
      nights: 3,
      revenue: 36000,
      status: BookingStatus.COMPLETED,
    },
    {
      code: "BK-2026-0003",
      guest: "John Smith",
      checkIn: "2026-06-15",
      checkOut: "2026-06-18",
      nights: 3,
      revenue: 40000,
      status: BookingStatus.COMPLETED,
    },
    {
      code: "BK-2026-0004",
      guest: "Fatima Noor",
      checkIn: "2026-07-01",
      checkOut: "2026-07-05",
      nights: 4,
      revenue: 48000,
      status: BookingStatus.COMPLETED,
    },
    {
      code: "BK-2026-0005",
      guest: "Omar Malik",
      checkIn: "2026-07-10",
      checkOut: "2026-07-12",
      nights: 2,
      revenue: 24000,
      status: BookingStatus.COMPLETED,
    },
    {
      code: "BK-2026-0006",
      guest: "Emma Wilson",
      checkIn: "2026-07-25",
      checkOut: "2026-07-28",
      nights: 3,
      revenue: 38000,
      status: BookingStatus.UPCOMING,
    },
  ];

  for (const b of sampleBookings) {
    const platformFee = Math.round(Number(b.revenue) * 0.03);
    await prisma.booking.create({
      data: {
        bookingCode: b.code,
        propertyId: property.id,
        guestName: b.guest,
        phone: "+92 300 0000000",
        platform: BookingPlatform.AIRBNB,
        checkInDate: new Date(`${b.checkIn}T15:00:00`),
        checkInTime: "15:00",
        checkOutDate: new Date(`${b.checkOut}T11:00:00`),
        checkOutTime: "11:00",
        nights: b.nights,
        guestsCount: 2,
        revenue: b.revenue,
        cleaningFee: 2000,
        platformFee,
        discount: 0,
        extraCharges: 0,
        netRevenue: b.revenue + 2000 - platformFee,
        status: b.status,
      },
    });
  }
  console.log(`✓ Additional bookings: ${sampleBookings.length}`);

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
