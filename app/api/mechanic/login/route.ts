import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createMechanicSession,
  verifyMechanicPassword,
} from "@/lib/mechanic-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required." },
        { status: 400 }
      );
    }

    const mechanic = await prisma.mechanic.findUnique({
      where: { email },
    });

    if (!mechanic) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const passwordOk = await verifyMechanicPassword(
      password,
      mechanic.passwordHash
    );

    if (!passwordOk) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (!mechanic.isActive) {
      return NextResponse.json(
        { success: false, message: "This account is inactive." },
        { status: 403 }
      );
    }

    if (!mechanic.isApproved) {
      return NextResponse.json(
        {
          success: false,
          message: "Your account is pending approval by admin.",
        },
        { status: 403 }
      );
    }

    await createMechanicSession(mechanic.id);

    return NextResponse.json({
      success: true,
      message: "Login successful.",
    });
  } catch (error) {
    console.error("POST /api/mechanic/login error:", error);

    return NextResponse.json(
      { success: false, message: "Login failed." },
      { status: 500 }
    );
  }
}