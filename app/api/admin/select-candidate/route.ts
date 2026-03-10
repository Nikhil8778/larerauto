import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const { candidateId } = body;

  const candidate = await prisma.vendorCandidate.findUnique({
    where: { id: candidateId },
  });

  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  const offerId = candidate.offerId;

  if (candidate.vendor === "amazon") {
    await prisma.offer.update({
      where: { id: offerId },
      data: {
        amazonUrl: candidate.productUrl,
        amazonPriceCents: candidate.priceCents ?? null,
        referencePriceCents: candidate.priceCents ?? null,
      },
    });
  }

  if (candidate.vendor === "apremium") {
    await prisma.offer.update({
      where: { id: offerId },
      data: {
        aPremiumUrl: candidate.productUrl,
        aPremiumPriceCents: candidate.priceCents ?? null,
        referencePriceCents: candidate.priceCents ?? null,
      },
    });
  }
  await prisma.vendorCandidate.updateMany({
  where: {
    offerId: candidate.offerId
  },
  data: {
    selected: false
  }
});
  await prisma.vendorCandidate.update({
    where: { id: candidateId },
    data: {
      selected: true,
    },
  });

  return NextResponse.json({ success: true });
}