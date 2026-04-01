"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type ScrapeItem = {
  shopName: string;
  status: "created" | "updated" | "skipped";
  reason?: string;
  platform?: string;
  leadScore?: number | null;
  contactQuality?: "high" | "medium" | "low" | null;
};

type ScrapeResponse = {
  ok: boolean;
  error?: string;
  query?: string;
  city?: string;
  province?: string;
  category?: string;
  pages?: number;
  total?: number;
  created?: number;
  updated?: number;
  skipped?: number;
  items?: ScrapeItem[];
  selectedSources?: string[];
  supportedSources?: string[];
  unsupportedSources?: string[];
  queryList?: string[];
};

function badgeClass(status: string) {
  if (status === "created") return "bg-emerald-100 text-emerald-700";
  if (status === "updated") return "bg-sky-100 text-sky-700";
  if (status === "skipped") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

function qualityClass(value?: string | null) {
  if (value === "high") return "bg-emerald-100 text-emerald-700";
  if (value === "medium") return "bg-amber-100 text-amber-700";
  if (value === "low") return "bg-rose-100 text-rose-700";
  return "bg-slate-100 text-slate-700";
}

const ALL_SOURCES = [
  { value: "zenrows_yellowpages", label: "Yellow Pages", live: true },
  { value: "zenrows_yelp", label: "Yelp", live: true },
  { value: "zenrows_google_business", label: "Google Business", live: false },
  { value: "zenrows_facebook_page", label: "Facebook Page", live: false },
  { value: "zenrows_instagram_page", label: "Instagram Page", live: false },
];

export default function AdminOutreachScrapePage() {
  const [city, setCity] = useState("Greater Sudbury");
  const [province, setProvince] = useState("Ontario");
  const [category, setCategory] = useState("Body Shop");
  const [query, setQuery] = useState("auto body shop");
  const [pages, setPages] = useState(3);

  const [sources, setSources] = useState<string[]>([
    "zenrows_yellowpages",
    "zenrows_yelp",
  ]);

  const [alternateQueries, setAlternateQueries] = useState(
    "collision center\nauto repair shop\ncar mechanic"
  );
  const [includeKeywords, setIncludeKeywords] = useState("body shop\ncollision\nauto repair");
  const [excludeKeywords, setExcludeKeywords] = useState("car wash\ndetailing\ntowing");

  const [requirePhone, setRequirePhone] = useState(true);
  const [requireWebsite, setRequireWebsite] = useState(false);
  const [requireEmail, setRequireEmail] = useState(false);
  const [preferDirectPhone, setPreferDirectPhone] = useState(false);
  const [allowVirtualNumbers, setAllowVirtualNumbers] = useState(true);
  const [preferWhatsappCapable, setPreferWhatsappCapable] = useState(false);

  const [minimumReviews, setMinimumReviews] = useState(0);
  const [minimumRating, setMinimumRating] = useState(0);
  const [maxItemsPerSource, setMaxItemsPerSource] = useState(100);
  const [outreachGoal, setOutreachGoal] = useState<
    "mixed" | "call" | "whatsapp" | "sms" | "email" | "social"
  >("mixed");
  const [adminNotes, setAdminNotes] = useState(
    "Prefer authentic business leads with usable contact details."
  );

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ScrapeResponse | null>(null);

  const liveCount = useMemo(
    () => ALL_SOURCES.filter((s) => s.live && sources.includes(s.value)).length,
    [sources]
  );

  function toggleSource(source: string) {
    setSources((prev) =>
      prev.includes(source)
        ? prev.filter((item) => item !== source)
        : [...prev, source]
    );
  }

  async function runScrape() {
    setLoading(true);
    setMessage("");
    setResult(null);

    try {
      const res = await fetch("/api/admin/outreach/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          city,
          province,
          category,
          query,
          pages,
          sources,
          alternateQueries,
          includeKeywords,
          excludeKeywords,
          requirePhone,
          requireWebsite,
          requireEmail,
          preferDirectPhone,
          allowVirtualNumbers,
          preferWhatsappCapable,
          minimumReviews,
          minimumRating,
          maxItemsPerSource,
          outreachGoal,
          adminNotes,
        }),
      });

      const data: ScrapeResponse = await res.json();

      if (!res.ok || !data.ok) {
        setMessage(data.error || "Scrape failed.");
        setLoading(false);
        return;
      }

      setResult(data);
      setMessage("Scrape completed successfully.");
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong while running scrape.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black text-slate-900">
              Scrape Workshop Leads
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-600">
              Use ZenRows to collect high-volume workshop leads, apply admin rules,
              and save better-quality outreach data.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/outreach/leads"
              className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-900 hover:bg-slate-50"
            >
              View Saved Leads
            </Link>

            <Link
              href="/admin/outreach"
              className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-900 hover:bg-slate-50"
            >
              Back to Outreach
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <label className="text-sm font-bold text-slate-700">City</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
              placeholder="Greater Sudbury"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">Province</label>
            <input
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
              placeholder="Ontario"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">Category</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
              placeholder="Body Shop"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">Primary Query</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
              placeholder="auto body shop"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">Pages Per Source</label>
            <input
              type="number"
              min={1}
              max={20}
              value={pages}
              onChange={(e) => setPages(Number(e.target.value || 1))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
            />
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-bold text-slate-900">Platforms</div>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Live today: Yellow Pages and Yelp. Google Business, Facebook Page, and Instagram Page
            can be selected as admin guidance, but will be reported as unsupported until dedicated
            parsers are added.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {ALL_SOURCES.map((source) => (
              <label
                key={source.value}
                className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
              >
                <input
                  type="checkbox"
                  checked={sources.includes(source.value)}
                  onChange={() => toggleSource(source.value)}
                  className="mt-1"
                />
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {source.label}
                  </div>
                  <div
                    className={`mt-1 inline-flex rounded-full px-2 py-1 text-[11px] font-bold ${
                      source.live
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {source.live ? "live" : "planned"}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          <div>
            <label className="text-sm font-bold text-slate-700">
              Alternate Queries
            </label>
            <textarea
              rows={5}
              value={alternateQueries}
              onChange={(e) => setAlternateQueries(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
              placeholder={`collision center\nauto repair shop\nmechanic`}
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">
              Admin Notes / Guidance
            </label>
            <textarea
              rows={5}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
              placeholder="Prefer authentic business leads with real contact details."
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          <div>
            <label className="text-sm font-bold text-slate-700">
              Include Keywords
            </label>
            <textarea
              rows={4}
              value={includeKeywords}
              onChange={(e) => setIncludeKeywords(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
              placeholder={`body shop\ncollision\nauto repair`}
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">
              Exclude Keywords
            </label>
            <textarea
              rows={4}
              value={excludeKeywords}
              onChange={(e) => setExcludeKeywords(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
              placeholder={`car wash\ndetailing\ntowing`}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="text-sm font-bold text-slate-700">Outreach Goal</label>
            <select
              value={outreachGoal}
              onChange={(e) =>
                setOutreachGoal(
                  e.target.value as "mixed" | "call" | "whatsapp" | "sms" | "email" | "social"
                )
              }
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
            >
              <option value="mixed">mixed</option>
              <option value="call">call</option>
              <option value="whatsapp">whatsapp</option>
              <option value="sms">sms</option>
              <option value="email">email</option>
              <option value="social">social</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">Minimum Reviews</label>
            <input
              type="number"
              min={0}
              value={minimumReviews}
              onChange={(e) => setMinimumReviews(Number(e.target.value || 0))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">Minimum Rating</label>
            <input
              type="number"
              min={0}
              max={5}
              step="0.1"
              value={minimumRating}
              onChange={(e) => setMinimumRating(Number(e.target.value || 0))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">Max Leads Per Source</label>
            <input
              type="number"
              min={10}
              max={300}
              value={maxItemsPerSource}
              onChange={(e) => setMaxItemsPerSource(Number(e.target.value || 100))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
            />
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">
            <input
              type="checkbox"
              checked={requirePhone}
              onChange={(e) => setRequirePhone(e.target.checked)}
            />
            Require phone
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">
            <input
              type="checkbox"
              checked={requireWebsite}
              onChange={(e) => setRequireWebsite(e.target.checked)}
            />
            Require website
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">
            <input
              type="checkbox"
              checked={requireEmail}
              onChange={(e) => setRequireEmail(e.target.checked)}
            />
            Require email
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">
            <input
              type="checkbox"
              checked={preferDirectPhone}
              onChange={(e) => setPreferDirectPhone(e.target.checked)}
            />
            Prefer direct phone
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">
            <input
              type="checkbox"
              checked={allowVirtualNumbers}
              onChange={(e) => setAllowVirtualNumbers(e.target.checked)}
            />
            Allow virtual / tracking numbers
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">
            <input
              type="checkbox"
              checked={preferWhatsappCapable}
              onChange={(e) => setPreferWhatsappCapable(e.target.checked)}
            />
            Prefer WhatsApp-capable contacts
          </label>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={runScrape}
            disabled={loading || sources.length === 0 || liveCount === 0}
            className="rounded-full bg-slate-900 px-6 py-3 text-sm font-extrabold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Running Scrape..." : "Run Scrape"}
          </button>

          <Link
            href="/admin/outreach/leads"
            className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-extrabold text-slate-900 hover:bg-slate-50"
          >
            Review Leads
          </Link>
        </div>

        {message ? (
          <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
            {message}
          </div>
        ) : null}
      </div>

      {result ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Total Parsed
              </div>
              <div className="mt-3 text-3xl font-black text-slate-900">
                {result.total ?? 0}
              </div>
            </div>

            <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
              <div className="text-sm font-bold uppercase tracking-wide text-emerald-700">
                Created
              </div>
              <div className="mt-3 text-3xl font-black text-emerald-900">
                {result.created ?? 0}
              </div>
            </div>

            <div className="rounded-[24px] border border-sky-200 bg-sky-50 p-5 shadow-sm">
              <div className="text-sm font-bold uppercase tracking-wide text-sky-700">
                Updated
              </div>
              <div className="mt-3 text-3xl font-black text-sky-900">
                {result.updated ?? 0}
              </div>
            </div>

            <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-5 shadow-sm">
              <div className="text-sm font-bold uppercase tracking-wide text-amber-700">
                Skipped
              </div>
              <div className="mt-3 text-3xl font-black text-amber-900">
                {result.skipped ?? 0}
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <div className="text-2xl font-black text-slate-900">
                Scrape Results
              </div>
              <p className="mt-1 text-sm font-medium text-slate-600">
                Query: {result.query || "-"} • {result.city || "-"},{" "}
                {result.province || "-"} • Category: {result.category || "-"} •
                Pages: {result.pages || 0}
              </p>

              {!!result.queryList?.length && (
                <p className="mt-2 text-xs font-medium text-slate-500">
                  Query set: {result.queryList.join(" • ")}
                </p>
              )}

              {!!result.unsupportedSources?.length && (
                <div className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                  Unsupported right now: {result.unsupportedSources.join(", ")}
                </div>
              )}
            </div>

            {!result.items?.length ? (
              <div className="mt-6 text-sm font-medium text-slate-600">
                No rows returned.
              </div>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="px-3 py-3 font-bold">Shop</th>
                      <th className="px-3 py-3 font-bold">Platform</th>
                      <th className="px-3 py-3 font-bold">Score</th>
                      <th className="px-3 py-3 font-bold">Quality</th>
                      <th className="px-3 py-3 font-bold">Status</th>
                      <th className="px-3 py-3 font-bold">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.items.map((item, index) => (
                      <tr
                        key={`${item.shopName}-${index}`}
                        className="border-b border-slate-100"
                      >
                        <td className="px-3 py-3 font-semibold text-slate-900">
                          {item.shopName}
                        </td>
                        <td className="px-3 py-3 text-slate-700">
                          {item.platform || "—"}
                        </td>
                        <td className="px-3 py-3 text-slate-700">
                          {item.leadScore ?? "—"}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${qualityClass(
                              item.contactQuality
                            )}`}
                          >
                            {item.contactQuality || "—"}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${badgeClass(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-slate-700">
                          {item.reason || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}