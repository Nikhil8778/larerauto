import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AddLeadForm from "./AddLeadForm";
import { deleteWorkshopLead, updateWorkshopLeadStatus } from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  platform?: string;
  channel?: string;
  quality?: string;
  authenticity?: string;
  status?: string;
}>;

function badgeClass(color: "slate" | "emerald" | "sky" | "amber" | "rose" | "violet") {
  switch (color) {
    case "emerald":
      return "bg-emerald-100 text-emerald-700";
    case "sky":
      return "bg-sky-100 text-sky-700";
    case "amber":
      return "bg-amber-100 text-amber-700";
    case "rose":
      return "bg-rose-100 text-rose-700";
    case "violet":
      return "bg-violet-100 text-violet-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-CA");
}

function platformBadge(value: string | null | undefined) {
  const text = String(value || "").toLowerCase();

  if (text.includes("google")) return badgeClass("emerald");
  if (text.includes("facebook")) return badgeClass("sky");
  if (text.includes("yellow")) return badgeClass("amber");
  if (text.includes("yelp")) return badgeClass("violet");

  return badgeClass("slate");
}

function channelBadge(value: string | null | undefined) {
  const text = String(value || "").toLowerCase();

  if (text === "whatsapp") return badgeClass("emerald");
  if (text === "call") return badgeClass("amber");
  if (text === "email") return badgeClass("sky");
  if (text === "social") return badgeClass("violet");
  if (text === "mixed") return badgeClass("slate");

  return badgeClass("slate");
}

function qualityBadge(value: string | null | undefined) {
  const text = String(value || "").toLowerCase();

  if (text === "high") return badgeClass("emerald");
  if (text === "medium") return badgeClass("amber");
  if (text === "low") return badgeClass("rose");

  return badgeClass("slate");
}

function leadStatusBadge(value: string | null | undefined) {
  const text = String(value || "").toLowerCase();

  if (text === "approved") return badgeClass("emerald");
  if (text === "contacted") return badgeClass("amber");
  if (text === "replied") return badgeClass("sky");
  if (text === "converted") return badgeClass("violet");
  if (text === "rejected") return badgeClass("rose");

  return badgeClass("slate");
}

export default async function OutreachLeadsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  const platform = sp.platform?.trim() || "";
  const channel = sp.channel?.trim() || "";
  const quality = sp.quality?.trim() || "";
  const authenticity = sp.authenticity?.trim() || "";
  const status = sp.status?.trim() || "";

  const leads = await prisma.workshopLead.findMany({
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: 300,
  });

  const filteredLeads = leads.filter((lead) => {
    if (platform && (lead.scrapePlatform || "") !== platform) return false;
    if (channel && (lead.bestContactChannel || "") !== channel) return false;
    if (quality && (lead.contactQuality || "") !== quality) return false;
    if (authenticity && (lead.authenticityTier || "") !== authenticity) return false;
    if (status && (lead.status || "") !== status) return false;
    return true;
  });

  const total = filteredLeads.length;
  const whatsappQualityCount = filteredLeads.filter((lead) => lead.isWhatsappQuality).length;
  const callOnlyCount = filteredLeads.filter((lead) => lead.isCallOnly).length;
  const emailQualityCount = filteredLeads.filter((lead) => lead.isEmailQuality).length;
  const socialOnlyCount = filteredLeads.filter((lead) => lead.isSocialOnly).length;
  const highQualityCount = filteredLeads.filter(
    (lead) => lead.contactQuality === "high"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-3xl font-black text-slate-900">Workshop Leads</div>
          <p className="mt-1 text-sm font-medium text-slate-600">
            Review scraped or manually added leads with contact quality and authenticity scoring.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/outreach/scrape"
            className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-900 hover:bg-slate-50"
          >
            Open Scraper
          </Link>

          <Link
            href="/admin/outreach/leads/import"
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-extrabold text-white hover:bg-slate-800"
          >
            Import CSV
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-bold uppercase tracking-wide text-slate-500">Filtered Leads</div>
          <div className="mt-3 text-3xl font-black text-slate-900">{total}</div>
        </div>

        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <div className="text-sm font-bold uppercase tracking-wide text-emerald-700">
            WhatsApp Quality
          </div>
          <div className="mt-3 text-3xl font-black text-emerald-900">
            {whatsappQualityCount}
          </div>
        </div>

        <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="text-sm font-bold uppercase tracking-wide text-amber-700">
            Call Only
          </div>
          <div className="mt-3 text-3xl font-black text-amber-900">{callOnlyCount}</div>
        </div>

        <div className="rounded-[24px] border border-sky-200 bg-sky-50 p-5 shadow-sm">
          <div className="text-sm font-bold uppercase tracking-wide text-sky-700">
            Email Quality
          </div>
          <div className="mt-3 text-3xl font-black text-sky-900">{emailQualityCount}</div>
        </div>

        <div className="rounded-[24px] border border-violet-200 bg-violet-50 p-5 shadow-sm">
          <div className="text-sm font-bold uppercase tracking-wide text-violet-700">
            Social / High Quality
          </div>
          <div className="mt-3 text-3xl font-black text-violet-900">
            {socialOnlyCount} / {highQualityCount}
          </div>
        </div>
      </div>

      <AddLeadForm />

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-2xl font-black text-slate-900">Filter Leads</div>
        <p className="mt-2 text-sm font-medium text-slate-600">
          Filter by scrape platform, best contact route, quality, authenticity, and lead status.
        </p>

        <form method="GET" className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <select
            name="platform"
            defaultValue={platform}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All Platforms</option>
            <option value="zenrows_yellowpages">zenrows_yellowpages</option>
            <option value="zenrows_yelp">zenrows_yelp</option>
            <option value="zenrows_google_business">zenrows_google_business</option>
            <option value="zenrows_facebook_page">zenrows_facebook_page</option>
          </select>

          <select
            name="channel"
            defaultValue={channel}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All Contact Channels</option>
            <option value="whatsapp">whatsapp</option>
            <option value="call">call</option>
            <option value="email">email</option>
            <option value="social">social</option>
            <option value="mixed">mixed</option>
          </select>

          <select
            name="quality"
            defaultValue={quality}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All Contact Quality</option>
            <option value="high">high</option>
            <option value="medium">medium</option>
            <option value="low">low</option>
          </select>

          <select
            name="authenticity"
            defaultValue={authenticity}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All Authenticity</option>
            <option value="high">high</option>
            <option value="medium">medium</option>
            <option value="low">low</option>
          </select>

          <select
            name="status"
            defaultValue={status}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All Lead Status</option>
            <option value="new">new</option>
            <option value="reviewed">reviewed</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
            <option value="contacted">contacted</option>
            <option value="replied">replied</option>
            <option value="converted">converted</option>
          </select>

          <div className="md:col-span-2 xl:col-span-5 flex gap-3">
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white"
            >
              Apply Filters
            </button>
            <a
              href="/admin/outreach/leads"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700"
            >
              Reset
            </a>
          </div>
        </form>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-2xl font-black text-slate-900">Saved Workshop Leads</div>
        <p className="mt-2 text-sm font-medium text-slate-600">
          Review source quality, best contact path, and lead confidence before starting campaigns.
        </p>

        {filteredLeads.length === 0 ? (
          <div className="mt-6 text-sm font-medium text-slate-600">
            No workshop leads found for the selected filters.
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-3 py-3 font-bold">Shop</th>
                  <th className="px-3 py-3 font-bold">Contact</th>
                  <th className="px-3 py-3 font-bold">Platform</th>
                  <th className="px-3 py-3 font-bold">Best Channel</th>
                  <th className="px-3 py-3 font-bold">Quality</th>
                  <th className="px-3 py-3 font-bold">Authenticity</th>
                  <th className="px-3 py-3 font-bold">Score</th>
                  <th className="px-3 py-3 font-bold">Flags</th>
                  <th className="px-3 py-3 font-bold">Updated</th>
                  <th className="px-3 py-3 font-bold">Lead Status</th>
                  <th className="px-3 py-3 font-bold">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-slate-100 align-top">
                    <td className="px-3 py-3">
                      <div className="font-semibold text-slate-900">{lead.shopName}</div>

                      <div className="mt-1 text-xs text-slate-500">
                        {lead.city || "—"}
                        {lead.province ? `, ${lead.province}` : ""}
                      </div>

                      {lead.website ? (
                        <div className="mt-1">
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-blue-600 underline"
                          >
                            Website
                          </a>
                        </div>
                      ) : null}

                      {lead.facebookPageUrl ? (
                        <div className="mt-1">
                          <a
                            href={lead.facebookPageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-blue-600 underline"
                          >
                            Facebook
                          </a>
                        </div>
                      ) : null}
                    </td>

                    <td className="px-3 py-3 text-slate-700">
                      <div>{lead.phone || "—"}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        WhatsApp: {lead.whatsappNumber || "—"}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {lead.email || "—"}
                      </div>
                    </td>

                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${platformBadge(
                          lead.scrapePlatform || lead.source
                        )}`}
                      >
                        {lead.scrapePlatform || lead.source || "manual"}
                      </span>

                      <div className="mt-2 text-xs text-slate-500">
                        Query: {lead.scrapeQuery || "—"}
                      </div>
                    </td>

                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${channelBadge(
                          lead.bestContactChannel
                        )}`}
                      >
                        {lead.bestContactChannel || "—"}
                      </span>
                    </td>

                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${qualityBadge(
                          lead.contactQuality
                        )}`}
                      >
                        {lead.contactQuality || "—"}
                      </span>
                    </td>

                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${qualityBadge(
                          lead.authenticityTier
                        )}`}
                      >
                        {lead.authenticityTier || "—"}
                      </span>
                    </td>

                    <td className="px-3 py-3">
                      <div className="font-bold text-slate-900">
                        {lead.leadScore ?? "—"}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Phone source: {lead.phoneSource || "—"}
                      </div>
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex max-w-[220px] flex-wrap gap-2">
                        {lead.isWhatsappQuality ? (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                            WhatsApp-quality
                          </span>
                        ) : null}

                        {lead.isCallOnly ? (
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                            Call-only
                          </span>
                        ) : null}

                        {lead.isEmailQuality ? (
                          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">
                            Email-quality
                          </span>
                        ) : null}

                        {lead.isSocialOnly ? (
                          <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
                            Social-only
                          </span>
                        ) : null}

                        {lead.isVirtualPhone ? (
                          <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
                            Virtual number
                          </span>
                        ) : null}
                      </div>
                    </td>

                    <td className="px-3 py-3 text-slate-700">
                      <div className="text-xs">{formatDateTime(lead.updatedAt)}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        Scraped: {formatDateTime(lead.scrapedAt)}
                      </div>
                    </td>

                    <td className="px-3 py-3">
                      <form
                        action={async (formData) => {
                          "use server";
                          const id = String(formData.get("id"));
                          const nextStatus = String(formData.get("status"));
                          await updateWorkshopLeadStatus(id, nextStatus);
                        }}
                      >
                        <input type="hidden" name="id" value={lead.id} />

                        <div className="mb-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${leadStatusBadge(
                              lead.status
                            )}`}
                          >
                            {lead.status || "new"}
                          </span>
                        </div>

                        <select
                          name="status"
                          defaultValue={lead.status}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800"
                        >
                          <option value="new">new</option>
                          <option value="reviewed">reviewed</option>
                          <option value="approved">approved</option>
                          <option value="rejected">rejected</option>
                          <option value="contacted">contacted</option>
                          <option value="replied">replied</option>
                          <option value="converted">converted</option>
                        </select>

                        <button
                          type="submit"
                          className="ml-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800"
                        >
                          Update
                        </button>
                      </form>
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/outreach/leads/${lead.id}`}
                          className="rounded-xl border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700"
                        >
                          View Conversation
                        </Link>

                        <form
                          action={async () => {
                            "use server";
                            await deleteWorkshopLead(lead.id);
                          }}
                        >
                          <button
                            type="submit"
                            className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}