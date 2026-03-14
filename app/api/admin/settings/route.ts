import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let settings = await prisma.businessSetting.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!settings) {
    settings = await prisma.businessSetting.create({
      data: {},
    });
  }

  return NextResponse.json({ settings });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    let settings = await prisma.businessSetting.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (!settings) {
      settings = await prisma.businessSetting.create({
        data: {},
      });
    }

    const updated = await prisma.businessSetting.update({
      where: { id: settings.id },
      data: {
        businessName: body.businessName ?? settings.businessName,
        businessEmail: body.businessEmail ?? null,
        businessPhone: body.businessPhone ?? null,
        whatsappNumber: body.whatsappNumber ?? null,
        instagramHandle: body.instagramHandle ?? null,
        facebookPage: body.facebookPage ?? null,
        invoicePrefix: body.invoicePrefix ?? settings.invoicePrefix,
        quotePrefix: body.quotePrefix ?? settings.quotePrefix,
        defaultTaxPercent:
          body.defaultTaxPercent !== undefined
            ? Number(body.defaultTaxPercent)
            : settings.defaultTaxPercent,
        currency: body.currency ?? settings.currency,
        afterHoursReply: body.afterHoursReply ?? null,
        welcomeReply: body.welcomeReply ?? null,
        invoiceReminderReply: body.invoiceReminderReply ?? null,
      },
    });

    return NextResponse.json({ ok: true, settings: updated });
  } catch (error) {
    console.error("settings save error", error);
    return NextResponse.json({ error: "Unable to save settings." }, { status: 500 });
  }
}