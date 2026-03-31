import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  inferCustomerType,
  inferLastInboundChannel,
  inferPreferredReplyChannel,
} from "@/lib/channel-routing";

function emptyToNull(value: unknown) {
  const str = String(value ?? "").trim();
  return str ? str : null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const quoteId = emptyToNull(body.quoteId);
    const offerId = emptyToNull(body.offerId);

    const fullName = String(body.fullName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim();
    const whatsappNumber = String(body.whatsappNumber ?? "").trim();

    const addressLine1 = String(body.addressLine1 ?? "").trim();
    const addressLine2 = String(body.addressLine2 ?? "").trim();
    const city = String(body.city ?? "").trim();
    const province = String(body.province ?? "").trim();
    const postalCode = String(body.postalCode ?? "").trim().toUpperCase();
    const country = String(body.country ?? "Canada").trim();

    const year = body.year ? Number(body.year) : null;
    const make = emptyToNull(body.make);
    const model = emptyToNull(body.model);
    const engine = emptyToNull(body.engine);
    const partType = emptyToNull(body.partType);
    const vin = emptyToNull(body.vin);
    const itemPriceCents = Number(body.itemPriceCents ?? 0);

    const utmSource = emptyToNull(body.utmSource);
    const utmMedium = emptyToNull(body.utmMedium);
    const utmCampaign = emptyToNull(body.utmCampaign);
    const sourceChannel = emptyToNull(body.sourceChannel);
    const status = emptyToNull(body.status) || "quote_viewed";

    const preferredReplyChannel = inferPreferredReplyChannel(sourceChannel);
    const customerType = inferCustomerType(sourceChannel);
    const lastInboundChannel = inferLastInboundChannel(sourceChannel);

    const [firstName, ...rest] = fullName.split(" ");
    const lastName = rest.join(" ").trim() || null;

    let existingLead = null;

    if (email) {
      existingLead = await prisma.quoteLead.findFirst({
        where: { email },
        orderBy: { updatedAt: "desc" },
      });
    }

    if (!existingLead && phone) {
      existingLead = await prisma.quoteLead.findFirst({
        where: { phone },
        orderBy: { updatedAt: "desc" },
      });
    }

    if (!existingLead && quoteId) {
      existingLead = await prisma.quoteLead.findFirst({
        where: { quoteId },
        orderBy: { updatedAt: "desc" },
      });
    }

    const data = {
      quoteId,
      offerId,
      firstName: firstName || null,
      lastName,
      email: email || null,
      phone: phone || null,
      whatsappNumber: whatsappNumber || null,
      addressLine1: addressLine1 || null,
      addressLine2: addressLine2 || null,
      city: city || null,
      province: province || null,
      postalCode: postalCode || null,
      country: country || "Canada",
      year: Number.isFinite(year) ? year : null,
      make,
      model,
      engine,
      partType,
      vin,
      itemPriceCents: Number.isFinite(itemPriceCents) ? itemPriceCents : 0,
      utmSource,
      utmMedium,
      utmCampaign,
      sourceChannel,
      status,
      preferredReplyChannel,
      customerType,
      lastInboundChannel,
      quoteLinkSentAt:
        status === "quote_viewed" || status === "contact_captured"
          ? new Date()
          : undefined,
    };

    const lead = existingLead
      ? await prisma.quoteLead.update({
          where: { id: existingLead.id },
          data,
        })
      : await prisma.quoteLead.create({ data });

    return NextResponse.json({
      ok: true,
      leadId: lead.id,
    });
  } catch (error) {
    console.error("quote lead save error", error);
    return NextResponse.json(
      { error: "Unable to save lead." },
      { status: 500 }
    );
  }
}