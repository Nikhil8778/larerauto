import type { OutreachSendInput, OutreachSendResult } from "./types";

export async function sendSmsMessage(
  input: OutreachSendInput
): Promise<OutreachSendResult> {
  if (!input.recipientPhone) {
    return {
      success: false,
      error: "Missing recipient phone number.",
    };
  }

  return {
    success: true,
    providerMessageId: `sms_${Date.now()}`,
  };
}