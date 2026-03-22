import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashMechanicPassword } from "@/lib/mechanic-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const shopName = String(body.shopName || "").trim();
    const contactName = String(body.contactName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone || "").trim();
    const password = String(body.password || "");

    if (!shopName || !contactName || !email || !password) {
      return NextResponse.json(
        { success: false, message: "All required fields must be filled." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const existing = await prisma.mechanic.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "This email is already registered." },
        { status: 409 }
      );
    }

    const passwordHash = await hashMechanicPassword(password);

    await prisma.mechanic.create({
      data: {
        shopName,
        contactName,
        email,
        phone: phone || null,
        passwordHash,
        isApproved: false,
        isActive: true,
        tradeDiscountPct: 10,
        referralDiscountPct: 2,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Signup successful. Your account is pending approval.",
    });
  } catch (error) {
    console.error("POST /api/mechanic/signup error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to create mechanic account." },
      { status: 500 }
    );
  }
}