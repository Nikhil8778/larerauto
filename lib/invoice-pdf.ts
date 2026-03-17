import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type InvoicePdfInput = {
  businessName: string;
  businessEmail?: string | null;
  businessPhone?: string | null;
  invoiceNumber: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string | null;
  addressLines: string[];
  itemTitle: string;
  itemDescription?: string | null;
  quantity: number;
  unitPriceCents: number;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  currency?: string;
  paidAt?: Date | null;
};

function moneyFromCents(cents: number, currency = "CAD") {
  return (cents / 100).toLocaleString("en-CA", {
    style: "currency",
    currency,
  });
}

export async function generateInvoicePdf(input: InvoicePdfInput) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = height - 50;

  const drawText = (
    text: string,
    x: number,
    yPos: number,
    size = 11,
    bold = false,
    color = rgb(0.1, 0.15, 0.25)
  ) => {
    page.drawText(text, {
      x,
      y: yPos,
      size,
      font: bold ? fontBold : fontRegular,
      color,
    });
  };

  drawText(input.businessName, 50, y, 22, true);
  y -= 26;

  if (input.businessEmail) {
    drawText(input.businessEmail, 50, y, 10);
    y -= 14;
  }

  if (input.businessPhone) {
    drawText(input.businessPhone, 50, y, 10);
    y -= 18;
  }

  drawText("INVOICE", 430, height - 55, 22, true);
  drawText(`Invoice #: ${input.invoiceNumber}`, 390, height - 82, 10, true);
  drawText(`Order #: ${input.orderNumber}`, 390, height - 98, 10);
  drawText(
    `Paid: ${input.paidAt ? input.paidAt.toLocaleString("en-CA") : "-"}`,
    390,
    height - 114,
    10
  );

  y -= 20;
  page.drawLine({
    start: { x: 50, y },
    end: { x: width - 50, y },
    thickness: 1,
    color: rgb(0.85, 0.88, 0.92),
  });

  y -= 26;
  drawText("Bill To", 50, y, 12, true);
  y -= 18;
  drawText(input.customerName, 50, y, 10);
  y -= 14;

  if (input.customerEmail) {
    drawText(input.customerEmail, 50, y, 10);
    y -= 14;
  }

  for (const line of input.addressLines.filter(Boolean)) {
    drawText(line, 50, y, 10);
    y -= 14;
  }

  y -= 24;

  // Table header
  drawText("Item", 50, y, 11, true);
  drawText("Qty", 360, y, 11, true);
  drawText("Unit Price", 415, y, 11, true);
  drawText("Line Total", 500, y, 11, true);
  y -= 12;

  page.drawLine({
    start: { x: 50, y },
    end: { x: width - 50, y },
    thickness: 1,
    color: rgb(0.85, 0.88, 0.92),
  });

  y -= 20;
  drawText(input.itemTitle, 50, y, 10, true);
  drawText(String(input.quantity), 365, y, 10);
  drawText(moneyFromCents(input.unitPriceCents, input.currency), 415, y, 10);
  drawText(
    moneyFromCents(input.unitPriceCents * input.quantity, input.currency),
    500,
    y,
    10
  );

  if (input.itemDescription) {
    y -= 14;
    drawText(input.itemDescription, 50, y, 9, false, rgb(0.35, 0.4, 0.48));
  }

  y -= 50;

  const summaryX = 390;
  drawText("Subtotal", summaryX, y, 10, true);
  drawText(moneyFromCents(input.subtotalCents, input.currency), 500, y, 10);
  y -= 16;

  drawText("Delivery", summaryX, y, 10, true);
  drawText(moneyFromCents(input.shippingCents, input.currency), 500, y, 10);
  y -= 16;

  drawText("HST", summaryX, y, 10, true);
  drawText(moneyFromCents(input.taxCents, input.currency), 500, y, 10);
  y -= 18;

  page.drawLine({
    start: { x: summaryX, y },
    end: { x: width - 50, y },
    thickness: 1,
    color: rgb(0.85, 0.88, 0.92),
  });

  y -= 18;
  drawText("Total Paid", summaryX, y, 12, true);
  drawText(moneyFromCents(input.totalCents, input.currency), 490, y, 12, true);

  y -= 40;
  drawText("Thank you for your order.", 50, y, 10);
  y -= 14;
  drawText("Lare Auto will begin processing your order shortly.", 50, y, 10);

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}