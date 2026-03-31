"use client";

import Link from "next/link";
import { useState } from "react";

type ScrapeItem = {
  shopName: string;
  status: "created" | "updated" | "skipped";
  reason?: string;
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
};

function badgeClass(status: string) {
  if (status === "created") return "bg-emerald-100 text-emerald-700";
  if (status === "updated") return "bg-sky-100 text-sky-700";
  if (status === "skipped") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

export default function AdminOutreachScrapePage() {
  const [city, setCity] = useState("Greater Sudbury");
  const [province, setProvince] = useState("Ontario");
  const [category, setCategory] = useState("Body Shop");
  const [query, setQuery] = useState("auto body shop");
  const [pages, setPages] = useState(2);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ScrapeResponse | null>(null);

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
          source: "zenrows_yellowpages",
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
              Collect bodyshops and workshop leads through ZenRows and save them
              to your outreach database.
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
            <label className="text-sm font-bold text-slate-700">Query</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
              placeholder="auto body shop"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">Pages</label>
            <input
              type="number"
              min={1}
              max={10}
              value={pages}
              onChange={(e) => setPages(Number(e.target.value || 1))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={runScrape}
            disabled={loading}
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