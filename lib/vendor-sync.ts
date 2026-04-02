import { prisma } from "@/lib/prisma";
import { findAndStoreVendorCandidates } from "@/lib/vendors/candidate-finder";
import { syncOfferPrices } from "@/lib/vendors/sync-offer-prices";

type SyncAllVendorPricesInput = {
  make?: string;
  model?: string;
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
  const partType = (input.partType ?? "").trim();
  const take = normalizeTake(input.take);
  const onlyPending = input.onlyPending ?? true;

  const countWhere: any = {
    ...(make
      ? {
          vehicle: {
            make: {
              name: {
                equals: make,
                mode: "insensitive",
              },
            },
          },
        }
      : {}),
    ...(model
      ? {
          vehicle: {
            ...(make
              ? {
                  make: {
                    name: {
                      equals: make,
                      mode: "insensitive",
                    },
                  },
                }
              : {}),
            model: {
              name: {
                equals: model,
                mode: "insensitive",
              },
            },
          },
        }
      : {}),
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
    partType: partType || undefined,
    take,
    onlyUnsynced: onlyPending,
  });

  await syncOfferPrices({
    make: make || undefined,
    model: model || undefined,
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
      partType,
      take,
      onlyPending,
    },
  };
}