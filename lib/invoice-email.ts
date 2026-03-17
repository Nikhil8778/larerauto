type InvoiceEmailInput = {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  invoiceNumber: string;
  totalCents: number;
  currency?: string;
};

function moneyFromCents(cents: number, currency = "CAD") {
  return (cents / 100).toLocaleString("en-CA", {
    style: "currency",
    currency,
  });
}

export function buildInvoiceEmailHtml(input: InvoiceEmailInput) {
  const total = moneyFromCents(input.totalCents, input.currency || "CAD");

  return `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
      <h2 style="margin-bottom: 8px;">Thank you for your payment</h2>
      <p>Hello ${input.customerName || "Customer"},</p>
      <p>Your payment was received successfully and your invoice PDF is attached.</p>

      <div style="margin: 20px 0; padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc;">
        <p style="margin: 4px 0;"><strong>Order Number:</strong> ${input.orderNumber}</p>
        <p style="margin: 4px 0;"><strong>Invoice Number:</strong> ${input.invoiceNumber}</p>
        <p style="margin: 4px 0;"><strong>Total Paid:</strong> ${total}</p>
      </div>

      <p>We will begin processing your order shortly.</p>
      <p>Thank you,<br/>Lare Auto</p>
    </div>
  `;
}

export function buildInvoiceEmailText(input: InvoiceEmailInput) {
  const total = moneyFromCents(input.totalCents, input.currency || "CAD");

  return `Thank you for your payment.

Order Number: ${input.orderNumber}
Invoice Number: ${input.invoiceNumber}
Total Paid: ${total}

Your invoice PDF is attached.
We will begin processing your order shortly.

Lare Auto`;
}