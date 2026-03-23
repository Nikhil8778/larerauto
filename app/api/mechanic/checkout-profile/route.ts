import { NextResponse } from "next/server";
import { getCurrentMechanic } from "@/lib/mechanic-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const mechanic = await getCurrentMechanic();

    if (!mechanic) {
      return NextResponse.json(
        { success: false, message: "Not authenticated." },
        { status: 401 }
      );
    }

    const customerMatch = await prisma.customer.findFirst({
      where: {
        email: mechanic.email,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      profile: {
        contactName: mechanic.contactName || "",
        email: mechanic.email || "",
        phone: mechanic.phone || "",
        companyName: mechanic.shopName || "",
        addressLine1: customerMatch?.addressLine1 || "",
        addressLine2: customerMatch?.addressLine2 || "",
        city: customerMatch?.city || "",
        province: customerMatch?.province || "Ontario",
        postalCode: customerMatch?.postalCode || "",
        country: customerMatch?.country || "Canada",
      },
    });
  } catch (error) {
    console.error("GET /api/mechanic/checkout-profile error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load mechanic checkout profile." },
      { status: 500 }
    );
  }
}