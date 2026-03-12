function cleanText(value: string | undefined | null) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function parsePriceTextToCents(text: string) {
  const cleaned = cleanText(text).replace(/,/g, "");
  const match = cleaned.match(/(\d+)(?:\.(\d{2}))?/);

  if (!match) return null;

  const whole = match[1] ?? "";
  const fraction = match[2] ?? "00";

  const amount = Number(`${whole}.${fraction}`);
  if (!Number.isFinite(amount)) return null;

  return Math.round(amount * 100);
}

function extractAllPriceTexts(html: string) {
  const matches = [...html.matchAll(/\$ ?\d[\d,]*(?:\.\d{2})?/g)];
  return matches.map((m) => cleanText(m[0])).filter(Boolean);
}

function extractBestVisiblePrice(html: string) {
  const selectors = [
    /class="a-offscreen">\$ ?([\d,]+(?:\.\d{2})?)</g,
    /id="priceblock_ourprice"[^>]*>\$ ?([\d,]+(?:\.\d{2})?)</g,
    /id="priceblock_dealprice"[^>]*>\$ ?([\d,]+(?:\.\d{2})?)</g,
    /id="price_inside_buybox"[^>]*>\$ ?([\d,]+(?:\.\d{2})?)</g,
    /"priceAmount":"([\d,]+(?:\.\d{2})?)"/g,
  ];

  const prices: number[] = [];

  for (const regex of selectors) {
    const matches = [...html.matchAll(regex)];
    for (const match of matches) {
      const value = match[1];
      if (!value) continue;
      const cents = parsePriceTextToCents(value);
      if (cents !== null) prices.push(cents);
    }
  }

  if (prices.length > 0) {
    return prices[0];
  }

  const fallbackTexts = extractAllPriceTexts(html);
  for (const text of fallbackTexts) {
    const cents = parsePriceTextToCents(text);
    if (cents !== null) return cents;
  }

  return null;
}

function extractAsin(url: string) {
  const dpMatch = url.match(/\/dp\/([A-Z0-9]{10})/i);
  if (dpMatch?.[1]) return dpMatch[1];

  const gpMatch = url.match(/\/gp\/product\/([A-Z0-9]{10})/i);
  if (gpMatch?.[1]) return gpMatch[1];

  return null;
}

export async function fetchAmazonProductPagePrice(productUrl: string) {
  try {
    const asin = extractAsin(productUrl);
    const url = asin
      ? `https://www.amazon.ca/dp/${asin}`
      : productUrl;

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "en-CA,en;q=0.9",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.log("Amazon product page non-OK status:", res.status, url);
      return {
        priceCents: null as number | null,
        rawText: null as string | null,
      };
    }

    const html = await res.text();
    const priceCents = extractBestVisiblePrice(html);

    const fitmentConfirmed =
      /amazonconfirmedfit/i.test(html) ||
      /confirmed fit/i.test(html) ||
      /this fits your/i.test(html);

    const cannotConfirmFit =
      /cannot confirm fit/i.test(html) ||
      /does not fit/i.test(html);

    return {
      priceCents,
      rawText: `fitmentConfirmed=${fitmentConfirmed};cannotConfirmFit=${cannotConfirmFit}`,
    };
  } catch (error) {
    console.error("Amazon product page scrape failed:", error);
    return {
      priceCents: null as number | null,
      rawText: null as string | null,
    };
  }
}