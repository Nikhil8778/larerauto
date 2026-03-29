"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentMechanic } from "@/lib/mechanic-auth";

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "LA";
  for (let i = 0; i < 6; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

async function generateUniqueCode() {
  for (let i = 0; i < 10; i += 1) {
    const code = makeCode();
    const existing = await prisma.mechanicReferralCode.findUnique({
      where: { code },
      select: { id: true },
    });
    if (!existing) return code;
  }
  throw new Error("Unable to generate unique referral code.");
}

export async function generateMechanicReferralCode() {
  const mechanic = await getCurrentMechanic();

  if (!mechanic) {
    throw new Error("Not authenticated.");
  }

  if (!mechanic.isApproved || !mechanic.isActive) {
    throw new Error("Only approved active mechanics can generate referral codes.");
  }

  const code = await generateUniqueCode();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.mechanicReferralCode.create({
    data: {
      mechanicId: mechanic.id,
      code,
      isActive: true,
      expiresAt,
      usageLimit: 1,
      usedCount: 0,
      customerDiscountPct: mechanic.referralDiscountPct ?? 2,
    },
  });

  revalidatePath("/mechanic-dashboard");
}

export async function deactivateReferralCode(codeId: string) {
  const mechanic = await getCurrentMechanic();

  if (!mechanic) {
    throw new Error("Not authenticated.");
  }

  const code = await prisma.mechanicReferralCode.findUnique({
    where: { id: codeId },
    select: {
      id: true,
      mechanicId: true,
      isActive: true,
    },
  });

  if (!code || code.mechanicId !== mechanic.id) {
    throw new Error("Referral code not found.");
  }

  if (!code.isActive) {
    revalidatePath("/mechanic-dashboard");
    return;
  }

  await prisma.mechanicReferralCode.update({
    where: { id: codeId },
    data: {
      isActive: false,
    },
  });

  revalidatePath("/mechanic-dashboard");
}