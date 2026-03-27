import { Resend } from "resend";
import type { OutreachSendInput, OutreachSendResult } from "./types";

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM;

const resend = resendApiKey ? new Resend(resendApiKey) : null;

function buildHtml(input: OutreachSendInput) {
  const safeBody = (input.body || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br />");

  return `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
      <p>Hello${input.recipientName ? ` ${input.recipientName}` : ""},</p>
      <p>${safeBody}</p>
      <p style="margin-top: 24px;">
        Regards,<br />
        <strong>LARE Auto</strong><br />
        <a href="https://www.lareauto.ca">www.lareauto.ca</a>
      </p>
    </div>
  `;
}

export async function sendEmailMessage(
  input: OutreachSendInput
): Promise<OutreachSendResult> {
  if (!input.recipientEmail) {
    return {
      success: false,
      error: "Missing recipient email.",
    };
  }

  if (!resendApiKey) {
    return {
      success: false,
      error: "RESEND_API_KEY is missing.",
    };
  }

  if (!emailFrom) {
    return {
      success: false,
      error: "EMAIL_FROM is missing.",
    };
  }

  if (!resend) {
    return {
      success: false,
      error: "Email provider is not initialized.",
    };
  }

  try {
    const subject =
      input.subject?.trim() || "LARE Auto - Parts Supply Introduction";

    const response = await resend.emails.send({
      from: emailFrom,
      to: input.recipientEmail,
      subject,
      text: input.body,
      html: buildHtml(input),
    });

    if (response.error) {
      return {
        success: false,
        error: response.error.message || "Failed to send email.",
      };
    }

    return {
      success: true,
      providerMessageId: response.data?.id ?? null,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email.",
    };
  }
}