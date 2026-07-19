import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const waqas =
    process.env.MENTION_EMAIL_WAQAS?.trim() || process.env.ADMIN_EMAIL?.trim();
  const naseeb =
    process.env.MENTION_EMAIL_NASEEB?.trim() ||
    process.env.OWNER_EMAIL_NASEEB?.trim();

  if (waqas) {
    const r = await prisma.owner.updateMany({
      where: { name: { equals: "Waqas", mode: "insensitive" } },
      data: { email: waqas.toLowerCase() },
    });
    console.log(`Waqas email updated (${r.count}): ${waqas.toLowerCase()}`);
  }

  if (naseeb) {
    const r = await prisma.owner.updateMany({
      where: { name: { equals: "Naseeb", mode: "insensitive" } },
      data: { email: naseeb.toLowerCase() },
    });
    console.log(`Naseeb email updated (${r.count}): ${naseeb.toLowerCase()}`);
  } else {
    console.log(
      "Naseeb: set MENTION_EMAIL_NASEEB in .env or add email on the Owners page"
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
