import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY || "";

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export const EMAILS = {
  info: process.env.EMAIL_INFO || "info@lareauto.ca",
  accounts: process.env.EMAIL_ACCOUNTS || "accounts@lareauto.ca",
  admin: process.env.EMAIL_ADMIN || "admin@lareauto.ca",
  noReply: process.env.EMAIL_NO_REPLY || "no-reply@lareauto.ca",
};

type SendEmailParams = {
  to: string | string[];
  subject: string;
  html: string;
  from: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendEmail({
  to,
  subject,
  html,
  from,
  replyTo,
  cc,
  bcc,
}: SendEmailParams) {
  if (!resend) {
    throw new Error("RESEND_API_KEY is missing");
  }

  console.log("Sending email with Resend:", {
    from,
    to,
    subject,
    replyTo,
  });

  const result = await resend.emails.send({
    from,
    to,
    subject,
    html,
    replyTo,
    cc,
    bcc,
  });

  console.log("Resend result:", result);

  if ((result as any)?.error) {
    throw new Error(
      typeof (result as any).error === "string"
        ? (result as any).error
        : JSON.stringify((result as any).error)
    );
  }

  return result;
}

export async function sendReviewEmail({
  customerName,
  customerEmail,
  subject,
  message,
}: {
  customerName: string;
  customerEmail: string;
  subject?: string;
  message: string;
}) {
  return sendEmail({
    from: `Lare Auto <${EMAILS.info}>`,
    to: EMAILS.info,
    subject: subject || `New review / complaint from ${customerName}`,
    replyTo: customerEmail,
    html: `
      <h2>New Review / Complaint</h2>
      <p><strong>Name:</strong> ${escapeHtml(customerName)}</p>
      <p><strong>Email:</strong> ${escapeHtml(customerEmail)}</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message).replaceAll("\n", "<br/>")}</p>
    `,
  });
}

export async function sendAccountsEmail({
  customerName,
  customerEmail,
  amount,
  orderId,
}: {
  customerName: string;
  customerEmail: string;
  amount: number;
  orderId: string;
}) {
  return sendEmail({
    from: `Lare Auto Accounts <${EMAILS.accounts}>`,
    to: EMAILS.accounts,
    subject: `Payment received for order ${orderId}`,
    replyTo: customerEmail,
    html: `
      <h2>Payment Received</h2>
      <p><strong>Order ID:</strong> ${escapeHtml(orderId)}</p>
      <p><strong>Name:</strong> ${escapeHtml(customerName)}</p>
      <p><strong>Email:</strong> ${escapeHtml(customerEmail)}</p>
      <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
    `,
  });
}

export async function sendInvoiceEmail({
  customerEmail,
  customerName,
  orderId,
  amount,
}: {
  customerEmail: string;
  customerName: string;
  orderId: string;
  amount: number;
}) {
  return sendEmail({
    from: `Lare Auto <${EMAILS.noReply}>`,
    to: customerEmail,
    subject: `Invoice for order ${orderId}`,
    html: `
      <h2>Thank you for your order, ${escapeHtml(customerName)}</h2>
      <p>We have received your payment.</p>
      <p><strong>Order ID:</strong> ${escapeHtml(orderId)}</p>
      <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
      <p>This is an automated email from Lare Auto. Please do not reply to this email.</p>
    `,
  });
}

export async function sendAdminAlert({
  subject,
  detailsHtml,
}: {
  subject: string;
  detailsHtml: string;
}) {
  return sendEmail({
    from: `Lare Auto Admin <${EMAILS.admin}>`,
    to: EMAILS.admin,
    subject,
    html: `
      <h2>Admin Alert</h2>
      ${detailsHtml}
    `,
  });
}