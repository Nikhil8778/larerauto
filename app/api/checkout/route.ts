import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentMechanic } from "@/lib/mechanic-auth";
import { validateReferralCode } from "@/lib/mechanic-referral";
import {
  inferCustomerType,
  inferLastInboundChannel,
  inferPreferredReplyChannel,
} from "@/lib/channel-routing";

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

type IncomingCartItem = {
  offerId?: string | null;
  partType?: string | null;
  title?: string | null;
  quantity?: number | string | null;
  itemPriceCents?: number | string | null;
  year?: string | number | null;
  make?: string | null;
  model?: string | null;
  engine?: string | null;
  vin?: string | null;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const utmSource = body.utmSource ? String(body.utmSource).trim() : null;
    const utmMedium = body.utmMedium ? String(body.utmMedium).trim() : null;
    const utmCampaign = body.utmCampaign ? String(body.utmCampaign).trim() : null;
    const sourceChannel = body.sourceChannel ? String(body.sourceChannel).trim() : "website";

    const preferredReplyChannel = inferPreferredReplyChannel(sourceChannel);
    const customerType = inferCustomerType(sourceChannel);
    const lastCustomerChannel = inferLastInboundChannel(sourceChannel);

    const incomingOrderId = body.orderId ? String(body.orderId).trim() : null;
    const quoteId = body.quoteId ? String(body.quoteId).trim() : null;

    const fullName = String(body.fullName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim();
    const addressLine1 = String(body.addressLine1 ?? "").trim();
    const addressLine2 = String(body.addressLine2 ?? "").trim();
    const city = String(body.city ?? "").trim();
    const province = String(body.province ?? "").trim();
    const postalCode = String(body.postalCode ?? "").trim().toUpperCase();
    const country = String(body.country ?? "Canada").trim();

    const mode = String(body.mode ?? "customer").trim().toLowerCase();
    const isMechanicCheckout = mode === "mechanic";
    const isCustomerCheckout = !isMechanicCheckout;
    const paymentGateway = "square";

    const rawItems: IncomingCartItem[] = Array.isArray(body.items) ? body.items : [];
    const isCartCheckout = rawItems.length > 0;

    const singleOfferId = body.offerId ? String(body.offerId) : null;
    const singlePartType = String(body.partType ?? "").trim();
    const singleQuantity = Number(body.quantity ?? 1);
    const singleItemPriceCents = Number(body.itemPriceCents ?? 0);

    const deliveryCents = Number(body.deliveryCents ?? 0);
    const taxCents = Number(body.taxCents ?? 0);
    const totalCents = Number(body.totalCents ?? 0);
    const estimatedDeliveryText = body.estimatedDeliveryText
      ? String(body.estimatedDeliveryText).trim()
      : null;

    const regularItemPriceCents = Number(body.regularItemPriceCents ?? singleItemPriceCents);
    const mechanicDiscountCents = Number(body.mechanicDiscountCents ?? 0);

    const referralCode = body.referralCode ? String(body.referralCode).trim().toUpperCase() : null;

    if (
      !fullName ||
      !email ||
      !phone ||
      !addressLine1 ||
      !city ||
      !province ||
      !postalCode ||
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

    if (!isCartCheckout) {
      if (
        !singlePartType ||
        !Number.isFinite(singleQuantity) ||
        singleQuantity <= 0 ||
        !Number.isFinite(singleItemPriceCents) ||
        singleItemPriceCents <= 0
      ) {
        return NextResponse.json(
          { error: "Missing or invalid item fields." },
          { status: 400 }
        );
      }
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
          preferredReplyChannel,
          customerType,
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
          preferredReplyChannel,
          customerType,
        },
      });
    }

    let matchedLead = null;

    if (email) {
      matchedLead = await prisma.quoteLead.findFirst({
        where: { email },
        orderBy: { updatedAt: "desc" },
      });
    }

    if (!matchedLead && phone) {
      matchedLead = await prisma.quoteLead.findFirst({
        where: { phone },
        orderBy: { updatedAt: "desc" },
      });
    }

    if (!matchedLead && quoteId) {
      matchedLead = await prisma.quoteLead.findFirst({
        where: { quoteId },
        orderBy: { updatedAt: "desc" },
      });
    }

    const checkoutItems = isCartCheckout
      ? rawItems
          .map((item) => ({
            offerId: item.offerId ? String(item.offerId) : null,
            partType: String(item.partType ?? "").trim(),
            title: String(item.title ?? item.partType ?? "Item").trim(),
            quantity: Number(item.quantity ?? 1),
            itemPriceCents: Number(item.itemPriceCents ?? 0),
            year:
              item.year !== undefined && item.year !== null && String(item.year).trim()
                ? Number(item.year)
                : null,
            make: item.make ? String(item.make).trim() : null,
            model: item.model ? String(item.model).trim() : null,
            engine: item.engine ? String(item.engine).trim() : null,
            vin: item.vin ? String(item.vin).trim() : null,
          }))
          .filter(
            (item) =>
              item.partType &&
              Number.isFinite(item.quantity) &&
              item.quantity > 0 &&
              Number.isFinite(item.itemPriceCents) &&
              item.itemPriceCents > 0
          )
      : [
          {
            offerId: singleOfferId,
            partType: singlePartType,
            title: singlePartType,
            quantity: singleQuantity,
            itemPriceCents: singleItemPriceCents,
            year: null,
            make: null,
            model: null,
            engine: null,
            vin: null,
          },
        ];

    if (!checkoutItems.length) {
      return NextResponse.json(
        { error: "No valid checkout items found." },
        { status: 400 }
      );
    }

    const resolvedItems = [];

    for (const item of checkoutItems) {
      let resolved = {
        offerId: item.offerId,
        title: item.title,
        description: null as string | null,
        sku: null as string | null,
        partTypeName: item.partType,
        make: item.make,
        model: item.model,
        engine: item.engine,
        year: item.year,
        quantity: item.quantity,
        unitPriceCents: item.itemPriceCents,
        lineTotalCents: item.itemPriceCents * item.quantity,
        notes: item.vin ? `VIN: ${item.vin}` : null as string | null,
      };

      if (item.offerId) {
        const offer = await prisma.offer.findUnique({
          where: { id: item.offerId },
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
          resolved = {
            offerId: item.offerId,
            title: offer.part.title,
            description: offer.part.description ?? null,
            sku: offer.sourceSku ?? null,
            partTypeName: offer.part.partType.name,
            make: offer.vehicle.make.name,
            model: offer.vehicle.model.name,
            engine: offer.vehicle.engine.name,
            year: offer.vehicle.year,
            quantity: item.quantity,
            unitPriceCents: item.itemPriceCents,
            lineTotalCents: item.itemPriceCents * item.quantity,
            notes: item.vin ? `VIN: ${item.vin}` : null,
          };
        }
      }

      resolvedItems.push(resolved);
    }

    const originalSubtotalCents = resolvedItems.reduce(
      (sum, item) => sum + item.lineTotalCents,
      0
    );

    const safeMechanicDiscountCents =
      isMechanicCheckout && Number.isFinite(mechanicDiscountCents) && mechanicDiscountCents >= 0
        ? mechanicDiscountCents
        : 0;

    const safeRegularItemPriceCents =
      Number.isFinite(regularItemPriceCents) && regularItemPriceCents > 0
        ? regularItemPriceCents
        : singleItemPriceCents;

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
          quoteId: quoteId || existingOrder.quoteId,
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
          sourceChannel,
          utmSource,
          utmMedium,
          utmCampaign,
          orderPlacedByType: isMechanicCheckout ? "mechanic" : "customer",
          mechanicId: isMechanicCheckout ? currentMechanic?.id ?? null : null,
          mechanicDiscountCents: safeMechanicDiscountCents,
          referralDiscountCents: safeReferralDiscountCents,
          mechanicCreditCents: safeMechanicCreditCents,
          referredByMechanicId,
          referralCodeId,
          mechanicReferralCode,
          customerNotes: isMechanicCheckout ? "Mechanic checkout" : "Customer checkout",
          preferredReplyChannel,
          lastCustomerChannel,
          customerType,
        },
      });

      await prisma.orderItem.deleteMany({
        where: { orderId: existingOrder.id },
      });

      if (existingOrder.invoices[0]) {
        await prisma.invoiceItem.deleteMany({
          where: { invoiceId: existingOrder.invoices[0].id },
        });
      }

      await prisma.orderItem.createMany({
        data: resolvedItems.map((item) => ({
          orderId: updatedOrder.id,
          offerId: item.offerId,
          title: item.title,
          description: item.description,
          sku: item.sku,
          partTypeName: item.partTypeName,
          make: item.make,
          model: item.model,
          engine: item.engine,
          year: item.year,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          lineTotalCents: item.lineTotalCents,
          notes:
            isMechanicCheckout && safeRegularItemPriceCents > singleItemPriceCents
              ? `Mechanic pricing applied.`
              : mechanicReferralCode
              ? `Referral code applied: ${mechanicReferralCode}`
              : item.notes,
        })),
      });

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

        await prisma.invoiceItem.createMany({
          data: resolvedItems.map((item) => ({
            invoiceId: updatedInvoice.id,
            title: item.title,
            description: item.description,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            lineTotalCents: item.lineTotalCents,
          })),
        });

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
              create: resolvedItems.map((item) => ({
                title: item.title,
                description: item.description,
                quantity: item.quantity,
                unitPriceCents: item.unitPriceCents,
                lineTotalCents: item.lineTotalCents,
              })),
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
          quoteId: quoteId || null,
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
          sourceChannel,
          utmSource,
          utmMedium,
          utmCampaign,
          orderPlacedByType: isMechanicCheckout ? "mechanic" : "customer",
          mechanicId: isMechanicCheckout ? currentMechanic?.id ?? null : null,
          mechanicDiscountCents: safeMechanicDiscountCents,
          referralDiscountCents: safeReferralDiscountCents,
          mechanicCreditCents: safeMechanicCreditCents,
          referredByMechanicId,
          referralCodeId,
          mechanicReferralCode,
          customerNotes: isMechanicCheckout ? "Mechanic checkout" : "Customer checkout",
          preferredReplyChannel,
          lastCustomerChannel,
          customerType,
          items: {
            create: resolvedItems.map((item) => ({
              offerId: item.offerId,
              title: item.title,
              description: item.description,
              sku: item.sku,
              partTypeName: item.partTypeName,
              make: item.make,
              model: item.model,
              engine: item.engine,
              year: item.year,
              quantity: item.quantity,
              unitPriceCents: item.unitPriceCents,
              lineTotalCents: item.lineTotalCents,
              notes:
                isMechanicCheckout && safeRegularItemPriceCents > singleItemPriceCents
                  ? `Mechanic pricing applied.`
                  : mechanicReferralCode
                  ? `Referral code applied: ${mechanicReferralCode}`
                  : item.notes,
            })),
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
            create: resolvedItems.map((item) => ({
              title: item.title,
              description: item.description,
              quantity: item.quantity,
              unitPriceCents: item.unitPriceCents,
              lineTotalCents: item.lineTotalCents,
            })),
          },
        },
      });

      orderId = createdOrder.id;
      orderNumber = createdOrder.orderNumber;
      invoiceId = createdInvoice.id;
      invoiceNumber = createdInvoice.invoiceNumber;
    }

    if (matchedLead) {
      await prisma.quoteLead.update({
        where: { id: matchedLead.id },
        data: {
          customerId: customer.id,
          orderId,
          status: "ordered",
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
          offerId: singleOfferId || matchedLead.offerId,
          quoteId: quoteId || matchedLead.quoteId,
          partType: singlePartType || matchedLead.partType,
          itemPriceCents:
            Number.isFinite(singleItemPriceCents) && singleItemPriceCents > 0
              ? singleItemPriceCents
              : matchedLead.itemPriceCents,
          utmSource,
          utmMedium,
          utmCampaign,
          sourceChannel,
          preferredReplyChannel,
          customerType,
          lastInboundChannel: lastCustomerChannel,
        },
      });
    }

    console.log("prepared checkout order:", {
      orderId,
      orderNumber,
      invoiceId,
      invoiceNumber,
      mode,
      isCartCheckout,
      mechanicId: currentMechanic?.id ?? null,
      mechanicDiscountCents: safeMechanicDiscountCents,
      referralDiscountCents: safeReferralDiscountCents,
      mechanicCreditCents: safeMechanicCreditCents,
      referredByMechanicId,
      resumed: Boolean(incomingOrderId),
      utmSource,
      utmMedium,
      utmCampaign,
      sourceChannel,
      preferredReplyChannel,
      customerType,
      itemCount: resolvedItems.length,
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