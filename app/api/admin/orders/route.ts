import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function buildOrderNumber() {
  return `ORD-${Date.now()}`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  const orders = await prisma.order.findMany({
    where: q
      ? {
          OR: [
            { orderNumber: { contains: q, mode: "insensitive" } },
            { customer: { firstName: { contains: q, mode: "insensitive" } } },
            { customer: { lastName: { contains: q, mode: "insensitive" } } },
            { customer: { email: { contains: q, mode: "insensitive" } } },
            { customer: { phone: { contains: q, mode: "insensitive" } } },
          ],
        }
      : undefined,
    include: {
      customer: true,
      items: true,
      invoices: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const customerId = String(body.customerId ?? "");
    const items = Array.isArray(body.items) ? body.items : [];

    if (!customerId || items.length === 0) {
      return NextResponse.json(
        { error: "customerId and at least one item are required." },
        { status: 400 }
      );
    }

    const normalizedItems = items.map((item: any) => {
      const quantity = Number(item.quantity ?? 1);
      const unitPriceCents = Number(item.unitPriceCents ?? 0);
      const lineTotalCents = quantity * unitPriceCents;

      return {
        offerId: item.offerId ?? null,
        title: String(item.title ?? "").trim(),
        description: item.description ? String(item.description).trim() : null,
        sku: item.sku ? String(item.sku).trim() : null,
        partTypeName: item.partTypeName ? String(item.partTypeName).trim() : null,
        make: item.make ? String(item.make).trim() : null,
        model: item.model ? String(item.model).trim() : null,
        engine: item.engine ? String(item.engine).trim() : null,
        year: item.year ? Number(item.year) : null,
        quantity,
        unitPriceCents,
        lineTotalCents,
        notes: item.notes ? String(item.notes).trim() : null,
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

    const order = await prisma.order.create({
      data: {
        orderNumber: buildOrderNumber(),
        customerId,
        status: body.status ?? "draft",
        paymentStatus: body.paymentStatus ?? "pending",
        fulfillmentStatus: body.fulfillmentStatus ?? "unfulfilled",
        currency: body.currency ?? "CAD",
        subtotalCents,
        taxCents,
        shippingCents,
        discountCents,
        totalCents,
        internalNotes: body.internalNotes ?? null,
        customerNotes: body.customerNotes ?? null,
        sourceChannel: body.sourceChannel ?? "manual",
        items: {
          create: normalizedItems,
        },
      },
      include: {
        customer: true,
        items: true,
      },
    });

    return NextResponse.json({ ok: true, order });
  } catch (error) {
    console.error("order create error", error);
    return NextResponse.json({ error: "Unable to create order." }, { status: 500 });
  }
}