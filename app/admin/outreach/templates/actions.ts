"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { sendEmailMessage } from "@/lib/outreach/send-email";
import { sendSmsMessage } from "@/lib/outreach/send-sms";
import { sendWhatsAppMessage } from "@/lib/outreach/send-whatsapp";

function emptyToNull(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  return str ? str : null;
}

function applyTemplateVars(
  body: string,
  params: {
    shopName?: string | null;
    contactName?: string | null;
    city?: string | null;
    phone?: string | null;
    email?: string | null;
  }
) {
  return body
    .replaceAll("{{shopName}}", params.shopName || "")
    .replaceAll("{{contactName}}", params.contactName || "")
    .replaceAll("{{city}}", params.city || "")
    .replaceAll("{{phone}}", params.phone || "")
    .replaceAll("{{email}}", params.email || "");
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
      mediaUrl: emptyToNull(formData.get("mediaUrl")),
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

export async function sendTestTemplate(formData: FormData) {
  const templateId = String(formData.get("templateId") ?? "").trim();
  const recipientPhone = emptyToNull(formData.get("recipientPhone"));
  const recipientEmail = emptyToNull(formData.get("recipientEmail"));
  const shopName = emptyToNull(formData.get("shopName"));
  const contactName = emptyToNull(formData.get("contactName"));
  const city = emptyToNull(formData.get("city"));

  if (!templateId) {
    throw new Error("Template ID is required.");
  }

  const template = await prisma.messageTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    throw new Error("Template not found.");
  }

  const body = applyTemplateVars(template.body, {
    shopName,
    contactName,
    city,
    phone: recipientPhone,
    email: recipientEmail,
  });

  if (template.channel === "whatsapp") {
    if (!recipientPhone) {
      throw new Error("Recipient phone is required for WhatsApp test.");
    }

    const result = await sendWhatsAppMessage({
      recipientPhone,
      recipientEmail,
      body,
      subject: template.subject || undefined,
      mediaUrl: template.mediaUrl || undefined,
    });

    if (!result.success) {
      throw new Error(result.error || "WhatsApp test failed.");
    }
  } else if (template.channel === "sms") {
    if (!recipientPhone) {
      throw new Error("Recipient phone is required for SMS test.");
    }

    const result = await sendSmsMessage({
      recipientPhone,
      recipientEmail,
      body,
      subject: template.subject || undefined,
      mediaUrl: template.mediaUrl || undefined,
    });

    if (!result.success) {
      throw new Error(result.error || "SMS test failed.");
    }
  } else if (template.channel === "email") {
    if (!recipientEmail) {
      throw new Error("Recipient email is required for email test.");
    }

    const result = await sendEmailMessage({
      recipientPhone,
      recipientEmail,
      body,
      subject: template.subject || "Test Template",
      mediaUrl: template.mediaUrl || undefined,
    });

    if (!result.success) {
      throw new Error(result.error || "Email test failed.");
    }
  } else {
    throw new Error("Unsupported template channel.");
  }

  revalidatePath("/admin/outreach/templates");
}