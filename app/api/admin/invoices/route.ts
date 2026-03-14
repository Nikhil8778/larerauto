import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function buildInvoiceNumber() {
  const settings = await prisma.businessSetting.findFirst({
    orderBy: { createdAt: "asc" },
  });

  const prefix = settings?.invoicePrefix || "INV";
  return `${prefix}-${Date.now()}`;
}

export async function GET() {
  const invoices = await prisma.invoice.findMany({
    include: {
      customer: true,
      order: true,
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ invoices });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const customerId = String(body.customerId ?? "");
    const items = Array.isArray(body.items) ? body.items : [];

    if (!customerId || items.length === 0) {
      return NextResponse.json(
        { error: "customerId and at least one invoice item are required." },
        { status: 400 }
      );
    }

    const invoiceNumber = await buildInvoiceNumber();

    const normalizedItems = items.map((item: any) => {
      const quantity = Number(item.quantity ?? 1);
      const unitPriceCents = Number(item.unitPriceCents ?? 0);
      const lineTotalCents = quantity * unitPriceCents;

      return {
        title: String(item.title ?? "").trim(),
        description: item.description ? String(item.description).trim() : null,
        quantity,
        unitPriceCents,
        lineTotalCents,
      };
    });

    const subtotalCents = normalizedItems.reduce(
      (sum: number, item: any) => sum + item.lineTotalCents,
      0
    );

    const taxCents = Number(body.taxCents ?? 0);
    const shippingCents = Number(body.shippingCents ?? 0);
    const discountCents = Number(body.discountCents ?? 0);
    const totalCents = subtotalCents + taxCents + shippingCents - discountCents;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId,
        orderId: body.orderId ?? null,
        status: body.status ?? "draft",
        currency: body.currency ?? "CAD",
        subtotalCents,
        taxCents,
        shippingCents,
        discountCents,
        totalCents,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        notes: body.notes ?? null,
        items: {
          create: normalizedItems,
        },
      },
      include: {
        customer: true,
        order: true,
        items: true,
      },
    });

    return NextResponse.json({ ok: true, invoice });
  } catch (error) {
    console.error("invoice create error", error);
    return NextResponse.json({ error: "Unable to create invoice." }, { status: 500 });
  }
}