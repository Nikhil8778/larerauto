import { NextResponse } from "next/server";
import { getCurrentMechanic } from "@/lib/mechanic-auth";
import { getMechanicDashboardStats } from "@/lib/mechanic-reporting";

export async function GET() {
  try {
    const mechanic = await getCurrentMechanic();

    if (!mechanic) {
      return NextResponse.json(
        { success: false, message: "Not authenticated." },
        { status: 401 }
      );
    }

    const stats = await getMechanicDashboardStats(mechanic.id);

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("GET /api/mechanic/dashboard-stats error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch dashboard stats." },
      { status: 500 }
    );
  }
}