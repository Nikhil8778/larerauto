"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

async function updateLeadStatus(leadId: string, status: string) {
  await prisma.quoteLead.update({
    where: { id: leadId },
    data: {
      status,
    },
  });

  revalidatePath("/admin/quote-leads");
}

async function updateLeadInventory(
  leadId: string,
  inventoryStatus: string,
  inventoryNotes?: string,
  status?: string
) {
  await prisma.quoteLead.update({
    where: { id: leadId },
    data: {
      inventoryStatus,
      inventoryCheckedAt: new Date(),
      inventoryUpdatedAt: new Date(),
      inventoryNotes: inventoryNotes?.trim() || null,
      ...(status ? { status } : {}),
      ...(inventoryStatus === "inventory_confirmed"
        ? { readyToOrderAt: new Date() }
        : {}),
    },
  });

  revalidatePath("/admin/quote-leads");
}

export async function markLeadQuoteViewed(leadId: string) {
  await updateLeadStatus(leadId, "quote_viewed");
}

export async function markLeadCheckoutStarted(leadId: string) {
  await updateLeadStatus(leadId, "checkout_started");
}

export async function markLeadContactCaptured(leadId: string) {
  await updateLeadStatus(leadId, "contact_captured");
}

export async function markLeadOrdered(leadId: string) {
  await updateLeadStatus(leadId, "ordered");
}

export async function markLeadPaid(leadId: string) {
  await updateLeadStatus(leadId, "paid");
}

export async function markLeadAbandoned(leadId: string) {
  await updateLeadStatus(leadId, "abandoned");
}

export async function markLeadInventoryPending(
  leadId: string,
  inventoryNotes?: string
) {
  await updateLeadInventory(
    leadId,
    "inventory_check_pending",
    inventoryNotes || "Inventory availability is being verified.",
    "contact_captured"
  );
}

export async function markLeadInventoryConfirmed(
  leadId: string,
  inventoryNotes?: string
) {
  await updateLeadInventory(
    leadId,
    "inventory_confirmed",
    inventoryNotes || "Requested item is available and ready for order.",
    "ready_to_order"
  );
}

export async function markLeadInventoryUnavailable(
  leadId: string,
  inventoryNotes?: string
) {
  await updateLeadInventory(
    leadId,
    "inventory_unavailable",
    inventoryNotes || "Requested item is currently unavailable.",
    "inventory_unavailable"
  );
}

export async function markLeadAlternateOffered(
  leadId: string,
  inventoryNotes?: string
) {
  await updateLeadInventory(
    leadId,
    "alternate_offered",
    inventoryNotes || "Alternate option is being reviewed for this request.",
    "alternate_offered"
  );
}

export async function markLeadCheckoutLinkSent(leadId: string) {
  const lead = await prisma.quoteLead.findUnique({
    where: { id: leadId },
    select: {
      preferredReplyChannel: true,
    },
  });

  await prisma.quoteLead.update({
    where: { id: leadId },
    data: {
      checkoutLinkSentAt: new Date(),
      lastOutboundChannel: lead?.preferredReplyChannel || "email",
    },
  });

  revalidatePath("/admin/quote-leads");
}