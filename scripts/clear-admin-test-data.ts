import { prisma } from "@/lib/prisma";

async function main() {
  console.log("Clearing admin test data (keeping business settings)...");

  // Delete messages
  await prisma.conversationMessage.deleteMany({
    where: {
      OR: [
        { senderHandle: "+1 705 555 1111" },
        { senderHandle: "@sarahtest" },
      ],
    },
  });

  // Delete conversations
  await prisma.conversation.deleteMany({
    where: {
      OR: [
        { notes: "Customer asking for urgent fitment confirmation." },
        { notes: "Interested in suspension quote." },
      ],
    },
  });

  // Delete invoice items
  await prisma.invoiceItem.deleteMany({
    where: {
      title: {
        in: ["Alternator", "Brake Pads", "Shocks"],
      },
    },
  });

  // Delete invoices
  await prisma.invoice.deleteMany({
    where: {
      notes: {
        in: ["Paid by test customer.", "Draft invoice for approval."],
      },
    },
  });

  // Delete order items
  await prisma.orderItem.deleteMany({
    where: {
      sku: {
        in: ["ALT-TEST-001", "BP-TEST-001", "SHK-TEST-001"],
      },
    },
  });

  // Delete orders
  await prisma.order.deleteMany({
    where: {
      OR: [
        { sourceChannel: "website" },
        { sourceChannel: "whatsapp" },
      ],
    },
  });

  // Delete automation rules created by test script
  await prisma.autoReplyRule.deleteMany({
    where: {
      name: {
        in: ["WhatsApp Welcome", "After Hours Reply"],
      },
    },
  });

  // Delete customers created for testing
  await prisma.customer.deleteMany({
    where: {
      email: {
        in: ["john.smith@test.com", "sarah.brown@test.com"],
      },
    },
  });

  console.log("✅ Test data cleared successfully.");
  console.log("Business settings preserved.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Cleanup failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });