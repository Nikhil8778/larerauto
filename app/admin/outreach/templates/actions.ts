"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function emptyToNull(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  return str ? str : null;
}

export async function createMessageTemplate(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const channel = String(formData.get("channel") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!name) {
    throw new Error("Template name is required.");
  }

  if (!channel) {
    throw new Error("Channel is required.");
  }

  if (!body) {
    throw new Error("Template body is required.");
  }

  await prisma.messageTemplate.create({
    data: {
      name,
      channel,
      audience: emptyToNull(formData.get("audience")),
      subject: emptyToNull(formData.get("subject")),
      body,
      isActive: String(formData.get("isActive") ?? "true") === "true",
    },
  });

  revalidatePath("/admin/outreach/templates");
}

export async function deleteMessageTemplate(id: string) {
  await prisma.messageTemplate.delete({
    where: { id },
  });

  revalidatePath("/admin/outreach/templates");
}

export async function toggleMessageTemplate(id: string, isActive: boolean) {
  await prisma.messageTemplate.update({
    where: { id },
    data: { isActive },
  });

  revalidatePath("/admin/outreach/templates");
}