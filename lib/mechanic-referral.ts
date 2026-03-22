import { prisma } from "@/lib/prisma";

function randomCodePart(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function generateReferralCode(mechanicId: string) {
  const shortId = mechanicId.slice(-4).toUpperCase();
  return `LA-${shortId}-${randomCodePart(6)}`;
}

export async function createReferralCodeForMechanic(mechanicId: string) {
  let code = generateReferralCode(mechanicId);

  for (let i = 0; i < 5; i += 1) {
    const exists = await prisma.mechanicReferralCode.findUnique({
      where: { code },
    });

    if (!exists) break;
    code = generateReferralCode(mechanicId);
  }

  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  return prisma.mechanicReferralCode.create({
    data: {
      mechanicId,
      code,
      expiresAt,
      usageLimit: 1,
      customerDiscountPct: 2,
    },
  });
}

export async function validateReferralCode(code: string) {
  const normalized = code.trim().toUpperCase();

  const referral = await prisma.mechanicReferralCode.findUnique({
    where: { code: normalized },
    include: {
      mechanic: true,
    },
  });

  if (!referral) {
    return {
      valid: false,
      message: "Invalid referral code.",
    };
  }

  if (!referral.isActive) {
    return {
      valid: false,
      message: "This referral code is inactive.",
    };
  }

  if (!referral.mechanic.isActive || !referral.mechanic.isApproved) {
    return {
      valid: false,
      message: "This referral code is not eligible.",
    };
  }

  if (referral.expiresAt && referral.expiresAt < new Date()) {
    return {
      valid: false,
      message: "This referral code has expired.",
    };
  }

  if (
    typeof referral.usageLimit === "number" &&
    referral.usedCount >= referral.usageLimit
  ) {
    return {
      valid: false,
      message: "This referral code has already been used.",
    };
  }

  return {
    valid: true,
    referral,
  };
}