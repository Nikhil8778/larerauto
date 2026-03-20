import { findAndStoreVendorCandidates } from "@/lib/vendors/candidate-finder";

function getArg(name: string) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

async function main() {
  const takeArg = getArg("take");
  const makeArg = getArg("make");
  const modelArg = getArg("model");
  const partTypeArg = getArg("partType");
  const onlyUnsyncedArg = getArg("onlyUnsynced");

  const options = {
    take: takeArg ? Number(takeArg) : undefined,
    make: makeArg,
    model: modelArg,
    partType: partTypeArg,
    onlyUnsynced: onlyUnsyncedArg ? onlyUnsyncedArg === "true" : true,
  };

  console.log("Finding Amazon vendor candidates with options:", options);

  await findAndStoreVendorCandidates(options);

  console.log("Amazon vendor candidate search complete.");
}

main().catch((error) => {
  console.error("Vendor candidate search failed:", error);
  process.exit(1);
});