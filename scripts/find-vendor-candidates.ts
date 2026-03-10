import { findAndStoreVendorCandidates } from "../lib/vendors/candidate-finder";

async function main() {
  console.log("Finding vendor candidates...");
  await findAndStoreVendorCandidates();
  console.log("Vendor candidate search complete.");
}

main().catch((error) => {
  console.error("Vendor candidate search failed:", error);
  process.exit(1);
});