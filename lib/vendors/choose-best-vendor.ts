type VendorOption = {
  vendor: "amazon" | "apremium";
  priceCents: number | null;
  productUrl: string;
  score?: number;
};

type ChooseBestVendorResult = {
  chosenVendor: "amazon" | "apremium" | null;
  referencePriceCents: number | null;
  chosenUrl: string | null;
};

export function chooseBestVendor(options: VendorOption[]): ChooseBestVendorResult {
  const valid = options.filter((x) => x.priceCents !== null);

  if (valid.length === 0) {
    return {
      chosenVendor: null,
      referencePriceCents: null,
      chosenUrl: null,
    };
  }

  valid.sort((a, b) => {
    const priceDiff = (a.priceCents ?? Infinity) - (b.priceCents ?? Infinity);
    if (priceDiff !== 0) return priceDiff;

    return (b.score ?? 0) - (a.score ?? 0);
  });

  const best = valid[0];

  return {
    chosenVendor: best.vendor,
    referencePriceCents: best.priceCents,
    chosenUrl: best.productUrl,
  };
}