import { NextResponse } from "next/server";

function buildZenRowsUrl(targetUrl: string, jsRender = false) {
  const apiKey = process.env.ZENROWS_API_KEY;

  if (!apiKey) {
    throw new Error("ZENROWS_API_KEY is missing in environment variables");
  }

  const params = new URLSearchParams({
    apikey: apiKey,
    url: targetUrl,
    js_render: jsRender ? "true" : "false",
    premium_proxy: "true",
  });

  return `https://api.zenrows.com/v1/?${params.toString()}`;
}

export async function GET() {
  try {
    const targetUrl =
      "https://www.amazon.ca/s?k=2023+BMW+X1+2.0L+Turbo+Alternator";

    const zenRowsUrl = buildZenRowsUrl(targetUrl, false);

    const res = await fetch(zenRowsUrl, {
      method: "GET",
      cache: "no-store",
    });

    const text = await res.text();

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      hasApiKey: Boolean(process.env.ZENROWS_API_KEY),
      envKeyPrefix: process.env.ZENROWS_API_KEY
        ? `${process.env.ZENROWS_API_KEY.slice(0, 6)}...`
        : null,
      finalUrl: zenRowsUrl.slice(0, 180),
      responsePreview: text.slice(0, 1500),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
        hasApiKey: Boolean(process.env.ZENROWS_API_KEY),
      },
      { status: 500 }
    );
  }
}