import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const ADMIN_SESSION_COOKIE = "lare_admin_session";
const ADMIN_SESSION_DAYS = 7;

export function getAdminSessionCookieName() {
  return ADMIN_SESSION_COOKIE;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function createAdminSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function getAdminSessionExpiryDate() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + ADMIN_SESSION_DAYS);
  return expiresAt;
}

export async function createAdminSession(adminUserId: string) {
  const token = createAdminSessionToken();
  const expiresAt = getAdminSessionExpiryDate();

  await prisma.adminSession.create({
    data: {
      token,
      adminUserId,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function deleteAdminSession(token: string) {
  await prisma.adminSession.deleteMany({
    where: { token },
  });
}

export async function getCurrentAdminUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) return null;

  const session = await prisma.adminSession.findUnique({
    where: { token },
    include: { adminUser: true },
  });

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await prisma.adminSession.delete({
      where: { token },
    });
    return null;
  }

  if (!session.adminUser.isActive) {
    return null;
  }

  return session.adminUser;
}