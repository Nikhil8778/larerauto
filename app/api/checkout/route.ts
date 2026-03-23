import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentMechanic } from "@/lib/mechanic-auth";
import { validateReferralCode } from "@/lib/mechanic-referral";

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

    const incomingOrderId = body.orderId ? String(body.orderId).trim() : null;

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

    const mode = String(body.mode ?? "customer").trim().toLowerCase();
    const regularItemPriceCents = Number(body.regularItemPriceCents ?? itemPriceCents);
    const mechanicDiscountCents = Number(body.mechanicDiscountCents ?? 0);

    const referralCode = body.referralCode ? String(body.referralCode).trim().toUpperCase() : null;

    const isMechanicCheckout = mode === "mechanic";
    const isCustomerCheckout = !isMechanicCheckout;
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

    let currentMechanic: Awaited<ReturnType<typeof getCurrentMechanic>> = null;

    if (isMechanicCheckout) {
      currentMechanic = await getCurrentMechanic();

      if (!currentMechanic || !currentMechanic.isApproved || !currentMechanic.isActive) {
        return NextResponse.json(
          { error: "Mechanic session is not valid." },
          { status: 401 }
        );
      }
    }

    let validatedReferral:
      | Awaited<ReturnType<typeof validateReferralCode>>
      | null = null;

    if (isCustomerCheckout && referralCode) {
      validatedReferral = await validateReferralCode(referralCode);

      if (!validatedReferral.valid || !validatedReferral.referral) {
        return NextResponse.json(
          { error: validatedReferral.message || "Invalid referral code." },
          { status: 400 }
        );
      }
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
          companyName:
            isMechanicCheckout && currentMechanic?.shopName
              ? currentMechanic.shopName
              : customer.companyName,
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
          companyName:
            isMechanicCheckout && currentMechanic?.shopName
              ? currentMechanic.shopName
              : null,
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

    const originalSubtotalCents = itemPriceCents * quantity;

    const safeMechanicDiscountCents =
      isMechanicCheckout && Number.isFinite(mechanicDiscountCents) && mechanicDiscountCents >= 0
        ? mechanicDiscountCents
        : 0;

    const safeRegularItemPriceCents =
      Number.isFinite(regularItemPriceCents) && regularItemPriceCents > 0
        ? regularItemPriceCents
        : itemPriceCents;

    const safeReferralDiscountCents =
      isCustomerCheckout && validatedReferral?.valid && validatedReferral.referral
        ? Math.round(originalSubtotalCents * (validatedReferral.referral.customerDiscountPct / 100))
        : 0;

    const safeMechanicCreditCents =
      isCustomerCheckout && validatedReferral?.valid && validatedReferral.referral
        ? Math.round(originalSubtotalCents * 0.08)
        : 0;

    const subtotalCents = Math.max(
      0,
      originalSubtotalCents - safeMechanicDiscountCents - safeReferralDiscountCents
    );

    const taxPercentApplied =
      subtotalCents + deliveryCents > 0
        ? Number((((taxCents / (subtotalCents + deliveryCents)) * 100) || 0).toFixed(2))
        : 13;

    const totalDiscountCents = safeMechanicDiscountCents + safeReferralDiscountCents;

    const referralCodeId =
      isCustomerCheckout && validatedReferral?.valid && validatedReferral.referral
        ? validatedReferral.referral.id
        : null;

    const referredByMechanicId =
      isCustomerCheckout && validatedReferral?.valid && validatedReferral.referral
        ? validatedReferral.referral.mechanic.id
        : null;

    const mechanicReferralCode =
      isCustomerCheckout && validatedReferral?.valid && validatedReferral.referral
        ? validatedReferral.referral.code
        : null;

    let orderId = "";
    let orderNumber = "";
    let invoiceId = "";
    let invoiceNumber = "";

    if (incomingOrderId) {
      const existingOrder = await prisma.order.findUnique({
        where: { id: incomingOrderId },
        include: {
          items: true,
          invoices: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!existingOrder) {
        return NextResponse.json(
          { error: "Draft order not found." },
          { status: 404 }
        );
      }

      if (existingOrder.status !== "draft" || existingOrder.paymentStatus !== "pending") {
        return NextResponse.json(
          { error: "Only draft unpaid orders can be resumed." },
          { status: 400 }
        );
      }

      if (isMechanicCheckout && existingOrder.mechanicId !== currentMechanic?.id) {
        return NextResponse.json(
          { error: "This draft order does not belong to the current mechanic." },
          { status: 403 }
        );
      }

      const updatedOrder = await prisma.order.update({
        where: { id: existingOrder.id },
        data: {
          customerId: customer.id,
          subtotalCents,
          taxCents,
          shippingCents: deliveryCents,
          deliveryChargeCents: deliveryCents,
          discountCents: totalDiscountCents,
          totalCents,
          taxPercentApplied,
          billingEmail: email,
          addressLine1,
          addressLine2: addressLine2 || null,
          city,
          province,
          postalCode,
          country,
          estimatedDeliveryText,
          sourceChannel: "website",
          orderPlacedByType: isMechanicCheckout ? "mechanic" : "customer",
          mechanicId: isMechanicCheckout ? currentMechanic?.id ?? null : null,
          mechanicDiscountCents: safeMechanicDiscountCents,
          referralDiscountCents: safeReferralDiscountCents,
          mechanicCreditCents: safeMechanicCreditCents,
          referredByMechanicId,
          referralCodeId,
          mechanicReferralCode,
          customerNotes: isMechanicCheckout ? "Mechanic checkout" : "Customer checkout",
        },
      });

      const existingItem = existingOrder.items[0];

      if (existingItem) {
        await prisma.orderItem.update({
          where: { id: existingItem.id },
          data: {
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
            unitPriceCents: Math.round(subtotalCents / quantity),
            lineTotalCents: subtotalCents,
            notes:
              isMechanicCheckout && safeRegularItemPriceCents > itemPriceCents
                ? `Mechanic pricing applied. Regular item price: ${safeRegularItemPriceCents} cents`
                : mechanicReferralCode
                ? `Referral code applied: ${mechanicReferralCode}`
                : null,
          },
        });
      } else {
        await prisma.orderItem.create({
          data: {
            orderId: existingOrder.id,
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
            unitPriceCents: Math.round(subtotalCents / quantity),
            lineTotalCents: subtotalCents,
            notes:
              isMechanicCheckout && safeRegularItemPriceCents > itemPriceCents
                ? `Mechanic pricing applied. Regular item price: ${safeRegularItemPriceCents} cents`
                : mechanicReferralCode
                ? `Referral code applied: ${mechanicReferralCode}`
                : null,
          },
        });
      }

      const existingInvoice = existingOrder.invoices[0];

      if (existingInvoice) {
        const updatedInvoice = await prisma.invoice.update({
          where: { id: existingInvoice.id },
          data: {
            customerId: customer.id,
            subtotalCents,
            taxCents,
            shippingCents: deliveryCents,
            discountCents: totalDiscountCents,
            totalCents,
            paymentGateway,
            notes: isMechanicCheckout
              ? `Mechanic checkout invoice for ${fullName}`
              : `Checkout invoice for ${fullName}`,
          },
        });

        const existingInvoiceItem = await prisma.invoiceItem.findFirst({
          where: { invoiceId: existingInvoice.id },
          orderBy: { createdAt: "asc" },
        });

        if (existingInvoiceItem) {
          await prisma.invoiceItem.update({
            where: { id: existingInvoiceItem.id },
            data: {
              title: offerData.title,
              description: offerData.description,
              quantity,
              unitPriceCents: Math.round(subtotalCents / quantity),
              lineTotalCents: subtotalCents,
            },
          });
        } else {
          await prisma.invoiceItem.create({
            data: {
              invoiceId: existingInvoice.id,
              title: offerData.title,
              description: offerData.description,
              quantity,
              unitPriceCents: Math.round(subtotalCents / quantity),
              lineTotalCents: subtotalCents,
            },
          });
        }

        invoiceId = updatedInvoice.id;
        invoiceNumber = updatedInvoice.invoiceNumber;
      } else {
        const newInvoiceNumber = await buildInvoiceNumber();

        const createdInvoice = await prisma.invoice.create({
          data: {
            invoiceNumber: newInvoiceNumber,
            customerId: customer.id,
            orderId: updatedOrder.id,
            status: "draft",
            currency: "CAD",
            subtotalCents,
            taxCents,
            shippingCents: deliveryCents,
            discountCents: totalDiscountCents,
            totalCents,
            paymentGateway,
            notes: isMechanicCheckout
              ? `Mechanic checkout invoice for ${fullName}`
              : `Checkout invoice for ${fullName}`,
            items: {
              create: [
                {
                  title: offerData.title,
                  description: offerData.description,
                  quantity,
                  unitPriceCents: Math.round(subtotalCents / quantity),
                  lineTotalCents: subtotalCents,
                },
              ],
            },
          },
        });

        invoiceId = createdInvoice.id;
        invoiceNumber = createdInvoice.invoiceNumber;
      }

      orderId = updatedOrder.id;
      orderNumber = updatedOrder.orderNumber;
    } else {
      const createdOrder = await prisma.order.create({
        data: {
          orderNumber: buildOrderNumber(),
          customerId: customer.id,
          status: "draft",
          paymentStatus: "pending",
          fulfillmentStatus: "unfulfilled",
          currency: "CAD",
          subtotalCents,
          taxCents,
          shippingCents: deliveryCents,
          deliveryChargeCents: deliveryCents,
          discountCents: totalDiscountCents,
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
          orderPlacedByType: isMechanicCheckout ? "mechanic" : "customer",
          mechanicId: isMechanicCheckout ? currentMechanic?.id ?? null : null,
          mechanicDiscountCents: safeMechanicDiscountCents,
          referralDiscountCents: safeReferralDiscountCents,
          mechanicCreditCents: safeMechanicCreditCents,
          referredByMechanicId,
          referralCodeId,
          mechanicReferralCode,
          customerNotes: isMechanicCheckout ? "Mechanic checkout" : "Customer checkout",
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
                unitPriceCents: Math.round(subtotalCents / quantity),
                lineTotalCents: subtotalCents,
                notes:
                  isMechanicCheckout && safeRegularItemPriceCents > itemPriceCents
                    ? `Mechanic pricing applied. Regular item price: ${safeRegularItemPriceCents} cents`
                    : mechanicReferralCode
                    ? `Referral code applied: ${mechanicReferralCode}`
                    : null,
              },
            ],
          },
        },
      });

      const newInvoiceNumber = await buildInvoiceNumber();

      const createdInvoice = await prisma.invoice.create({
        data: {
          invoiceNumber: newInvoiceNumber,
          customerId: customer.id,
          orderId: createdOrder.id,
          status: "draft",
          currency: "CAD",
          subtotalCents,
          taxCents,
          shippingCents: deliveryCents,
          discountCents: totalDiscountCents,
          totalCents,
          paymentGateway,
          notes: isMechanicCheckout
            ? `Mechanic checkout invoice for ${fullName}`
            : `Checkout invoice for ${fullName}`,
          items: {
            create: [
              {
                title: offerData.title,
                description: offerData.description,
                quantity,
                unitPriceCents: Math.round(subtotalCents / quantity),
                lineTotalCents: subtotalCents,
              },
            ],
          },
        },
      });

      orderId = createdOrder.id;
      orderNumber = createdOrder.orderNumber;
      invoiceId = createdInvoice.id;
      invoiceNumber = createdInvoice.invoiceNumber;
    }

    console.log("prepared checkout order:", {
      orderId,
      orderNumber,
      invoiceId,
      invoiceNumber,
      mode,
      mechanicId: currentMechanic?.id ?? null,
      mechanicDiscountCents: safeMechanicDiscountCents,
      referralDiscountCents: safeReferralDiscountCents,
      mechanicCreditCents: safeMechanicCreditCents,
      referredByMechanicId,
      resumed: Boolean(incomingOrderId),
    });

    return NextResponse.json({
      ok: true,
      customerId: customer.id,
      orderId,
      orderNumber,
      invoiceId,
      invoiceNumber,
      paymentStatus: "pending",
    });
  } catch (error) {
    console.error("checkout create/update error", error);

    return NextResponse.json(
      { error: "Unable to create checkout records." },
      { status: 500 }
    );
  }
}