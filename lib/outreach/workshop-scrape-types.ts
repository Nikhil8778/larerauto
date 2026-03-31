export type WorkshopScrapeInput = {
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
  scrapedAt?: string | Date | null;
};

export type WorkshopScrapePayload = {
  leads: WorkshopScrapeInput[];
  defaults?: {
    city?: string;
    province?: string;
    category?: string;
    source?: string;
  };
};

export type WorkshopScrapeResultRow = {
  shopName: string;
  status: "created" | "updated" | "skipped";
  leadId?: string;
  reason?: string;
};

export type WorkshopScrapeSummary = {
  ok: true;
  received: number;
  created: number;
  updated: number;
  skipped: number;
  results: WorkshopScrapeResultRow[];
};