import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { offerId, inventoryQty, sellPriceCents } = body;

    if (!offerId) {
      return NextResponse.json({ error: "Missing offerId" }, { status: 400 });
    }

    const updated = await prisma.offer.update({
      where: { id: offerId },
      data: {
        inventoryQty,
        sellPriceCents,
      },
    });

    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error("update offer error", error);

    return NextResponse.json(
      { error: "Failed to update offer" },
      { status: 500 }
    );
  }
}