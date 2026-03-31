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
};

export type WorkshopScrapeRequest = {
  city?: string;
  province?: string;
  category?: string;
  query?: string;
  pages?: number;
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
  }>;
};