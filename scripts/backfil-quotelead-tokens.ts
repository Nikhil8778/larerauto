import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function main() {
  const leads = await prisma.quoteLead.findMany({
    where: {
      customerAccessToken: null,
    },
    select: {
      id: true,
    },
  });

  for (const lead of leads) {
    await prisma.quoteLead.update({
      where: { id: lead.id },
      data: {
        customerAccessToken: randomUUID(),
      },
    });
  }

  console.log(`Updated ${leads.length} quote lead token(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });