import * as cheerio from "cheerio";

export function cleanText(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

export function extractPriceCentsFromText(text: string): number | null {
  const cleaned = cleanText(text);

  const patterns = [
    /\$?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2}))/,
    /([0-9]+\.[0-9]{2})/,
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match?.[1]) {
      const amount = Number(match[1].replace(/,/g, ""));
      if (Number.isFinite(amount)) {
        return Math.round(amount * 100);
      }
    }
  }

  return null;
}

export function getMetaContent($: cheerio.CheerioAPI, attrValue: string) {
  const selectors = [
    `meta[property="${attrValue}"]`,
    `meta[name="${attrValue}"]`,
  ];

  for (const selector of selectors) {
    const value = $(selector).attr("content");
    if (value) return cleanText(value);
  }

  return "";
}

export function buildDefaultHeaders() {
  return {
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    "accept-language": "en-CA,en;q=0.9",
    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    pragma: "no-cache",
    "cache-control": "no-cache",
  };
}