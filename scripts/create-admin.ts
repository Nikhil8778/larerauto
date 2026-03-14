import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const email = "admin@lareauto.ca";
  const password = "Admin@12345";

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: {
      passwordHash,
      isActive: true,
      name: "Admin",
    },
    create: {
      email,
      passwordHash,
      isActive: true,
      name: "Admin",
    },
  });

  console.log("✅ Admin user ready:", admin.email);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });