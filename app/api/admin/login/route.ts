import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createAdminSession,
  getAdminSessionCookieName,
  verifyPassword,
} from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const admin = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (!admin || !admin.isActive) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, admin.passwordHash);

    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const session = await createAdminSession(admin.id);

    const res = NextResponse.json({ ok: true });

    res.cookies.set({
      name: getAdminSessionCookieName(),
      value: session.token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires: session.expiresAt,
      path: "/",
    });

    return res;
  } catch (error) {
    console.error("admin login error", error);
    return NextResponse.json(
      { error: "Unable to login." },
      { status: 500 }
    );
  }
}