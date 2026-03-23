import { NextRequest, NextResponse } from "next/server";
import { getCurrentMechanic } from "@/lib/mechanic-auth";
import { prisma } from "@/lib/prisma";
import { applyMechanicDiscount } from "@/lib/mechanic-pricing";
import { generateOrderNumber } from "@/lib/order-number";

export async function POST(request: NextRequest) {
  try {
    const mechanic = await getCurrentMechanic();

    if (!mechanic) {
      return NextResponse.json(
        { success: false, message: "Not authenticated." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const offerId = String(body.offerId || "");
    const quantity = Math.max(1, Number(body.quantity || 1));

    if (!offerId) {
      return NextResponse.json(
        { success: false, message: "Offer ID is required." },
        { status: 400 }
      );
    }

    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        vehicle: {
          include: {
            make: true,
            model: true,
            engine: true,
          },
        },
        part: {
          include: {
            partType: true,
          },
        },
      },
    });

    if (!offer) {
      return NextResponse.json(
        { success: false, message: "Offer not found." },
        { status: 404 }
      );
    }

    const pricing = applyMechanicDiscount(
      offer.sellPriceCents,
      mechanic.tradeDiscountPct
    );

    const unitPriceCents = pricing.discountedPriceCents;
    const lineTotalCents = unitPriceCents * quantity;

    let customer = await prisma.customer.findFirst({
      where: {
        email: mechanic.email,
      },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          firstName: mechanic.contactName,
          companyName: mechanic.shopName,
          email: mechanic.email,
          phone: mechanic.phone,
        },
      });
    }

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerId: customer.id,
        status: "confirmed",
        paymentStatus: "pending",
        fulfillmentStatus: "unfulfilled",
        currency: offer.currency,
        subtotalCents: lineTotalCents,
        taxCents: 0,
        shippingCents: 0,
        discountCents: pricing.discountCents * quantity,
        totalCents: lineTotalCents,
        orderPlacedByType: "mechanic",
        mechanicId: mechanic.id,
        mechanicDiscountCents: pricing.discountCents * quantity,
        sourceChannel: "website",
        customerNotes: "Direct mechanic purchase",
        items: {
          create: [
            {
              offerId: offer.id,
              title: offer.part.title,
              partTypeName: offer.part.partType.name,
              make: offer.vehicle.make.name,
              model: offer.vehicle.model.name,
              engine: offer.vehicle.engine.name,
              year: offer.vehicle.year,
              quantity,
              unitPriceCents,
              lineTotalCents,
            },
          ],
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Mechanic order created successfully.",
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        totalCents: order.totalCents,
      },
    });
  } catch (error) {
    console.error("POST /api/mechanic/place-order error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to create mechanic order." },
      { status: 500 }
    );
  }
}