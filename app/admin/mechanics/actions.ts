"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function approveMechanic(mechanicId: string) {
  await prisma.mechanic.update({
    where: { id: mechanicId },
    data: {
      isApproved: true,
      isActive: true,
    },
  });

  revalidatePath("/admin/mechanics");
}

export async function deactivateMechanic(mechanicId: string) {
  await prisma.mechanic.update({
    where: { id: mechanicId },
    data: {
      isActive: false,
    },
  });

  revalidatePath("/admin/mechanics");
}

export async function activateMechanic(mechanicId: string) {
  await prisma.mechanic.update({
    where: { id: mechanicId },
    data: {
      isActive: true,
    },
  });

  revalidatePath("/admin/mechanics");
}

export async function markMechanicCommissionsPaid(
  mechanicId: string,
  payoutNote?: string
) {
  const pendingCommissions = await prisma.mechanicCommission.findMany({
    where: {
      mechanicId,
      status: "pending",
    },
    select: {
      id: true,
      amountCents: true,
    },
  });

  if (pendingCommissions.length === 0) {
    revalidatePath("/admin/mechanics");
    return;
  }

  const totalPaidCents = pendingCommissions.reduce(
    (sum, item) => sum + item.amountCents,
    0
  );

  const paidAt = new Date();

  await prisma.mechanicCommission.updateMany({
    where: {
      mechanicId,
      status: "pending",
    },
    data: {
      status: "paid",
      paidAt,
      payoutNote: payoutNote?.trim() || "Weekly Interac payout",
    },
  });

  await prisma.mechanic.update({
    where: { id: mechanicId },
    data: {
      creditBalanceCents: {
        decrement: totalPaidCents,
      },
    },
  });

  revalidatePath("/admin/mechanics");
}