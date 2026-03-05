import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1) wipe (safe for dev) — order matters because Offer depends on Product
  await prisma.offer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.quote.deleteMany();

  // 2) create products
  const alternator = await prisma.product.create({
    data: {
      partType: "Alternators",
      title: "Alternator (Demo)",
      description: "Quality replacement alternator. Demo description.",
      imageUrl: "https://via.placeholder.com/300?text=Alternator",
    },
  });

  const brakePads = await prisma.product.create({
    data: {
      partType: "Brake Pads",
      title: "Brake Pads (Demo)",
      description: "Ceramic brake pads. Demo description.",
      imageUrl: "https://via.placeholder.com/300?text=Brake+Pads",
    },
  });

  // 3) create offers (use sourceId instead of distributorId)
  await prisma.offer.createMany({
    data: [
      // Alternators / Hyundai Tucson 2017
      {
        productId: alternator.id,
        sourceId: "distA",
        sourceSku: "ALT-HYU-TUC-2017-A1",
        cost: 12000, // cents
        qtyAvailable: 3,
        leadTimeDays: 2,
        currency: "CAD",
        partType: "Alternators",
        year: 2017,
        make: "Hyundai",
        model: "Tucson",
      },
      {
        productId: alternator.id,
        sourceId: "distB",
        sourceSku: "ALT-HYU-TUC-2017-B1",
        cost: 13500,
        qtyAvailable: 1,
        leadTimeDays: 4,
        currency: "CAD",
        partType: "Alternators",
        year: 2017,
        make: "Hyundai",
        model: "Tucson",
      },
      {
        productId: alternator.id,
        sourceId: "distC",
        sourceSku: "ALT-HYU-TUC-2017-C1",
        cost: 10500,
        qtyAvailable: 0,
        leadTimeDays: 5,
        currency: "CAD",
        partType: "Alternators",
        year: 2017,
        make: "Hyundai",
        model: "Tucson",
      },

      // Brake Pads / Hyundai Tucson 2017
      {
        productId: brakePads.id,
        sourceId: "distA",
        sourceSku: "BP-HYU-TUC-2017-A1",
        cost: 3500,
        qtyAvailable: 10,
        leadTimeDays: 2,
        currency: "CAD",
        partType: "Brake Pads",
        year: 2017,
        make: "Hyundai",
        model: "Tucson",
      },
      {
        productId: brakePads.id,
        sourceId: "distB",
        sourceSku: "BP-HYU-TUC-2017-B1",
        cost: 3200,
        qtyAvailable: 2,
        leadTimeDays: 4,
        currency: "CAD",
        partType: "Brake Pads",
        year: 2017,
        make: "Hyundai",
        model: "Tucson",
      },
    ],
  });

  console.log("✅ Seed complete.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });