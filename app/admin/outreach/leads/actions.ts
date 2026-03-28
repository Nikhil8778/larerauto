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

function numberOrNull(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  if (!str) return null;
  const n = Number(str);
  return Number.isFinite(n) ? n : null;
}

function dateOrNull(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  if (!str) return null;
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function createWorkshopLead(formData: FormData) {
  const shopName = String(formData.get("shopName") ?? "").trim();

  if (!shopName) {
    throw new Error("Shop name is required.");
  }

  await prisma.workshopLead.create({
    data: {
      shopName,
      contactName: emptyToNull(formData.get("contactName")),
      phone: emptyToNull(formData.get("phone")),
      whatsappNumber: emptyToNull(formData.get("whatsappNumber")),
      email: emptyToNull(formData.get("email")),
      website: emptyToNull(formData.get("website")),
      addressLine1: emptyToNull(formData.get("addressLine1")),
      city: emptyToNull(formData.get("city")),
      province: emptyToNull(formData.get("province")) || "Ontario",
      postalCode: emptyToNull(formData.get("postalCode")),
      googleMapsUrl: emptyToNull(formData.get("googleMapsUrl")),
      category: emptyToNull(formData.get("category")),
      rating: numberOrNull(formData.get("rating")),
      reviewCount: numberOrNull(formData.get("reviewCount")),
      source: emptyToNull(formData.get("source")) || "manual",
      status: emptyToNull(formData.get("status")) || "new",
      notes: emptyToNull(formData.get("notes")),
      scrapedAt: null,
    },
  });

  revalidatePath("/admin/outreach/leads");
}

export async function deleteWorkshopLead(id: string) {
  await prisma.workshopLead.delete({
    where: { id },
  });

  revalidatePath("/admin/outreach/leads");
}

export async function updateWorkshopLeadStatus(id: string, status: string) {
  await prisma.workshopLead.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/admin/outreach/leads");
  revalidatePath(`/admin/outreach/leads/${id}`);
}

export async function sendLeadManualReply(formData: FormData) {
  const leadId = String(formData.get("leadId") ?? "").trim();
  const channel = String(formData.get("channel") ?? "").trim();
  const subject = emptyToNull(formData.get("subject"));
  const body = String(formData.get("body") ?? "").trim();
  const mediaUrl = emptyToNull(formData.get("mediaUrl"));

  if (!leadId) {
    throw new Error("Lead ID is required.");
  }

  if (!channel) {
    throw new Error("Channel is required.");
  }

  if (!body) {
    throw new Error("Reply message is required.");
  }

  const lead = await prisma.workshopLead.findUnique({
    where: { id: leadId },
  });

  if (!lead) {
    throw new Error("Lead not found.");
  }

  const recipientPhone = lead.whatsappNumber || lead.phone || null;
  const recipientEmail = lead.email || null;

  let result:
    | { success: true; providerMessageId?: string | null }
    | { success: false; error?: string | null };

  if (channel === "whatsapp") {
    if (!recipientPhone) {
      throw new Error("This lead does not have WhatsApp/phone number.");
    }

    result = await sendWhatsAppMessage({
      recipientPhone,
      recipientEmail,
      body,
      subject: subject || undefined,
      mediaUrl: mediaUrl || undefined,
    });
  } else if (channel === "sms") {
    if (!recipientPhone) {
      throw new Error("This lead does not have phone number.");
    }

    result = await sendSmsMessage({
      recipientPhone,
      recipientEmail,
      body,
      subject: subject || undefined,
      mediaUrl: mediaUrl || undefined,
    });
  } else if (channel === "email") {
    if (!recipientEmail) {
      throw new Error("This lead does not have email address.");
    }

    result = await sendEmailMessage({
      recipientPhone,
      recipientEmail,
      body,
      subject: subject || "LareAuto Reply",
      mediaUrl: mediaUrl || undefined,
    });
  } else {
    throw new Error("Unsupported channel.");
  }

  const latestCampaign = await prisma.outreachMessage.findFirst({
    where: { workshopLeadId: lead.id },
    orderBy: { createdAt: "desc" },
    select: { campaignId: true },
  });

  if (!latestCampaign?.campaignId) {
    throw new Error("No existing campaign found for this lead. Send from a campaign first.");
  }

  const createdMessage = await prisma.outreachMessage.create({
    data: {
      campaignId: latestCampaign.campaignId,
      workshopLeadId: lead.id,
      channel,
      recipientName: lead.contactName || lead.shopName,
      recipientPhone,
      recipientEmail,
      bodySnapshot: body,
      mediaUrl,
      sendStatus: result.success ? "sent" : "failed",
      providerMessageId: result.success ? result.providerMessageId || null : null,
      errorMessage: result.success ? null : result.error || "Manual reply failed.",
      sentAt: result.success ? new Date() : null,
    },
  });

  const existingSession = await prisma.outreachReplySession.findUnique({
    where: { workshopLeadId: lead.id },
  });

  if (existingSession) {
    await prisma.outreachReplySession.update({
      where: { id: existingSession.id },
      data: {
        channel,
        lastOutboundId: createdMessage.id,
        lastOutboundAt: new Date(),
      },
    });
  }

  if (lead.status !== "converted") {
    await prisma.workshopLead.update({
      where: { id: lead.id },
      data: {
        status: "contacted",
      },
    });
  }

  revalidatePath("/admin/outreach/leads");
  revalidatePath(`/admin/outreach/leads/${lead.id}`);
  revalidatePath("/admin/outreach/history");
}

export async function createLeadFollowUp(formData: FormData) {
  const leadId = String(formData.get("leadId") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const followUpAt = dateOrNull(formData.get("followUpAt"));
  const status = emptyToNull(formData.get("status")) || "open";

  if (!leadId) {
    throw new Error("Lead ID is required.");
  }

  if (!note) {
    throw new Error("Follow-up note is required.");
  }

  await prisma.outreachLeadFollowUp.create({
    data: {
      workshopLeadId: leadId,
      note,
      followUpAt,
      status,
    },
  });

  revalidatePath(`/admin/outreach/leads/${leadId}`);
  revalidatePath("/admin/outreach/leads");
}

export async function updateLeadFollowUpStatus(
  followUpId: string,
  leadId: string,
  status: string
) {
  await prisma.outreachLeadFollowUp.update({
    where: { id: followUpId },
    data: { status },
  });

  revalidatePath(`/admin/outreach/leads/${leadId}`);
  revalidatePath("/admin/outreach/leads");
}

export async function deleteLeadFollowUp(followUpId: string, leadId: string) {
  await prisma.outreachLeadFollowUp.delete({
    where: { id: followUpId },
  });

  revalidatePath(`/admin/outreach/leads/${leadId}`);
  revalidatePath("/admin/outreach/leads");
}