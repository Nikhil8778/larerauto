import { prisma } from "@/lib/prisma";

async function main() {
  console.log("Creating admin test data...");

  const settings = await prisma.businessSetting.upsert({
    where: { id: "business-settings-main" },
    update: {},
    create: {
      id: "business-settings-main",
      businessName: "Lare Auto",
      businessEmail: "info@lareauto.ca",
      businessPhone: "+1 705 555 0100",
      whatsappNumber: "+1 705 555 0101",
      instagramHandle: "@lareauto",
      facebookPage: "facebook.com/lareauto",
      invoicePrefix: "INV",
      quotePrefix: "QTE",
      defaultTaxPercent: 13,
      currency: "CAD",
      welcomeReply: "Hi, thank you for contacting Lare Auto. Please share your vehicle year, make, model, engine and required part.",
      afterHoursReply: "Thanks for your message. We are currently offline and will reply during business hours.",
      invoiceReminderReply: "Friendly reminder: your invoice is pending. Please contact us if you need help.",
    },
  });

  const customer1 = await prisma.customer.create({
    data: {
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@test.com",
      phone: "+1 705 555 1111",
      whatsappNumber: "+1 705 555 1111",
      companyName: "Smith Auto Repair",
      notes: "Prefers WhatsApp communication.",
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      firstName: "Sarah",
      lastName: "Brown",
      email: "sarah.brown@test.com",
      phone: "+1 705 555 2222",
      whatsappNumber: "+1 705 555 2222",
      notes: "Interested in brake and suspension parts.",
    },
  });

  const order1 = await prisma.order.create({
    data: {
      orderNumber: `ORD-${Date.now()}-1`,
      customerId: customer1.id,
      status: "confirmed",
      paymentStatus: "paid",
      fulfillmentStatus: "processing",
      currency: "CAD",
      subtotalCents: 42000,
      taxCents: 5460,
      shippingCents: 1500,
      discountCents: 0,
      totalCents: 48960,
      internalNotes: "Priority local delivery.",
      customerNotes: "Need part urgently.",
      sourceChannel: "website",
      items: {
        create: [
          {
            title: "Alternator",
            description: "Replacement alternator",
            sku: "ALT-TEST-001",
            partTypeName: "Alternators",
            make: "Honda",
            model: "Civic",
            engine: "2.0L I4",
            year: 2019,
            quantity: 1,
            unitPriceCents: 28000,
            lineTotalCents: 28000,
          },
          {
            title: "Brake Pads",
            description: "Front brake pads set",
            sku: "BP-TEST-001",
            partTypeName: "Brake Pads",
            make: "Honda",
            model: "Civic",
            engine: "2.0L I4",
            year: 2019,
            quantity: 1,
            unitPriceCents: 14000,
            lineTotalCents: 14000,
          },
        ],
      },
    },
  });

  const order2 = await prisma.order.create({
    data: {
      orderNumber: `ORD-${Date.now()}-2`,
      customerId: customer2.id,
      status: "draft",
      paymentStatus: "pending",
      fulfillmentStatus: "unfulfilled",
      currency: "CAD",
      subtotalCents: 19000,
      taxCents: 2470,
      shippingCents: 1200,
      discountCents: 1000,
      totalCents: 21670,
      sourceChannel: "whatsapp",
      items: {
        create: [
          {
            title: "Shocks",
            description: "Rear shocks pair",
            sku: "SHK-TEST-001",
            partTypeName: "Shocks",
            make: "Nissan",
            model: "Rogue",
            engine: "2.5L I4",
            year: 2021,
            quantity: 1,
            unitPriceCents: 19000,
            lineTotalCents: 19000,
          },
        ],
      },
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-${Date.now()}-1`,
      customerId: customer1.id,
      orderId: order1.id,
      status: "paid",
      currency: "CAD",
      subtotalCents: 42000,
      taxCents: 5460,
      shippingCents: 1500,
      discountCents: 0,
      totalCents: 48960,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      notes: "Paid by test customer.",
      items: {
        create: [
          {
            title: "Alternator",
            description: "Replacement alternator",
            quantity: 1,
            unitPriceCents: 28000,
            lineTotalCents: 28000,
          },
          {
            title: "Brake Pads",
            description: "Front brake pads set",
            quantity: 1,
            unitPriceCents: 14000,
            lineTotalCents: 14000,
          },
        ],
      },
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-${Date.now()}-2`,
      customerId: customer2.id,
      orderId: order2.id,
      status: "draft",
      currency: "CAD",
      subtotalCents: 19000,
      taxCents: 2470,
      shippingCents: 1200,
      discountCents: 1000,
      totalCents: 21670,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      notes: "Draft invoice for approval.",
      items: {
        create: [
          {
            title: "Shocks",
            description: "Rear shocks pair",
            quantity: 1,
            unitPriceCents: 19000,
            lineTotalCents: 19000,
          },
        ],
      },
    },
  });

  const conversation1 = await prisma.conversation.create({
    data: {
      customerId: customer1.id,
      channel: "whatsapp",
      status: "open",
      lastMessageAt: new Date(),
      notes: "Customer asking for urgent fitment confirmation.",
      messages: {
        create: [
          {
            direction: "inbound",
            senderName: "John Smith",
            senderHandle: "+1 705 555 1111",
            messageType: "text",
            content: "Hi, do you have an alternator for my 2019 Honda Civic?",
            sentAt: new Date(),
          },
          {
            direction: "outbound",
            senderName: "Lare Auto",
            senderHandle: "Lare Auto",
            messageType: "text",
            content: "Yes, we can help. Please confirm engine size.",
            sentAt: new Date(),
          },
        ],
      },
    },
  });

  await prisma.conversation.create({
    data: {
      customerId: customer2.id,
      channel: "instagram",
      status: "pending",
      lastMessageAt: new Date(),
      notes: "Interested in suspension quote.",
      messages: {
        create: [
          {
            direction: "inbound",
            senderName: "Sarah Brown",
            senderHandle: "@sarahtest",
            messageType: "text",
            content: "Can you quote shocks for Nissan Rogue 2021?",
            sentAt: new Date(),
          },
        ],
      },
    },
  });

  await prisma.autoReplyRule.createMany({
    data: [
      {
        name: "WhatsApp Welcome",
        channel: "whatsapp",
        triggerType: "welcome",
        replyTemplate:
          "Hi, thank you for contacting Lare Auto. Please send year, make, model, engine and required part.",
        isActive: true,
        sortOrder: 1,
      },
      {
        name: "After Hours Reply",
        channel: "all",
        triggerType: "after_hours",
        replyTemplate:
          "Thanks for your message. We are currently offline and will respond during business hours.",
        isActive: true,
        sortOrder: 2,
      },
    ],
    skipDuplicates: false,
  });

  console.log("✅ Admin test data created successfully.");
  console.log("Settings:", settings.businessName);
  console.log("Customer 1:", customer1.firstName, customer1.lastName);
  console.log("Customer 2:", customer2.firstName, customer2.lastName);
  console.log("Order 1:", order1.orderNumber);
  console.log("Order 2:", order2.orderNumber);
  console.log("Conversation 1:", conversation1.channel);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Admin test data script failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });