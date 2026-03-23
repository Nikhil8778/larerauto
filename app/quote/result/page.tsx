import ResultClient from "./ResultClient";

type SearchParams = Promise<{
  year?: string;
  make?: string;
  model?: string;
  engine?: string;
  partType?: string;
  vin?: string;
}>;

export default async function QuoteResultPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  const year = sp.year ?? "";
  const make = sp.make ?? "";
  const model = sp.model ?? "";
  const engine = sp.engine ?? "";
  const partType = sp.partType ?? "";
  const vin = sp.vin ?? "";

  const qs = new URLSearchParams({
    year,
    make,
    model,
    engine,
    partType,
    vin,
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  let bestOffer = null;

  try {
    const res = await fetch(`${baseUrl}/api/offers?${qs.toString()}`, {
      cache: "no-store",
    });

    const data = await res.json();

    if (data && data.product) {
      const itemPriceCents = data.pricing?.itemPriceCents ?? 0;

      bestOffer = {
        offerId: data.offerId ?? data.quoteId ?? "",
        partType: data.product.partType,
        title: data.product.title,
        description: data.product.description ?? "",
        imageUrl: data.product.imageUrl ?? "",
        stockQty: data.availability?.qty ?? 0,
        itemPrice: itemPriceCents / 100,
        itemPriceCents,
        currency: data.pricing?.currency ?? "CAD",
      };
    }
  } catch (error) {
    console.error("Quote fetch error:", error);
  }

  return <ResultClient bestOffer={bestOffer} />;
}