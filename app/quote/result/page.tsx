import ResultClient from "./ResultClient";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function QuoteResultPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const partType = String(sp.partType ?? "");
  const year = String(sp.year ?? "");
  const make = String(sp.make ?? "");
  const model = String(sp.model ?? "");
  const vin = String(sp.vin ?? "");

  const query = { partType, year, make, model, vin };

  let offer: any = null;

  if (partType && year && make && model) {
    const h = await headers();
    const host = h.get("host") || "localhost:3000";
    const proto = h.get("x-forwarded-proto") ?? "http";

    const url = new URL(`/api/offers`, `${proto}://${host}`);
    url.searchParams.set("partType", partType);
    url.searchParams.set("year", year);
    url.searchParams.set("make", make);
    url.searchParams.set("model", model);
    url.searchParams.set("vin", vin);

    const res = await fetch(url, { cache: "no-store" });

    if (res.ok) {
      const data = await res.json();

      offer = {
        offerId: data.quoteId,
        partType: data.product?.partType ?? partType,
        title: data.product?.title ?? partType,
        description: data.product?.description ?? "",
        imageUrl: data.product?.imageUrl ?? "",
        stockQty: data.availability?.qty ?? 0,
        itemPrice: (data.pricing?.itemPriceCents ?? 0) / 100,
      };
    }
  }

  return <ResultClient query={query} offer={offer} />;
}