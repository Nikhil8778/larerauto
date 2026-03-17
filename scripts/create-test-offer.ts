import { prisma } from "../lib/prisma";

async function main() {
  const vehicle = await prisma.vehicle.findFirst({
    where: {
      year: 2019,
      make: { name: "Honda" },
      model: { name: "HR-V" },
      engine: { name: "1.8L I4" },
    },
  });

  if (!vehicle) {
    console.log("Vehicle not found. Seed your vehicles first.");
    return;
  }

  const partType = await prisma.partType.findFirst({
    where: { name: "Alternators" },
  });

  if (!partType) {
    console.log("PartType Alternators not found.");
    return;
  }

  const part = await prisma.part.create({
    data: {
      partTypeId: partType.id,
      title: "2019 Honda HR-V Alternator",
      description: "Test alternator for checkout testing",
      imageUrl: null,
    },
  });

  const offer = await prisma.offer.create({
    data: {
      vehicleId: vehicle.id,
      partId: part.id,
      sourceId: "manual",
      sourceSku: "TEST-ALT-HRV-2019",
      inventoryQty: 5,
      costPriceCents: 12000,
      sellPriceCents: 18999,
      currency: "CAD",
    },
  });

  console.log("✅ Test offer created:", offer.id);
}

main().finally(() => prisma.$disconnect());