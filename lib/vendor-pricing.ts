export function calculateWebsitePriceFromVendors(
  amazonPriceCents: number | null,
  aPremiumPriceCents: number | null
) {
  const candidates = [amazonPriceCents, aPremiumPriceCents].filter(
    (v): v is number => typeof v === "number" && Number.isFinite(v)
  );

  if (candidates.length === 0) {
    return {
      referencePriceCents: null,
      discountCents: null,
      sellPriceCents: null,
    };
  }

  const referencePriceCents = Math.min(...candidates);
  const discountCents = Math.min(1000, Math.round(referencePriceCents * 0.02));
  const sellPriceCents = referencePriceCents - discountCents;

  return {
    referencePriceCents,
    discountCents,
    sellPriceCents,
  };
}