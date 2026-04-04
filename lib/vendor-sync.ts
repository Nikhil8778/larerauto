import { prisma } from "@/lib/prisma";
import { findAndStoreVendorCandidates } from "@/lib/vendors/candidate-finder";
import { syncOfferPrices } from "@/lib/vendors/sync-offer-prices";

type SyncAllVendorPricesInput = {
  make?: string;
  model?: string;
  engine?: string;
  year?: number;
  partType?: string;
  take?: number;
  onlyPending?: boolean;
};

type SyncAllVendorPricesResult = {
  success: boolean;
  count: number;
  filters: {
    make: string;
    model: string;
    engine: string;
    year: string;
    partType: string;
    take: number;
    onlyPending: boolean;
  };
};

function normalizeTake(value: number | undefined) {
  if (!value || !Number.isFinite(value)) return 10;
  return Math.max(1, Math.min(100, Math.floor(value)));
}

export async function syncAllVendorPrices(
  input: SyncAllVendorPricesInput = {}
): Promise<SyncAllVendorPricesResult> {
  const make = (input.make ?? "").trim();
  const model = (input.model ?? "").trim();
  const engine = (input.engine ?? "").trim();
  const partType = (input.partType ?? "").trim();
  const take = normalizeTake(input.take);
  const onlyPending = input.onlyPending ?? true;
  const year =
    typeof input.year === "number" && Number.isFinite(input.year)
      ? input.year
      : undefined;

  const vehicleWhere: any = {};

  if (make) {
    vehicleWhere.make = {
      name: {
        equals: make,
        mode: "insensitive",
      },
    };
  }

  if (model) {
    vehicleWhere.model = {
      name: {
        equals: model,
        mode: "insensitive",
      },
    };
  }

  if (engine) {
    vehicleWhere.engine = {
      name: {
        equals: engine,
        mode: "insensitive",
      },
    };
  }

  if (typeof year === "number") {
    vehicleWhere.year = year;
  }

  const countWhere: any = {
    ...(Object.keys(vehicleWhere).length > 0 ? { vehicle: vehicleWhere } : {}),
    ...(partType
      ? {
          part: {
            partType: {
              name: {
                equals: partType,
                mode: "insensitive",
              },
            },
          },
        }
      : {}),
    ...(onlyPending
      ? {
          OR: [
            { syncStatus: null },
            { syncStatus: "" },
            { syncStatus: "pending" },
            { syncStatus: "failed" },
          ],
        }
      : {}),
  };

  const count = await prisma.offer.count({
    where: countWhere,
  });

  await findAndStoreVendorCandidates({
    make: make || undefined,
    model: model || undefined,
    engine: engine || undefined,
    year,
    partType: partType || undefined,
    take,
    onlyUnsynced: onlyPending,
  });

  await syncOfferPrices({
    make: make || undefined,
    model: model || undefined,
    engine: engine || undefined,
    year,
    partType: partType || undefined,
    take,
    onlyPending,
  });

  return {
    success: true,
    count: Math.min(count, take),
    filters: {
      make,
      model,
      engine,
      year: typeof year === "number" ? String(year) : "",
      partType,
      take,
      onlyPending,
    },
  };
}