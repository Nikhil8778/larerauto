import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // wipe in safe order for dev
  await prisma.offer.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.engine.deleteMany();
  await prisma.model.deleteMany();
  await prisma.make.deleteMany();
  await prisma.part.deleteMany();

  // --------------------------
  // MAKES
  // --------------------------
  const hyundai = await prisma.make.create({
    data: { name: "Hyundai" },
  });

  const toyota = await prisma.make.create({
    data: { name: "Toyota" },
  });

  const honda = await prisma.make.create({
    data: { name: "Honda" },
  });

  // --------------------------
  // MODELS
  // --------------------------
  const tucson = await prisma.model.create({
    data: {
      name: "Tucson",
      makeId: hyundai.id,
    },
  });

  const elantra = await prisma.model.create({
    data: {
      name: "Elantra",
      makeId: hyundai.id,
    },
  });

  const corolla = await prisma.model.create({
    data: {
      name: "Corolla",
      makeId: toyota.id,
    },
  });

  const camry = await prisma.model.create({
    data: {
      name: "Camry",
      makeId: toyota.id,
    },
  });

  const civic = await prisma.model.create({
    data: {
      name: "Civic",
      makeId: honda.id,
    },
  });

  const accord = await prisma.model.create({
    data: {
      name: "Accord",
      makeId: honda.id,
    },
  });

  // --------------------------
  // ENGINES
  // --------------------------
  const tucson20 = await prisma.engine.create({
    data: {
      name: "2.0L I4",
      modelId: tucson.id,
    },
  });

  const tucson24 = await prisma.engine.create({
    data: {
      name: "2.4L I4",
      modelId: tucson.id,
    },
  });

  const elantra18 = await prisma.engine.create({
    data: {
      name: "1.8L I4",
      modelId: elantra.id,
    },
  });

  const corolla18 = await prisma.engine.create({
    data: {
      name: "1.8L I4",
      modelId: corolla.id,
    },
  });

  const camry25 = await prisma.engine.create({
    data: {
      name: "2.5L I4",
      modelId: camry.id,
    },
  });

  const civic20 = await prisma.engine.create({
    data: {
      name: "2.0L I4",
      modelId: civic.id,
    },
  });

  const accord15 = await prisma.engine.create({
    data: {
      name: "1.5L Turbo",
      modelId: accord.id,
    },
  });

  // --------------------------
  // VEHICLES
  // --------------------------
  const vehicleHyundaiTucson2017 = await prisma.vehicle.create({
    data: {
      makeId: hyundai.id,
      modelId: tucson.id,
      engineId: tucson20.id,
      year: 2017,
    },
  });

  const vehicleHyundaiTucson2018 = await prisma.vehicle.create({
    data: {
      makeId: hyundai.id,
      modelId: tucson.id,
      engineId: tucson24.id,
      year: 2018,
    },
  });

  const vehicleToyotaCorolla2017 = await prisma.vehicle.create({
    data: {
      makeId: toyota.id,
      modelId: corolla.id,
      engineId: corolla18.id,
      year: 2017,
    },
  });

  const vehicleHondaCivic2019 = await prisma.vehicle.create({
    data: {
      makeId: honda.id,
      modelId: civic.id,
      engineId: civic20.id,
      year: 2019,
    },
  });

  // --------------------------
  // PARTS
  // --------------------------
  const alternator = await prisma.part.create({
    data: {
      partType: "Alternators",
      title: "Alternator (Demo)",
      description: "Quality replacement alternator. Demo description.",
      imageUrl: "/products/alternator.png",
    },
  });

  const starter = await prisma.part.create({
    data: {
      partType: "Starters",
      title: "Starter (Demo)",
      description: "Reliable replacement starter motor.",
      imageUrl: "/products/placeholder.png",
    },
  });

  const brakePads = await prisma.part.create({
    data: {
      partType: "Brake Pads",
      title: "Brake Pads (Demo)",
      description: "Ceramic brake pads. Demo description.",
      imageUrl: "/products/placeholder.png",
    },
  });

  const rotors = await prisma.part.create({
    data: {
      partType: "Rotors",
      title: "Rotors (Demo)",
      description: "High quality brake rotor set.",
      imageUrl: "/products/placeholder.png",
    },
  });

  const fuelTank = await prisma.part.create({
    data: {
      partType: "Fuel Tanks",
      title: "Fuel Tank (Demo)",
      description: "Direct fit replacement fuel tank.",
      imageUrl: "/products/placeholder.png",
    },
  });

  // --------------------------
  // OFFERS
  // inventory = 2 for each as requested
  // --------------------------
  await prisma.offer.createMany({
    data: [
      {
        vehicleId: vehicleHyundaiTucson2017.id,
        partId: alternator.id,
        sourceId: "manual",
        sourceSku: "ALT-HYU-TUC-2017-20",
        inventoryQty: 2,
        costPriceCents: 15000,
        referencePriceCents: 29000,
        sellPriceCents: 28000,
        currency: "CAD",
        leadTimeDays: 2,
      },
      {
        vehicleId: vehicleHyundaiTucson2017.id,
        partId: starter.id,
        sourceId: "manual",
        sourceSku: "STR-HYU-TUC-2017-20",
        inventoryQty: 2,
        costPriceCents: 11000,
        referencePriceCents: 22000,
        sellPriceCents: 21000,
        currency: "CAD",
        leadTimeDays: 2,
      },
      {
        vehicleId: vehicleHyundaiTucson2017.id,
        partId: brakePads.id,
        sourceId: "manual",
        sourceSku: "BP-HYU-TUC-2017-20",
        inventoryQty: 2,
        costPriceCents: 3500,
        referencePriceCents: 9500,
        sellPriceCents: 8500,
        currency: "CAD",
        leadTimeDays: 2,
      },
      {
        vehicleId: vehicleHyundaiTucson2017.id,
        partId: rotors.id,
        sourceId: "manual",
        sourceSku: "ROT-HYU-TUC-2017-20",
        inventoryQty: 2,
        costPriceCents: 6000,
        referencePriceCents: 15000,
        sellPriceCents: 14000,
        currency: "CAD",
        leadTimeDays: 2,
      },
      {
        vehicleId: vehicleHyundaiTucson2017.id,
        partId: fuelTank.id,
        sourceId: "manual",
        sourceSku: "FT-HYU-TUC-2017-20",
        inventoryQty: 2,
        costPriceCents: 12000,
        referencePriceCents: 26000,
        sellPriceCents: 25000,
        currency: "CAD",
        leadTimeDays: 3,
      },

      {
        vehicleId: vehicleToyotaCorolla2017.id,
        partId: alternator.id,
        sourceId: "manual",
        sourceSku: "ALT-TOY-COR-2017-18",
        inventoryQty: 2,
        costPriceCents: 14000,
        referencePriceCents: 27500,
        sellPriceCents: 26500,
        currency: "CAD",
        leadTimeDays: 2,
      },
      {
        vehicleId: vehicleHondaCivic2019.id,
        partId: brakePads.id,
        sourceId: "manual",
        sourceSku: "BP-HON-CIV-2019-20",
        inventoryQty: 2,
        costPriceCents: 3800,
        referencePriceCents: 9800,
        sellPriceCents: 8800,
        currency: "CAD",
        leadTimeDays: 2,
      },
      {
        vehicleId: vehicleHyundaiTucson2018.id,
        partId: alternator.id,
        sourceId: "manual",
        sourceSku: "ALT-HYU-TUC-2018-24",
        inventoryQty: 2,
        costPriceCents: 16000,
        referencePriceCents: 30000,
        sellPriceCents: 29000,
        currency: "CAD",
        leadTimeDays: 2,
      },
    ],
  });

  console.log("✅ New fitment database seeded successfully.");
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