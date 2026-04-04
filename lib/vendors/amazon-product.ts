import { fetchVendorHtml } from "./fetch-with-fallback";

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

function extractSellerOrStoreName(html: string) {
  const patterns = [
    /Visit the ([^<"]+?) Store/gi,
    /Sold by<\/span>.*?<span[^>]*>([^<]+)</gi,
    /Ships from<\/span>.*?<span[^>]*>([^<]+)</gi,
    /storeName":"([^"]+)"/gi,
    /merchantName":"([^"]+)"/gi,
  ];

  for (const regex of patterns) {
    const match = regex.exec(html);
    if (match?.[1]) {
      return cleanText(match[1]);
    }
  }

  const text = cleanText(html.replace(/<[^>]+>/g, " "));
  const sellerLineMatch =
    text.match(/visit the\s+(.+?)\s+store/i) ||
    text.match(/sold by\s+(.+?)(?:\s+ships from|\s+returns|\s+payment|$)/i);

  return sellerLineMatch?.[1] ? cleanText(sellerLineMatch[1]) : null;
}

function extractInventorySignal(html: string) {
  const text = cleanText(html.replace(/<[^>]+>/g, " "));

  const onlyLeft = text.match(/only\s+(\d+)\s+left in stock/i);
  if (onlyLeft?.[1]) {
    return {
      inventoryCount: Number(onlyLeft[1]),
      inventoryText: `Only ${onlyLeft[1]} left in stock`,
      inStock: true,
    };
  }

  if (/in stock/i.test(text)) {
    return {
      inventoryCount: null as number | null,
      inventoryText: "In stock",
      inStock: true,
    };
  }

  if (/currently unavailable|out of stock/i.test(text)) {
    return {
      inventoryCount: 0,
      inventoryText: "Out of stock",
      inStock: false,
    };
  }

  return {
    inventoryCount: null as number | null,
    inventoryText: null as string | null,
    inStock: null as boolean | null,
  };
}

function isPreferredSupplierName(value: string | null | undefined) {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return (
    normalized.includes("logel") ||
    normalized.includes("logels") ||
    normalized.includes("logel's")
  );
}

export async function fetchAmazonProductPagePrice(productUrl: string) {
  try {
    const asin = extractAsin(productUrl);
    const url = asin ? `https://www.amazon.ca/dp/${asin}` : productUrl;

    let fetched = await fetchVendorHtml(url, {
      jsRender: false,
      premiumProxy: false,
    });

    if (!fetched.ok) {
      fetched = await fetchVendorHtml(url, {
        jsRender: true,
        premiumProxy: true,
      });
    }

    if (!fetched.ok) {
      return {
        priceCents: null as number | null,
        rawText: null as string | null,
      };
    }

    const html = fetched.html;
    const priceCents = extractBestVisiblePrice(html);

    const fitmentConfirmed =
      /amazonconfirmedfit/i.test(html) ||
      /confirmed fit/i.test(html) ||
      /this fits your/i.test(html);

    const cannotConfirmFit =
      /cannot confirm fit/i.test(html) ||
      /does not fit/i.test(html);

    const sellerOrStore = extractSellerOrStoreName(html);
    const inventory = extractInventorySignal(html);
    const preferredSupplier = isPreferredSupplierName(sellerOrStore);

    return {
      priceCents,
      rawText: [
        `provider=${fetched.provider}`,
        `fitmentConfirmed=${fitmentConfirmed}`,
        `cannotConfirmFit=${cannotConfirmFit}`,
        sellerOrStore ? `sellerStore=${sellerOrStore}` : null,
        `preferredSupplier=${preferredSupplier}`,
        inventory.inventoryText ? `inventoryText=${inventory.inventoryText}` : null,
        inventory.inventoryCount !== null
          ? `inventoryCount=${inventory.inventoryCount}`
          : null,
        inventory.inStock !== null ? `pageInStock=${inventory.inStock}` : null,
      ]
        .filter(Boolean)
        .join(";"),
    };
  } catch (error) {
    console.error("Amazon product page scrape failed:", error);
    return {
      priceCents: null as number | null,
      rawText: null as string | null,
    };
  }
}