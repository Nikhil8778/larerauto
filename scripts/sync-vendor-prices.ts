import { syncAllVendorPrices } from "../lib/vendor-sync";

async function main() {
  console.log("Starting vendor price sync...");
  const result = await syncAllVendorPrices();
  console.log(`Synced ${result.count} offer(s).`);
  console.log(result.results);
  console.log("Vendor price sync completed.");
}

main().catch((error) => {
  console.error("Vendor price sync failed:", error);
  process.exit(1);
});