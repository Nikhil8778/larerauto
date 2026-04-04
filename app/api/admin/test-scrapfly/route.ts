import { NextResponse } from "next/server";

function buildScrapflyUrl(targetUrl: string) {
  const apiKey = process.env.SCRAPFLY_API_KEY;

  if (!apiKey) {
    throw new Error("SCRAPFLY_API_KEY is missing");
  }

  const params = new URLSearchParams({
    key: apiKey,
    url: targetUrl,
    country: "ca",
    render_js: "false",
    asp: "true",
  });

  return `https://api.scrapfly.io/scrape?${params.toString()}`;
}

export async function GET() {
  try {
    const apiKey = process.env.SCRAPFLY_API_KEY ?? "";
    const finalUrl = buildScrapflyUrl("https://www.amazon.ca/s?k=2015+Ford+F-150+3.5L+EcoBoost+Alternators");

    const res = await fetch(finalUrl, {
      method: "GET",
      cache: "no-store",
    });

    const text = await res.text().catch(() => "");

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      hasApiKey: Boolean(apiKey),
      apiKeyPrefix: apiKey ? `${apiKey.slice(0, 6)}...` : "",
      finalUrlPreview: finalUrl.replace(apiKey, `${apiKey.slice(0, 6)}***`),
      responsePreview: text.slice(0, 1200),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}