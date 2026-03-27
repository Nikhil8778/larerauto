"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function updateOutreachMessageStatus(
  messageId: string,
  status: string
) {
  const normalized = String(status || "").trim().toLowerCase();

  const allowed = ["pending", "sent", "failed", "replied"];
  if (!allowed.includes(normalized)) {
    throw new Error("Invalid message status.");
  }

  await prisma.outreachMessage.update({
    where: { id: messageId },
    data: {
      sendStatus: normalized,
      sentAt: normalized === "sent" ? new Date() : undefined,
      repliedAt: normalized === "replied" ? new Date() : undefined,
    },
  });

  revalidatePath("/admin/outreach/history");
}