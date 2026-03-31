export function normalizeSourceChannel(sourceChannel?: string | null) {
  const value = String(sourceChannel || "").trim().toLowerCase();
  return value || "website";
}

export function inferCustomerType(sourceChannel?: string | null) {
  const source = normalizeSourceChannel(sourceChannel);

  if (source === "mechanic_dashboard") return "approved_mechanic";
  if (source === "whatsapp_campaign") return "mechanic_prospect";

  return "retail";
}

export function inferPreferredReplyChannel(sourceChannel?: string | null) {
  const source = normalizeSourceChannel(sourceChannel);

  switch (source) {
    case "whatsapp_campaign":
      return "whatsapp";
    case "mechanic_dashboard":
      return "dashboard";
    case "facebook_marketplace":
    case "facebook":
    case "instagram":
    case "tiktok":
    case "kijiji":
    case "karrot":
      return "platform";
    case "website":
    case "seo":
    case "google_products":
    default:
      return "email";
  }
}

export function inferLastInboundChannel(sourceChannel?: string | null) {
  const source = normalizeSourceChannel(sourceChannel);

  switch (source) {
    case "whatsapp_campaign":
      return "whatsapp";
    case "mechanic_dashboard":
      return "dashboard";
    case "facebook_marketplace":
    case "facebook":
    case "instagram":
    case "tiktok":
    case "kijiji":
    case "karrot":
      return "platform";
    default:
      return "website";
  }
}