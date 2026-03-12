import { syncOfferPrices } from "@/lib/vendors/sync-offer-prices";

async function main() {
  console.log("Starting offer price sync...");
  await syncOfferPrices();
  console.log("Offer price sync complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});