import type { OutreachSendInput, OutreachSendResult } from "./types";

export async function sendWhatsAppMessage(
  input: OutreachSendInput
): Promise<OutreachSendResult> {
  if (!input.recipientPhone) {
    return {
      success: false,
      error: "Missing WhatsApp number.",
    };
  }

  return {
    success: true,
    providerMessageId: `wa_${Date.now()}`,
  };
}