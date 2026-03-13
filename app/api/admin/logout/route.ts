import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  deleteAdminSession,
  getAdminSessionCookieName,
} from "@/lib/auth";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getAdminSessionCookieName())?.value;

    if (token) {
      await deleteAdminSession(token);
    }

    const res = NextResponse.json({ ok: true });

    res.cookies.set({
      name: getAdminSessionCookieName(),
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires: new Date(0),
      path: "/",
    });

    return res;
  } catch (error) {
    console.error("admin logout error", error);
    return NextResponse.json(
      { error: "Unable to logout." },
      { status: 500 }
    );
  }
}