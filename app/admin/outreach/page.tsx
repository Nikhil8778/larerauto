import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function cardStyle(color: "slate" | "emerald" | "rose" | "sky" | "violet" | "amber") {
  switch (color) {
    case "emerald":
      return "border-emerald-200 bg-emerald-50";
    case "rose":
      return "border-rose-200 bg-rose-50";
    case "sky":
      return "border-sky-200 bg-sky-50";
    case "violet":
      return "border-violet-200 bg-violet-50";
    case "amber":
      return "border-amber-200 bg-amber-50";
    default:
      return "border-slate-200 bg-white";
  }
}

export default async function OutreachDashboardPage() {
  const [
    totalLeads,
    approvedLeads,
    activeCampaigns,
    pendingMessages,
    sentMessages,
    failedMessages,
    repliedMessages,
    deliveredMessages,
    recentCampaigns,
    recentMessages,
  ] = await Promise.all([
    prisma.workshopLead.count(),
    prisma.workshopLead.count({
      where: { status: "approved" },
    }),
    prisma.outreachCampaign.count({
      where: { status: "active" },
    }),
    prisma.outreachMessage.count({
      where: { sendStatus: "pending" },
    }),
    prisma.outreachMessage.count({
      where: { sendStatus: "sent" },
    }),
    prisma.outreachMessage.count({
      where: { sendStatus: "failed" },
    }),
    prisma.outreachMessage.count({
      where: { sendStatus: "replied" },
    }),
    prisma.outreachMessage.count({
      where: { sendStatus: "delivered" },
    }),
    prisma.outreachCampaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        template: true,
        _count: {
          select: {
            messages: true,
          },
        },
      },
    }),
    prisma.outreachMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        campaign: true,
        workshopLead: true,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900">Outreach Dashboard</h1>
        <p className="mt-2 text-sm font-medium text-slate-600">
          Manage workshop leads, templates, campaigns, and outreach delivery from one place.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className={`rounded-[24px] border p-5 shadow-sm ${cardStyle("slate")}`}>
          <div className="text-sm font-bold uppercase tracking-wide text-slate-500">
            Total Leads
          </div>
          <div className="mt-3 text-3xl font-black text-slate-900">{totalLeads}</div>
        </div>

        <div className={`rounded-[24px] border p-5 shadow-sm ${cardStyle("emerald")}`}>
          <div className="text-sm font-bold uppercase tracking-wide text-emerald-700">
            Approved Leads
          </div>
          <div className="mt-3 text-3xl font-black text-emerald-900">{approvedLeads}</div>
        </div>

        <div className={`rounded-[24px] border p-5 shadow-sm ${cardStyle("sky")}`}>
          <div className="text-sm font-bold uppercase tracking-wide text-sky-700">
            Active Campaigns
          </div>
          <div className="mt-3 text-3xl font-black text-sky-900">{activeCampaigns}</div>
        </div>

        <div className={`rounded-[24px] border p-5 shadow-sm ${cardStyle("slate")}`}>
          <div className="text-sm font-bold uppercase tracking-wide text-slate-500">
            Pending Messages
          </div>
          <div className="mt-3 text-3xl font-black text-slate-900">{pendingMessages}</div>
        </div>

        <div className={`rounded-[24px] border p-5 shadow-sm ${cardStyle("emerald")}`}>
          <div className="text-sm font-bold uppercase tracking-wide text-emerald-700">
            Sent Messages
          </div>
          <div className="mt-3 text-3xl font-black text-emerald-900">{sentMessages}</div>
        </div>

        <div className={`rounded-[24px] border p-5 shadow-sm ${cardStyle("violet")}`}>
          <div className="text-sm font-bold uppercase tracking-wide text-violet-700">
            Delivered Messages
          </div>
          <div className="mt-3 text-3xl font-black text-violet-900">{deliveredMessages}</div>
        </div>

        <div className={`rounded-[24px] border p-5 shadow-sm ${cardStyle("rose")}`}>
          <div className="text-sm font-bold uppercase tracking-wide text-rose-700">
            Failed Messages
          </div>
          <div className="mt-3 text-3xl font-black text-rose-900">{failedMessages}</div>
        </div>

        <div className={`rounded-[24px] border p-5 shadow-sm ${cardStyle("amber")}`}>
          <div className="text-sm font-bold uppercase tracking-wide text-amber-700">
            Replied Messages
          </div>
          <div className="mt-3 text-3xl font-black text-amber-900">{repliedMessages}</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/admin/outreach/leads"
          className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
        >
          <div className="text-lg font-black text-slate-900">Workshop Leads</div>
          <div className="mt-2 text-sm font-medium text-slate-600">
            Review scraped or manually added workshops.
          </div>
        </Link>

        <Link
          href="/admin/outreach/templates"
          className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
        >
          <div className="text-lg font-black text-slate-900">Templates</div>
          <div className="mt-2 text-sm font-medium text-slate-600">
            Create WhatsApp, SMS, and email message templates.
          </div>
        </Link>

        <Link
          href="/admin/outreach/campaigns"
          className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
        >
          <div className="text-lg font-black text-slate-900">Campaigns</div>
          <div className="mt-2 text-sm font-medium text-slate-600">
            Prepare and send controlled outreach batches.
          </div>
        </Link>

        <Link
          href="/admin/outreach/history"
          className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
        >
          <div className="text-lg font-black text-slate-900">Message History</div>
          <div className="mt-2 text-sm font-medium text-slate-600">
            Track pending, sent, failed, delivered, and replied messages.
          </div>
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Recent Campaigns</h2>
              <p className="mt-1 text-sm font-medium text-slate-600">
                Latest outreach campaigns and queue size.
              </p>
            </div>

            <Link
              href="/admin/outreach/campaigns"
              className="text-sm font-bold text-slate-700 hover:text-slate-900"
            >
              View all →
            </Link>
          </div>

          {recentCampaigns.length === 0 ? (
            <div className="mt-6 text-sm font-medium text-slate-600">
              No campaigns found yet.
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-3 py-3 font-bold">Name</th>
                    <th className="px-3 py-3 font-bold">Channel</th>
                    <th className="px-3 py-3 font-bold">Status</th>
                    <th className="px-3 py-3 font-bold">Daily Limit</th>
                    <th className="px-3 py-3 font-bold">Messages</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCampaigns.map((campaign) => (
                    <tr key={campaign.id} className="border-b border-slate-100">
                      <td className="px-3 py-3">
                        <div className="font-semibold text-slate-900">{campaign.name}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {campaign.template?.name || "No template"}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-700">{campaign.channel}</td>
                      <td className="px-3 py-3 text-slate-700">{campaign.status}</td>
                      <td className="px-3 py-3 text-slate-700">{campaign.dailyLimit}</td>
                      <td className="px-3 py-3 text-slate-700">{campaign._count.messages}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Recent Messages</h2>
              <p className="mt-1 text-sm font-medium text-slate-600">
                Latest outreach delivery activity.
              </p>
            </div>

            <Link
              href="/admin/outreach/history"
              className="text-sm font-bold text-slate-700 hover:text-slate-900"
            >
              View all →
            </Link>
          </div>

          {recentMessages.length === 0 ? (
            <div className="mt-6 text-sm font-medium text-slate-600">
              No outreach messages found yet.
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {recentMessages.map((message) => (
                <div
                  key={message.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="font-bold text-slate-900">
                      {message.recipientName || message.workshopLead?.shopName || "Unknown recipient"}
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      {message.channel} • {message.sendStatus}
                    </div>
                  </div>

                  <div className="mt-2 text-sm text-slate-700">
                    {message.campaign.name}
                  </div>

                  <div className="mt-2 text-xs text-slate-500">
                    {message.recipientEmail || message.recipientPhone || "No contact"}
                  </div>

                  <div className="mt-3 line-clamp-2 text-xs leading-6 text-slate-600">
                    {message.bodySnapshot}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}