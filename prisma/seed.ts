import { PrismaClient } from "@prisma/client";
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
];

async function main() {
  console.log("Seeding vehicle fitment data...");

  for (const partTypeName of DEFAULT_PART_TYPES) {
    await prisma.partType.upsert({
      where: { name: partTypeName },
      update: {},
      create: { name: partTypeName },
    });
  }

  const allPartTypes = await prisma.partType.findMany();
  const partTypeMap = new Map(allPartTypes.map((pt) => [pt.name, pt.id]));

  for (const makeData of vehicles) {
    const make = await prisma.make.upsert({
      where: { name: makeData.make },
      update: {},
      create: { name: makeData.make },
    });

    for (const modelData of makeData.models) {
      const model = await prisma.model.upsert({
        where: {
          makeId_name: {
            makeId: make.id,
            name: modelData.model,
          },
        },
        update: {},
        create: {
          name: modelData.model,
          makeId: make.id,
        },
      });

      for (const engineData of modelData.engines) {
        const engine = await prisma.engine.upsert({
          where: {
            modelId_name: {
              modelId: model.id,
              name: engineData.engine,
            },
          },
          update: {},
          create: {
            name: engineData.engine,
            modelId: model.id,
          },
        });

        for (const year of engineData.years) {
          const vehicle = await prisma.vehicle.upsert({
            where: {
              makeId_modelId_engineId_year: {
                makeId: make.id,
                modelId: model.id,
                engineId: engine.id,
                year,
              },
            },
            update: {},
            create: {
              makeId: make.id,
              modelId: model.id,
              engineId: engine.id,
              year,
            },
          });

          for (const partTypeName of DEFAULT_PART_TYPES) {
            const partTypeId = partTypeMap.get(partTypeName);
            if (!partTypeId) continue;

            await prisma.vehiclePartType.upsert({
              where: {
                vehicleId_partTypeId: {
                  vehicleId: vehicle.id,
                  partTypeId,
                },
              },
              update: {},
              create: {
                vehicleId: vehicle.id,
                partTypeId,
              },
            });
          }
        }
      }
    }
  }

  console.log("Vehicle fitment seed complete");
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