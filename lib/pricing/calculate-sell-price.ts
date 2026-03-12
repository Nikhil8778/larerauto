export function calculateSellPrice(referencePriceCents: number | null) {
  if (referencePriceCents === null) return null;

  const twoPercent = Math.round(referencePriceCents * 0.02);
  const deduction = Math.min(1000, twoPercent); // $10 = 1000 cents
  const sellPriceCents = Math.max(referencePriceCents - deduction, 0);

  return {
    referencePriceCents,
    deductionCents: deduction,
    sellPriceCents,
  };
}