import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { vehicles } from "../data/vehicles";

const prisma = new PrismaClient();

const DEFAULT_PART_TYPES = [
  "Rotors & Brake Pads",
  "Calipers",
  "Bearings",
  "Brake Drum",
  "Alternators",
  "Starters",
  "Fuel Tanks",
  "Batteries",
  "Lights & Bulbs",
  "Fuses",
  "Control Arms",
  "Wheel Bearings",
  "Sway Bar Links",
  "Struts",
  "Shocks",
  "AC Compressor",
  "AC Condenser & Evaporator",
  "Tensioners & Pulleys",
  "Blower Motor",
  "Radiators",
  "Fuel Injectors",
  "Fuel Pumps",
  "Timing Belts",
  "Water Pumps",
  "Spark Plugs",
  "Ignition Coils",
] as const;

type VehicleSeedMake = {
  make: string;
  models: {
    model: string;
    engines: {
      engine: string;
      years: number[];
    }[];
  }[];
};

const PART_CATALOG: Record<
  string,
  {
    title: string;
    description: string;
    imageUrl: string;
    costPriceCents: number;
    sellPriceCents: number;
    leadTimeDays: number;
  }
> = {
  "Rotors & Brake Pads": {
    title: "Rotors & Brake Pads (Demo)",
    description: "Brake service combo package with rotors and pads.",
    imageUrl: "/products/Rotors.webp",
    costPriceCents: 9500,
    sellPriceCents: 18900,
    leadTimeDays: 2,
  },
  Calipers: {
    title: "Calipers (Demo)",
    description: "Direct-fit replacement calipers.",
    imageUrl: "/products/Calipers.jpg",
    costPriceCents: 7000,
    sellPriceCents: 16000,
    leadTimeDays: 2,
  },
  Bearings: {
    title: "Bearings (Demo)",
    description: "Durable replacement bearings.",
    imageUrl: "/products/Bearings.jpg",
    costPriceCents: 4200,
    sellPriceCents: 9800,
    leadTimeDays: 2,
  },
  "Brake Drum": {
    title: "Brake Drum (Demo)",
    description: "Reliable brake drum replacement.",
    imageUrl: "/products/Brake-Drum.jpg",
    costPriceCents: 5000,
    sellPriceCents: 11500,
    leadTimeDays: 2,
  },
  Alternators: {
    title: "Alternator (Demo)",
    description: "Quality replacement alternator.",
    imageUrl: "/products/Alternators.png",
    costPriceCents: 15000,
    sellPriceCents: 28000,
    leadTimeDays: 2,
  },
  Starters: {
    title: "Starter (Demo)",
    description: "Reliable replacement starter motor.",
    imageUrl: "/products/Starters.webp",
    costPriceCents: 11000,
    sellPriceCents: 21000,
    leadTimeDays: 2,
  },
  "Fuel Tanks": {
    title: "Fuel Tank (Demo)",
    description: "Direct fit replacement fuel tank.",
    imageUrl: "/products/Fuel-Tanks.jpg",
    costPriceCents: 12000,
    sellPriceCents: 25000,
    leadTimeDays: 3,
  },
  Batteries: {
    title: "Battery (Demo)",
    description: "Reliable vehicle battery replacement.",
    imageUrl: "/products/Batteries.jpg",
    costPriceCents: 9000,
    sellPriceCents: 17500,
    leadTimeDays: 2,
  },
  "Lights & Bulbs": {
    title: "Lights & Bulbs (Demo)",
    description: "Replacement bulbs and lighting components.",
    imageUrl: "/products/Lights-Bulb.jpg",
    costPriceCents: 1800,
    sellPriceCents: 4900,
    leadTimeDays: 2,
  },
  Fuses: {
    title: "Fuses (Demo)",
    description: "Electrical fuse replacements.",
    imageUrl: "/products/Fuses.jpg",
    costPriceCents: 700,
    sellPriceCents: 2400,
    leadTimeDays: 2,
  },
  "Control Arms": {
    title: "Control Arms (Demo)",
    description: "Suspension control arm replacement.",
    imageUrl: "/products/Control-Arms.webp",
    costPriceCents: 6500,
    sellPriceCents: 14500,
    leadTimeDays: 2,
  },
  "Wheel Bearings": {
    title: "Wheel Bearings (Demo)",
    description: "Wheel bearing replacement unit.",
    imageUrl: "/products/Wheel-Bearings.png",
    costPriceCents: 4800,
    sellPriceCents: 10800,
    leadTimeDays: 2,
  },
  "Sway Bar Links": {
    title: "Sway Bar Links (Demo)",
    description: "Stabilizer link replacement.",
    imageUrl: "/products/Sway-Bar-Links.jpg",
    costPriceCents: 2200,
    sellPriceCents: 5900,
    leadTimeDays: 2,
  },
  Struts: {
    title: "Struts (Demo)",
    description: "Suspension strut replacement.",
    imageUrl: "/products/Struts.jpg",
    costPriceCents: 8000,
    sellPriceCents: 16800,
    leadTimeDays: 2,
  },
  Shocks: {
    title: "Shocks (Demo)",
    description: "Shock absorber replacement.",
    imageUrl: "/products/Shocks.jpg",
    costPriceCents: 6500,
    sellPriceCents: 14200,
    leadTimeDays: 2,
  },
  "AC Compressor": {
    title: "AC Compressor (Demo)",
    description: "Air conditioning compressor replacement.",
    imageUrl: "/products/AC-Compressor.jpg",
    costPriceCents: 14000,
    sellPriceCents: 29500,
    leadTimeDays: 3,
  },
  "AC Condenser & Evaporator": {
    title: "AC Condenser & Evaporator (Demo)",
    description: "Cooling system AC condenser and evaporator parts.",
    imageUrl: "/products/AC-Evaporator.jpg",
    costPriceCents: 11000,
    sellPriceCents: 23800,
    leadTimeDays: 3,
  },
  "Tensioners & Pulleys": {
    title: "Tensioners & Pulleys (Demo)",
    description: "Accessory belt tensioner and pulley replacement.",
    imageUrl: "/products/Tensioners-Pulleys.jpg",
    costPriceCents: 3200,
    sellPriceCents: 7900,
    leadTimeDays: 2,
  },
  "Blower Motor": {
    title: "Blower Motor (Demo)",
    description: "HVAC blower motor replacement.",
    imageUrl: "/products/Blower-Motor.jpg",
    costPriceCents: 5000,
    sellPriceCents: 11800,
    leadTimeDays: 2,
  },
  Radiators: {
    title: "Radiator (Demo)",
    description: "Cooling radiator replacement.",
    imageUrl: "/products/Radiators.jpg",
    costPriceCents: 9000,
    sellPriceCents: 18900,
    leadTimeDays: 3,
  },
  "Fuel Injectors": {
    title: "Fuel Injectors (Demo)",
    description: "Direct-fit fuel injector replacement.",
    imageUrl: "/products/Fuel-Injectors.jpg",
    costPriceCents: 4500,
    sellPriceCents: 10200,
    leadTimeDays: 3,
  },
  "Fuel Pumps": {
    title: "Fuel Pump (Demo)",
    description: "Reliable fuel pump replacement.",
    imageUrl: "/products/Fuel-Pumps.webp",
    costPriceCents: 9000,
    sellPriceCents: 19000,
    leadTimeDays: 3,
  },
  "Timing Belts": {
    title: "Timing Belt (Demo)",
    description: "Timing belt replacement.",
    imageUrl: "/products/Timing-Belts.jpg",
    costPriceCents: 3800,
    sellPriceCents: 9200,
    leadTimeDays: 2,
  },
  "Water Pumps": {
    title: "Water Pump (Demo)",
    description: "Engine water pump replacement.",
    imageUrl: "/products/placeholder.png",
    costPriceCents: 5200,
    sellPriceCents: 11900,
    leadTimeDays: 2,
  },
  "Spark Plugs": {
    title: "Spark Plugs (Demo)",
    description: "Spark plug replacement set.",
    imageUrl: "/products/Spark-plugs.webp",
    costPriceCents: 1400,
    sellPriceCents: 3900,
    leadTimeDays: 2,
  },
  "Ignition Coils": {
    title: "Ignition Coils (Demo)",
    description: "Ignition coil replacement.",
    imageUrl: "/products/placeholder.png",
    costPriceCents: 2600,
    sellPriceCents: 6900,
    leadTimeDays: 2,
  },
};

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function buildSourceSku(params: {
  make: string;
  model: string;
  engine: string;
  year: number;
  partType: string;
}) {
  return `${params.partType}-${params.make}-${params.model}-${params.year}-${params.engine}`
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .toUpperCase();
}

async function main() {
  console.log("Seeding vehicle fitment data + parts + offers + admin user...");

  // Wipe in safe order for dev
  await prisma.vendorCandidate.deleteMany();
  await prisma.adminSession.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.vehiclePartType.deleteMany();
  await prisma.part.deleteMany();
  await prisma.partType.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.engine.deleteMany();
  await prisma.model.deleteMany();
  await prisma.make.deleteMany();
  await prisma.adminUser.deleteMany();

  // 1) Part types
  await prisma.partType.createMany({
    data: DEFAULT_PART_TYPES.map((name) => ({ name })),
    skipDuplicates: true,
  });

  const allPartTypes = await prisma.partType.findMany({
    select: { id: true, name: true },
  });
  const partTypeMap = new Map(allPartTypes.map((pt) => [pt.name, pt.id]));

  // 2) Makes
  const makeNames = [...new Set((vehicles as VehicleSeedMake[]).map((m) => m.make))];
  await prisma.make.createMany({
    data: makeNames.map((name) => ({ name })),
    skipDuplicates: true,
  });

  const allMakes = await prisma.make.findMany({
    select: { id: true, name: true },
  });
  const makeMap = new Map(allMakes.map((m) => [m.name, m.id]));

  // 3) Models
  const modelRows: { name: string; makeId: string }[] = [];
  for (const makeData of vehicles as VehicleSeedMake[]) {
    const makeId = makeMap.get(makeData.make);
    if (!makeId) continue;

    for (const modelData of makeData.models) {
      modelRows.push({
        name: modelData.model,
        makeId,
      });
    }
  }

  await prisma.model.createMany({
    data: modelRows,
    skipDuplicates: true,
  });

  const allModels = await prisma.model.findMany({
    select: { id: true, name: true, makeId: true },
  });
  const modelMap = new Map(
    allModels.map((m) => [`${m.makeId}::${m.name}`, m.id])
  );

  // 4) Engines
  const engineRows: { name: string; modelId: string }[] = [];
  for (const makeData of vehicles as VehicleSeedMake[]) {
    const makeId = makeMap.get(makeData.make);
    if (!makeId) continue;

    for (const modelData of makeData.models) {
      const modelId = modelMap.get(`${makeId}::${modelData.model}`);
      if (!modelId) continue;

      for (const engineData of modelData.engines) {
        engineRows.push({
          name: engineData.engine,
          modelId,
        });
      }
    }
  }

  await prisma.engine.createMany({
    data: engineRows,
    skipDuplicates: true,
  });

  const allEngines = await prisma.engine.findMany({
    select: { id: true, name: true, modelId: true },
  });
  const engineMap = new Map(
    allEngines.map((e) => [`${e.modelId}::${e.name}`, e.id])
  );

  // 5) Vehicles
  const vehicleRows: {
    makeId: string;
    modelId: string;
    engineId: string;
    year: number;
  }[] = [];

  type VehicleSeedFlat = {
    make: string;
    model: string;
    engine: string;
    year: number;
  };

  const flatVehicleRows: VehicleSeedFlat[] = [];

  for (const makeData of vehicles as VehicleSeedMake[]) {
    const makeId = makeMap.get(makeData.make);
    if (!makeId) continue;

    for (const modelData of makeData.models) {
      const modelId = modelMap.get(`${makeId}::${modelData.model}`);
      if (!modelId) continue;

      for (const engineData of modelData.engines) {
        const engineId = engineMap.get(`${modelId}::${engineData.engine}`);
        if (!engineId) continue;

        for (const year of engineData.years) {
          vehicleRows.push({
            makeId,
            modelId,
            engineId,
            year,
          });

          flatVehicleRows.push({
            make: makeData.make,
            model: modelData.model,
            engine: engineData.engine,
            year,
          });
        }
      }
    }
  }

  for (const chunk of chunkArray(vehicleRows, 1000)) {
    await prisma.vehicle.createMany({
      data: chunk,
      skipDuplicates: true,
    });
  }

  const allVehicles = await prisma.vehicle.findMany({
    select: {
      id: true,
      makeId: true,
      modelId: true,
      engineId: true,
      year: true,
    },
  });

  const vehicleMap = new Map(
    allVehicles.map((v) => [
      `${v.makeId}::${v.modelId}::${v.engineId}::${v.year}`,
      v.id,
    ])
  );

  // 6) VehiclePartType
  const vehiclePartTypeRows: { vehicleId: string; partTypeId: string }[] = [];

  for (const makeData of vehicles as VehicleSeedMake[]) {
    const makeId = makeMap.get(makeData.make);
    if (!makeId) continue;

    for (const modelData of makeData.models) {
      const modelId = modelMap.get(`${makeId}::${modelData.model}`);
      if (!modelId) continue;

      for (const engineData of modelData.engines) {
        const engineId = engineMap.get(`${modelId}::${engineData.engine}`);
        if (!engineId) continue;

        for (const year of engineData.years) {
          const vehicleId = vehicleMap.get(
            `${makeId}::${modelId}::${engineId}::${year}`
          );
          if (!vehicleId) continue;

          for (const partTypeName of DEFAULT_PART_TYPES) {
            const partTypeId = partTypeMap.get(partTypeName);
            if (!partTypeId) continue;

            vehiclePartTypeRows.push({
              vehicleId,
              partTypeId,
            });
          }
        }
      }
    }
  }

  for (const chunk of chunkArray(vehiclePartTypeRows, 2000)) {
    await prisma.vehiclePartType.createMany({
      data: chunk,
      skipDuplicates: true,
    });
  }

  // 7) Parts: one demo part per part type
  const partRows = DEFAULT_PART_TYPES.map((partTypeName) => {
    const partTypeId = partTypeMap.get(partTypeName);
    if (!partTypeId) {
      throw new Error(`Missing partTypeId for ${partTypeName}`);
    }

    const config = PART_CATALOG[partTypeName] ?? {
      title: `${partTypeName} (Demo)`,
      description: `Demo part for ${partTypeName}.`,
      imageUrl: "/products/placeholder.png",
      costPriceCents: 5000,
      sellPriceCents: 10000,
      leadTimeDays: 2,
    };

    return {
      partTypeId,
      title: config.title,
      description: config.description,
      imageUrl: config.imageUrl,
    };
  });

  for (const row of partRows) {
    await prisma.part.create({
      data: row,
    });
  }

  const allParts = await prisma.part.findMany({
    include: {
      partType: true,
    },
  });
  const partMap = new Map(allParts.map((p) => [p.partType.name, p]));

  // 8) Offers: one demo offer per vehicle x part type
  const offerRows: {
    vehicleId: string;
    partId: string;
    sourceId: string;
    sourceSku: string;
    inventoryQty: number;
    costPriceCents: number;
    referencePriceCents: number;
    sellPriceCents: number;
    currency: string;
    leadTimeDays: number;
    syncStatus: string;
  }[] = [];

  for (const row of flatVehicleRows) {
    const makeId = makeMap.get(row.make);
    if (!makeId) continue;

    const modelId = modelMap.get(`${makeId}::${row.model}`);
    if (!modelId) continue;

    const engineId = engineMap.get(`${modelId}::${row.engine}`);
    if (!engineId) continue;

    const vehicleId = vehicleMap.get(
      `${makeId}::${modelId}::${engineId}::${row.year}`
    );
    if (!vehicleId) continue;

    for (const partTypeName of DEFAULT_PART_TYPES) {
      const part = partMap.get(partTypeName);
      if (!part) continue;

      const config = PART_CATALOG[partTypeName] ?? {
        costPriceCents: 5000,
        sellPriceCents: 10000,
        leadTimeDays: 2,
      };

      offerRows.push({
        vehicleId,
        partId: part.id,
        sourceId: "manual",
        sourceSku: buildSourceSku({
          make: row.make,
          model: row.model,
          engine: row.engine,
          year: row.year,
          partType: partTypeName,
        }),
        inventoryQty: 2,
        costPriceCents: config.costPriceCents,
        referencePriceCents: config.sellPriceCents,
        sellPriceCents: config.sellPriceCents,
        currency: "CAD",
        leadTimeDays: config.leadTimeDays,
        syncStatus: "success",
      });
    }
  }

  for (const chunk of chunkArray(offerRows, 1000)) {
    await prisma.offer.createMany({
      data: chunk,
    });
  }

  // 9) Admin user
  const passwordHash = await bcrypt.hash("Admin@12345", 10);

  await prisma.adminUser.create({
    data: {
      email: "admin@lareauto.ca",
      passwordHash,
      name: "Admin",
      isActive: true,
    },
  });

  console.log("✅ Seed complete");
  console.log("Makes:", makeNames.length);
  console.log("Models rows:", modelRows.length);
  console.log("Engines rows:", engineRows.length);
  console.log("Vehicles rows:", vehicleRows.length);
  console.log("VehiclePartTypes rows:", vehiclePartTypeRows.length);
  console.log("Parts created:", partRows.length);
  console.log("Offers created:", offerRows.length);
  console.log("Admin user created: admin@lareauto.ca");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });