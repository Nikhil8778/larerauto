import { syncAllVendorPrices } from "@/lib/vendor-sync";

async function run() {
  const result = await syncAllVendorPrices();

  console.log(`Synced ${result.count} offer(s).`);
  console.log("Vendor price sync completed.");
}

run().catch((error) => {
  console.error("Vendor price sync failed:", error);
  process.exit(1);
});