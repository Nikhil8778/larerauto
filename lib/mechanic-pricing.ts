export function applyMechanicDiscount(
  itemPriceCents: number,
  discountPct = 10
) {
  const discountCents = Math.round(itemPriceCents * (discountPct / 100));
  const discountedPriceCents = Math.max(0, itemPriceCents - discountCents);

  return {
    originalPriceCents: itemPriceCents,
    discountPct,
    discountCents,
    discountedPriceCents,
  };
}

export function applyReferralDiscount(
  itemPriceCents: number,
  discountPct = 2
) {
  const discountCents = Math.round(itemPriceCents * (discountPct / 100));
  const discountedPriceCents = Math.max(0, itemPriceCents - discountCents);

  return {
    originalPriceCents: itemPriceCents,
    discountPct,
    discountCents,
    discountedPriceCents,
  };
}

export function calculateMechanicCredit(
  itemPriceCents: number,
  creditPct = 2
) {
  return Math.round(itemPriceCents * (creditPct / 100));
}