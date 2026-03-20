import { syncOfferPrices } from "@/lib/vendors/sync-offer-prices";

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
  const onlyPendingArg = getArg("onlyPending");

  const options = {
    take: takeArg ? Number(takeArg) : undefined,
    make: makeArg,
    model: modelArg,
    partType: partTypeArg,
    onlyPending: onlyPendingArg ? onlyPendingArg === "true" : true,
  };

  console.log("Running sync-offer-prices with options:", options);

  await syncOfferPrices(options);
}

main().catch((err) => {
  console.error("sync-offer-prices failed:", err);
  process.exit(1);
});