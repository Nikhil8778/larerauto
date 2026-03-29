import twilio from "twilio";
import type { OutreachSendInput, OutreachSendResult } from "./types";

const twilioSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioSmsFrom = process.env.TWILIO_SMS_FROM;
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim();

const client =
  twilioSid && twilioAuthToken ? twilio(twilioSid, twilioAuthToken) : null;

function normalizePhone(phone: string) {
  const cleaned = phone.replace(/[^\d+]/g, "");

  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.length === 10) return `+1${cleaned}`;
  if (cleaned.length === 11 && cleaned.startsWith("1")) return `+${cleaned}`;

  return cleaned;
}

function getStatusCallbackUrl(path: string) {
  if (!baseUrl) return undefined;

  try {
    const url = new URL(baseUrl);

    if (
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.protocol !== "https:"
    ) {
      return undefined;
    }

    return `${baseUrl}${path}`;
  } catch {
    return undefined;
  }
}

export async function sendSmsMessage(
  input: OutreachSendInput
): Promise<OutreachSendResult> {
  if (!input.recipientPhone) {
    return {
      success: false,
      error: "Missing recipient phone number.",
    };
  }

  if (!twilioSid) {
    return {
      success: false,
      error: "TWILIO_ACCOUNT_SID is missing.",
    };
  }

  if (!twilioAuthToken) {
    return {
      success: false,
      error: "TWILIO_AUTH_TOKEN is missing.",
    };
  }

  if (!twilioSmsFrom) {
    return {
      success: false,
      error: "TWILIO_SMS_FROM is missing.",
    };
  }

  if (!client) {
    return {
      success: false,
      error: "SMS provider is not initialized.",
    };
  }

  try {
    const toPhone = normalizePhone(input.recipientPhone);

    if (!toPhone.startsWith("+")) {
      return {
        success: false,
        error: "Recipient phone number is not in valid international format.",
      };
    }

    const statusCallback = getStatusCallbackUrl("/api/webhooks/twilio/sms");

    const message = await client.messages.create({
      from: twilioSmsFrom,
      to: toPhone,
      body: input.body,
      ...(statusCallback ? { statusCallback } : {}),
    });

    return {
      success: true,
      providerMessageId: message.sid,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send SMS.",
    };
  }
}