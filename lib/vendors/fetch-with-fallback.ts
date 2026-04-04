type FetchVendorHtmlOptions = {
  jsRender?: boolean;
  premiumProxy?: boolean;
};

type FetchVendorHtmlResult = {
  ok: boolean;
  status: number;
  html: string;
  provider: "zenrows" | "scrapfly" | "none";
};

function looksBlockedOrEmpty(html: string) {
  const text = html.toLowerCase();

  return (
    !html.trim() ||
    text.includes("enter the characters you see below") ||
    text.includes("sorry, we just need to make sure you're not a robot") ||
    text.includes("captcha") ||
    text.includes("automated access") ||
    text.includes("account is not longer valid") ||
    text.includes("auth005")
  );
}

function buildZenRowsUrl(targetUrl: string, options?: FetchVendorHtmlOptions) {
  const apiKey = process.env.ZENROWS_API_KEY;

  if (!apiKey) {
    throw new Error("ZENROWS_API_KEY is missing in environment variables");
  }

  const params = new URLSearchParams({
    apikey: apiKey,
    url: targetUrl,
    js_render: options?.jsRender ? "true" : "false",
    premium_proxy: options?.premiumProxy ? "true" : "false",
  });

  return `https://api.zenrows.com/v1/?${params.toString()}`;
}

async function fetchViaZenRows(
  targetUrl: string,
  options?: FetchVendorHtmlOptions
): Promise<FetchVendorHtmlResult> {
  try {
    const zenRowsUrl = buildZenRowsUrl(targetUrl, options);

    const res = await fetch(zenRowsUrl, {
      method: "GET",
      cache: "no-store",
    });

    const html = await res.text().catch(() => "");

    console.log(
      `[fetchViaZenRows] status=${res.status} jsRender=${!!options?.jsRender} premiumProxy=${!!options?.premiumProxy} url=${targetUrl}`
    );

    return {
      ok: res.ok && !looksBlockedOrEmpty(html),
      status: res.status,
      html,
      provider: "zenrows",
    };
  } catch (error) {
    console.error("ZenRows fetch failed:", error);

    return {
      ok: false,
      status: 0,
      html: "",
      provider: "zenrows",
    };
  }
}

function buildScrapflyUrl(targetUrl: string, options?: FetchVendorHtmlOptions) {
  const apiKey = process.env.SCRAPFLY_API_KEY;

  if (!apiKey) {
    throw new Error("SCRAPFLY_API_KEY is missing in environment variables");
  }

  const params = new URLSearchParams({
    key: apiKey,
    url: targetUrl,
    country: "ca",
    render_js: options?.jsRender ? "true" : "false",
    asp: "true",
  });

  return `https://api.scrapfly.io/scrape?${params.toString()}`;
}

async function fetchViaScrapfly(
  targetUrl: string,
  options?: FetchVendorHtmlOptions
): Promise<FetchVendorHtmlResult> {
  try {
    const scrapflyUrl = buildScrapflyUrl(targetUrl, options);

    const res = await fetch(scrapflyUrl, {
      method: "GET",
      cache: "no-store",
    });

    const raw = await res.text().catch(() => "");
    let html = raw;

    try {
      const parsed = JSON.parse(raw);
      html =
        parsed?.result?.content ??
        parsed?.result?.browser_data?.content ??
        raw;
    } catch {
      html = raw;
    }

    console.log(
      `[fetchViaScrapfly] status=${res.status} jsRender=${!!options?.jsRender} premiumProxy=${!!options?.premiumProxy} url=${targetUrl}`
    );

    return {
      ok: res.ok && !looksBlockedOrEmpty(html),
      status: res.status,
      html,
      provider: "scrapfly",
    };
  } catch (error) {
    console.error("Scrapfly fetch failed:", error);

    return {
      ok: false,
      status: 0,
      html: "",
      provider: "scrapfly",
    };
  }
}

export async function fetchVendorHtml(
  targetUrl: string,
  options?: FetchVendorHtmlOptions
): Promise<FetchVendorHtmlResult> {
  const providerMode = (process.env.SCRAPE_PROVIDER ?? "").toLowerCase().trim();

  const zenrowsEnabled = !!process.env.ZENROWS_API_KEY;
  const scrapflyEnabled = !!process.env.SCRAPFLY_API_KEY;

  if (providerMode === "scrapfly") {
    if (!scrapflyEnabled) {
      return {
        ok: false,
        status: 0,
        html: "",
        provider: "none",
      };
    }

    const scrapfly = await fetchViaScrapfly(targetUrl, options);

    if (!scrapfly.ok) {
      console.log(
        `Scrapfly unusable for ${targetUrl} status=${scrapfly.status}`
      );
    }

    return scrapfly;
  }

  if (providerMode === "zenrows") {
    if (!zenrowsEnabled) {
      return {
        ok: false,
        status: 0,
        html: "",
        provider: "none",
      };
    }

    const zen = await fetchViaZenRows(targetUrl, options);

    if (!zen.ok) {
      console.log(`ZenRows unusable for ${targetUrl} status=${zen.status}`);
    }

    return zen;
  }

  if (zenrowsEnabled) {
    const zen = await fetchViaZenRows(targetUrl, options);

    if (zen.ok) return zen;

    console.log(`ZenRows unusable for ${targetUrl} status=${zen.status}`);
  }

  if (scrapflyEnabled) {
    const scrapfly = await fetchViaScrapfly(targetUrl, options);

    if (scrapfly.ok) return scrapfly;

    console.log(`Scrapfly unusable for ${targetUrl} status=${scrapfly.status}`);
    return scrapfly;
  }

  return {
    ok: false,
    status: 0,
    html: "",
    provider: "none",
  };
}