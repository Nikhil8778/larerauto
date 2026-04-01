export type WorkshopLeadScrapeInput = {
  shopName: string;
  contactName?: string | null;
  phone?: string | null;
  whatsappNumber?: string | null;
  email?: string | null;
  website?: string | null;
  addressLine1?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  googleMapsUrl?: string | null;
  category?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  source?: string | null;
  notes?: string | null;
  scrapedAt?: Date | string | null;

  scrapePlatform?: string | null;
  scrapeQuery?: string | null;
  contactQuality?: "high" | "medium" | "low" | null;
  leadScore?: number | null;
  phoneSource?: string | null;
  isVirtualPhone?: boolean | null;
  outreachGoal?: string | null;
  adminNotes?: string | null;
};

export type WorkshopScrapeRequest = {
  city?: string;
  province?: string;
  category?: string;
  query?: string;
  pages?: number;

  sources?: string[];
  alternateQueries?: string[];
  includeKeywords?: string[];
  excludeKeywords?: string[];

  requirePhone?: boolean;
  requireWebsite?: boolean;
  requireEmail?: boolean;
  preferDirectPhone?: boolean;
  allowVirtualNumbers?: boolean;
  preferWhatsappCapable?: boolean;

  minimumReviews?: number;
  minimumRating?: number;
  maxItemsPerSource?: number;

  outreachGoal?: "mixed" | "call" | "whatsapp" | "sms" | "email" | "social";
  adminNotes?: string;

  source?: string;
};

export type WorkshopScrapeSaveResult = {
  created: number;
  updated: number;
  skipped: number;
  total: number;
  items: Array<{
    shopName: string;
    status: "created" | "updated" | "skipped";
    reason?: string;
    platform?: string;
    leadScore?: number | null;
    contactQuality?: "high" | "medium" | "low" | null;
  }>;
};