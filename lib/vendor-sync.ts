import { findAndStoreVendorCandidates } from "@/lib/vendors/candidate-finder";
import { syncOfferPrices } from "@/lib/vendors/sync-offer-prices";

type SyncAllVendorPricesResult = {
  success: boolean;
  count: number;
};

export async function syncAllVendorPrices(): Promise<SyncAllVendorPricesResult> {
  await findAndStoreVendorCandidates({
    onlyUnsynced: false,
  });

  await syncOfferPrices({
    onlyPending: false,
  });

  return {
    success: true,
    count: 1,
  };
}