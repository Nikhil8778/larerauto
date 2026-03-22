import { NextResponse } from "next/server";
import { clearMechanicSession } from "@/lib/mechanic-auth";

export async function POST() {
  try {
    await clearMechanicSession();

    return NextResponse.json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("POST /api/mechanic/logout error:", error);

    return NextResponse.json(
      { success: false, message: "Logout failed." },
      { status: 500 }
    );
  }
}