export type OutreachSendInput = {
  recipientName?: string | null;
  recipientPhone?: string | null;
  recipientEmail?: string | null;
  subject?: string | null;
  body: string;
  mediaUrl?: string | null;
};

export type OutreachSendResult = {
  success: boolean;
  providerMessageId?: string | null;
  error?: string | null;
};