import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const mechanics = await prisma.mechanic.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        referralCodes: true,
        directOrders: true,
        referredOrders: true,
      },
    });

    const rows = mechanics.map((m) => ({
      id: m.id,
      shopName: m.shopName,
      contactName: m.contactName,
      email: m.email,
      phone: m.phone,
      isApproved: m.isApproved,
      isActive: m.isActive,
      tradeDiscountPct: m.tradeDiscountPct,
      referralDiscountPct: m.referralDiscountPct,
      directOrdersCount: m.directOrders.length,
      referredOrdersCount: m.referredOrders.length,
      directSpendCents: m.directOrders.reduce((a, b) => a + b.totalCents, 0),
      referralSalesCents: m.referredOrders.reduce((a, b) => a + b.totalCents, 0),
      referralCreditCents: m.referredOrders.reduce(
        (a, b) => a + b.mechanicCreditCents,
        0
      ),
      referralCodesCount: m.referralCodes.length,
      createdAt: m.createdAt,
    }));

    return NextResponse.json({
      success: true,
      mechanics: rows,
    });
  } catch (error) {
    console.error("GET /api/admin/mechanics error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch mechanics." },
      { status: 500 }
    );
  }
}