type LeadInput = {
  phone?: string | null;
  whatsappNumber?: string | null;
  email?: string | null;
  website?: string | null;
  facebookPageUrl?: string | null;
  instagramPageUrl?: string | null;
  hasWhatsappLink?: boolean | null;
  hasMessengerLink?: boolean | null;
  isVirtualPhone?: boolean | null;
};

export function classifyLeadChannels(lead: LeadInput) {
  const isWhatsappQuality =
    Boolean(lead.whatsappNumber) ||
    Boolean(lead.hasWhatsappLink) ||
    (Boolean(lead.phone) && !lead.isVirtualPhone);

  const isEmailQuality = Boolean(lead.email) || Boolean(lead.website);

  const isSocialOnly =
    !lead.phone &&
    !lead.email &&
    (Boolean(lead.facebookPageUrl) ||
      Boolean(lead.instagramPageUrl) ||
      Boolean(lead.hasMessengerLink));

  const isCallOnly =
    Boolean(lead.phone) &&
    !isWhatsappQuality &&
    !lead.email &&
    !lead.website;

  let bestContactChannel = "mixed";

  if (isWhatsappQuality) bestContactChannel = "whatsapp";
  else if (isEmailQuality) bestContactChannel = "email";
  else if (isCallOnly) bestContactChannel = "call";
  else if (isSocialOnly) bestContactChannel = "social";

  return {
    isWhatsappQuality,
    isCallOnly,
    isEmailQuality,
    isSocialOnly,
    bestContactChannel,
  };
}