import { NextRequest, NextResponse } from "next/server";
import { upsertWorkshopLead } from "@/lib/outreach/upsert-workshop-lead";
import type {
  WorkshopScrapePayload,
  WorkshopScrapeSummary,
} from "@/lib/outreach/workshop-scrape-types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as WorkshopScrapePayload;

    const leads = Array.isArray(body?.leads) ? body.leads : [];
    const defaults = body?.defaults || {};

    if (!leads.length) {
      return NextResponse.json(
        {
          ok: false,
          error: "No leads were provided.",
        },
        { status: 400 }
      );
    }

    const results = [];

    for (const lead of leads) {
      const result = await upsertWorkshopLead(lead, defaults);
      results.push(result);
    }

    const summary: WorkshopScrapeSummary = {
      ok: true,
      received: leads.length,
      created: results.filter((r) => r.status === "created").length,
      updated: results.filter((r) => r.status === "updated").length,
      skipped: results.filter((r) => r.status === "skipped").length,
      results,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error("POST /api/admin/outreach/scrape error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to process workshop scrape payload.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message:
      "POST scraped workshop leads here as JSON using { leads: [...], defaults?: {...} }",
  });
}