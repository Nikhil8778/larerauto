type AuthenticityTier = "high" | "medium" | "low";

type LeadInput = {
  scrapePlatform?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  facebookPageUrl?: string | null;
  instagramPageUrl?: string | null;
  reviewCount?: number | null;
  rating?: number | null;
  isVirtualPhone?: boolean | null;
  hasWhatsappLink?: boolean | null;
  hasMessengerLink?: boolean | null;
};

export function evaluateLeadAuthenticity(lead: LeadInput): {
  leadScore: number;
  authenticityTier: AuthenticityTier;
  contactQuality: AuthenticityTier;
} {
  let score = 0;

  if (lead.scrapePlatform === "zenrows_google_business") score += 36;
  if (lead.scrapePlatform === "zenrows_facebook_page") score += 24;
  if (lead.scrapePlatform === "zenrows_yellowpages") score += 18;
  if (lead.scrapePlatform === "zenrows_yelp") score += 16;

  if (lead.phone) score += 14;
  if (lead.email) score += 18;
  if (lead.website) score += 18;
  if (lead.facebookPageUrl) score += 8;
  if (lead.instagramPageUrl) score += 6;
  if (lead.hasWhatsappLink) score += 8;
  if (lead.hasMessengerLink) score += 5;

  if ((lead.reviewCount ?? 0) >= 5) score += 8;
  if ((lead.reviewCount ?? 0) >= 20) score += 10;
  if ((lead.reviewCount ?? 0) >= 50) score += 6;

  if ((lead.rating ?? 0) >= 3.5) score += 6;
  if ((lead.rating ?? 0) >= 4.0) score += 6;
  if ((lead.rating ?? 0) >= 4.5) score += 6;

  if (lead.isVirtualPhone) score -= 12;

  const leadScore = Math.max(0, Math.min(100, Math.round(score)));

  let authenticityTier: AuthenticityTier;
  if (leadScore >= 80) authenticityTier = "high";
  else if (leadScore >= 55) authenticityTier = "medium";
  else authenticityTier = "low";

  const contactQuality: AuthenticityTier = authenticityTier;

  return {
    leadScore,
    authenticityTier,
    contactQuality,
  };
}