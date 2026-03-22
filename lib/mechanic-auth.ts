import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const MECHANIC_SESSION_COOKIE = "mechanic_session";

export async function hashMechanicPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyMechanicPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createMechanicSession(mechanicId: string) {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

  await prisma.mechanicSession.create({
    data: {
      token,
      mechanicId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(MECHANIC_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function clearMechanicSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(MECHANIC_SESSION_COOKIE)?.value;

  if (token) {
    await prisma.mechanicSession.deleteMany({
      where: { token },
    });
  }

  cookieStore.set(MECHANIC_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}

export async function getCurrentMechanic() {
  const cookieStore = await cookies();
  const token = cookieStore.get(MECHANIC_SESSION_COOKIE)?.value;

  if (!token) return null;

  const session = await prisma.mechanicSession.findUnique({
    where: { token },
    include: {
      mechanic: true,
    },
  });

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await prisma.mechanicSession.delete({
      where: { token },
    });
    return null;
  }

  if (!session.mechanic.isActive) return null;

  return session.mechanic;
}