import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        customer: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        currency: order.currency,
        subtotalCents: order.subtotalCents,
        taxCents: order.taxCents,
        shippingCents: order.shippingCents,
        totalCents: order.totalCents,
        estimatedDeliveryText: order.estimatedDeliveryText,
        paidAt: order.paidAt,
        addressLine1: order.addressLine1,
        addressLine2: order.addressLine2,
        city: order.city,
        province: order.province,
        postalCode: order.postalCode,
        country: order.country,
        createdAt: order.createdAt,
        customer: {
          firstName: order.customer.firstName,
          lastName: order.customer.lastName,
          email: order.customer.email,
          phone: order.customer.phone,
        },
        items: order.items.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          lineTotalCents: item.lineTotalCents,
          partTypeName: item.partTypeName,
          make: item.make,
          model: item.model,
          engine: item.engine,
          year: item.year,
        })),
      },
    });
  } catch (error) {
    console.error("customer order api error:", error);
    return NextResponse.json(
      { error: "Unable to load order." },
      { status: 500 }
    );
  }
}