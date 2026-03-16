import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function buildOrderNumber() {
  return `ORD-${Date.now()}`;
}

async function buildInvoiceNumber() {
  const settings = await prisma.businessSetting.findFirst({
    orderBy: { createdAt: "asc" },
  });

  const prefix = settings?.invoicePrefix || "INV";
  return `${prefix}-${Date.now()}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const fullName = String(body.fullName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim();
    const addressLine1 = String(body.addressLine1 ?? "").trim();
    const addressLine2 = String(body.addressLine2 ?? "").trim();
    const city = String(body.city ?? "").trim();
    const province = String(body.province ?? "").trim();
    const postalCode = String(body.postalCode ?? "").trim().toUpperCase();
    const country = String(body.country ?? "Canada").trim();

    const offerId = body.offerId ? String(body.offerId) : null;
    const partType = String(body.partType ?? "").trim();
    const quantity = Number(body.quantity ?? 1);
    const itemPriceCents = Number(body.itemPriceCents ?? 0);
    const deliveryCents = Number(body.deliveryCents ?? 0);
    const taxCents = Number(body.taxCents ?? 0);
    const totalCents = Number(body.totalCents ?? 0);
    const estimatedDeliveryText = body.estimatedDeliveryText
      ? String(body.estimatedDeliveryText).trim()
      : null;

    // internal-only choice
    const paymentGateway = "square";

    if (
      !fullName ||
      !email ||
      !phone ||
      !addressLine1 ||
      !city ||
      !province ||
      !postalCode ||
      !partType ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(itemPriceCents) ||
      itemPriceCents <= 0 ||
      !Number.isFinite(deliveryCents) ||
      deliveryCents < 0 ||
      !Number.isFinite(taxCents) ||
      taxCents < 0 ||
      !Number.isFinite(totalCents) ||
      totalCents <= 0
    ) {
      return NextResponse.json(
        { error: "Missing or invalid checkout fields." },
        { status: 400 }
      );
    }

    const [firstName, ...rest] = fullName.split(" ");
    const lastName = rest.join(" ").trim() || null;

    let customer = await prisma.customer.findFirst({
      where: { email },
    });

    if (customer) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          firstName,
          lastName,
          email,
          phone,
          addressLine1,
          addressLine2: addressLine2 || null,
          city,
          province,
          postalCode,
          country,
        },
      });
    } else {
      customer = await prisma.customer.create({
        data: {
          firstName,
          lastName,
          email,
          phone,
          addressLine1,
          addressLine2: addressLine2 || null,
          city,
          province,
          postalCode,
          country,
        },
      });
    }

    let offerData: {
      title: string;
      description: string | null;
      sku: string | null;
      partTypeName: string | null;
      make: string | null;
      model: string | null;
      engine: string | null;
      year: number | null;
    } = {
      title: partType,
      description: null,
      sku: null,
      partTypeName: partType,
      make: null,
      model: null,
      engine: null,
      year: null,
    };

    if (offerId) {
      const offer = await prisma.offer.findUnique({
        where: { id: offerId },
        include: {
          part: {
            include: {
              partType: true,
            },
          },
          vehicle: {
            include: {
              make: true,
              model: true,
              engine: true,
            },
          },
        },
      });

      if (offer) {
        offerData = {
          title: offer.part.title,
          description: offer.part.description ?? null,
          sku: offer.sourceSku ?? null,
          partTypeName: offer.part.partType.name,
          make: offer.vehicle.make.name,
          model: offer.vehicle.model.name,
          engine: offer.vehicle.engine.name,
          year: offer.vehicle.year,
        };
      }
    }

    const subtotalCents = itemPriceCents * quantity;
    const taxPercentApplied =
      subtotalCents + deliveryCents > 0
        ? Number((((taxCents / (subtotalCents + deliveryCents)) * 100) || 0).toFixed(2))
        : 13;

    const order = await prisma.order.create({
      data: {
        orderNumber: buildOrderNumber(),
        customerId: customer.id,
        status: "confirmed",
        paymentStatus: "pending",
        fulfillmentStatus: "unfulfilled",
        currency: "CAD",
        subtotalCents,
        taxCents,
        shippingCents: deliveryCents,
        deliveryChargeCents: deliveryCents,
        discountCents: 0,
        totalCents,
        taxPercentApplied,
        paymentGateway,
        billingEmail: email,
        addressLine1,
        addressLine2: addressLine2 || null,
        city,
        province,
        postalCode,
        country,
        estimatedDeliveryText,
        sourceChannel: "website",
        items: {
          create: [
            {
              offerId,
              title: offerData.title,
              description: offerData.description,
              sku: offerData.sku,
              partTypeName: offerData.partTypeName,
              make: offerData.make,
              model: offerData.model,
              engine: offerData.engine,
              year: offerData.year,
              quantity,
              unitPriceCents: itemPriceCents,
              lineTotalCents: subtotalCents,
            },
          ],
        },
      },
      include: {
        customer: true,
        items: true,
      },
    });

    const invoiceNumber = await buildInvoiceNumber();

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId: customer.id,
        orderId: order.id,
        status: "draft",
        currency: "CAD",
        subtotalCents,
        taxCents,
        shippingCents: deliveryCents,
        discountCents: 0,
        totalCents,
        paymentGateway,
        notes: `Checkout invoice for ${fullName}`,
        items: {
          create: [
            {
              title: offerData.title,
              description: offerData.description,
              quantity,
              unitPriceCents: itemPriceCents,
              lineTotalCents: subtotalCents,
            },
          ],
        },
      },
    });
    console.log("created checkout order:", {
    orderId: order.id,
    orderNumber: order.orderNumber,
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    });
    return NextResponse.json({
      ok: true,
      customerId: customer.id,
      orderId: order.id,
      orderNumber: order.orderNumber,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      paymentStatus: order.paymentStatus,
    });
  } catch (error) {
    console.error("checkout create error", error);
    
    return NextResponse.json(
      { error: "Unable to create checkout records." },
      { status: 500 }
    );
  }
}