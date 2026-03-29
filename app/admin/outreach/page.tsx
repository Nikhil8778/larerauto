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

function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function followUpStatusClass(status: string) {
  switch (status) {
    case "done":
      return "bg-emerald-100 text-emerald-700";
    case "cancelled":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-amber-100 text-amber-700";
  }
}

export default async function OutreachDashboardPage() {
  const now = new Date();

  const [
    totalLeads,
    approvedLeads,
    convertedLeads,
    convertedCustomers,
    activeCampaigns,
    pendingMessages,
    sentMessages,
    failedMessages,
    repliedMessages,
    deliveredMessages,
    allMessages,
    recentCampaigns,
    recentMessages,
    campaignsWithMessages,
    overdueFollowUps,
    upcomingFollowUps,
  ] = await Promise.all([
    prisma.workshopLead.count(),
    prisma.workshopLead.count({
      where: { status: "approved" },
    }),
    prisma.workshopLead.count({
      where: { status: "converted" },
    }),
    prisma.customer.count({
      where: {
        convertedWorkshopLead: {
          isNot: null,
        },
      },
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
    prisma.outreachMessage.findMany({
      select: {
        id: true,
        channel: true,
        sendStatus: true,
      },
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
    prisma.outreachCampaign.findMany({
      include: {
        template: true,
        messages: {
          select: {
            sendStatus: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.outreachLeadFollowUp.findMany({
      where: {
        status: "open",
        followUpAt: {
          not: null,
          lt: now,
        },
      },
      include: {
        workshopLead: true,
      },
      orderBy: { followUpAt: "asc" },
      take: 5,
    }),
    prisma.outreachLeadFollowUp.findMany({
      where: {
        status: "open",
        followUpAt: {
          not: null,
          gte: now,
        },
      },
      include: {
        workshopLead: true,
      },
      orderBy: { followUpAt: "asc" },
      take: 5,
    }),
  ]);

  const whatsappMessages = allMessages.filter((m) => m.channel === "whatsapp");
  const smsMessages = allMessages.filter((m) => m.channel === "sms");
  const emailMessages = allMessages.filter((m) => m.channel === "email");

  const channelStats = [
    {
      name: "WhatsApp",
      total: whatsappMessages.length,
      sent: whatsappMessages.filter((m) => m.sendStatus === "sent").length,
      delivered: whatsappMessages.filter((m) => m.sendStatus === "delivered").length,
      failed: whatsappMessages.filter((m) => m.sendStatus === "failed").length,
      replied: whatsappMessages.filter((m) => m.sendStatus === "replied").length,
    },
    {
      name: "SMS",
      total: smsMessages.length,
      sent: smsMessages.filter((m) => m.sendStatus === "sent").length,
      delivered: smsMessages.filter((m) => m.sendStatus === "delivered").length,
      failed: smsMessages.filter((m) => m.sendStatus === "failed").length,
      replied: smsMessages.filter((m) => m.sendStatus === "replied").length,
    },
    {
      name: "Email",
      total: emailMessages.length,
      sent: emailMessages.filter((m) => m.sendStatus === "sent").length,
      delivered: emailMessages.filter((m) => m.sendStatus === "delivered").length,
      failed: emailMessages.filter((m) => m.sendStatus === "failed").length,
      replied: emailMessages.filter((m) => m.sendStatus === "replied").length,
    },
  ];

  const topCampaigns = campaignsWithMessages
    .map((campaign) => {
      const total = campaign.messages.length;
      const sent = campaign.messages.filter((m) => m.sendStatus === "sent").length;
      const delivered = campaign.messages.filter((m) => m.sendStatus === "delivered").length;
      const failed = campaign.messages.filter((m) => m.sendStatus === "failed").length;
      const replied = campaign.messages.filter((m) => m.sendStatus === "replied").length;

      return {
        id: campaign.id,
        name: campaign.name,
        channel: campaign.channel,
        templateName: campaign.template?.name || "No template",
        total,
        sent,
        delivered,
        failed,
        replied,
        replyRate: pct(replied, total),
      };
    })
    .sort((a, b) => b.replied - a.replied || b.delivered - a.delivered || b.total - a.total)
    .slice(0, 5);

  const totalTracked =
    pendingMessages + sentMessages + deliveredMessages + failedMessages + repliedMessages;

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900">Outreach Dashboard</h1>
        <p className="mt-2 text-sm font-medium text-slate-600">
          Manage workshop leads, templates, campaigns, and outreach delivery from one place.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className={`rounded-[24px] border p-5 shadow-sm ${cardStyle("slate")}`}>
          <div className="text-sm font-bold uppercase tracking-wide text-slate-500">Total Leads</div>
          <div className="mt-3 text-3xl font-black text-slate-900">{totalLeads}</div>
        </div>

        <div className={`rounded-[24px] border p-5 shadow-sm ${cardStyle("emerald")}`}>
          <div className="text-sm font-bold uppercase tracking-wide text-emerald-700">
            Approved Leads
          </div>
          <div className="mt-3 text-3xl font-black text-emerald-900">{approvedLeads}</div>
        </div>

        <div className={`rounded-[24px] border p-5 shadow-sm ${cardStyle("violet")}`}>
          <div className="text-sm font-bold uppercase tracking-wide text-violet-700">
            Converted Leads
          </div>
          <div className="mt-3 text-3xl font-black text-violet-900">{convertedLeads}</div>
        </div>

        <div className={`rounded-[24px] border p-5 shadow-sm ${cardStyle("amber")}`}>
          <div className="text-sm font-bold uppercase tracking-wide text-amber-700">
            Converted Customers
          </div>
          <div className="mt-3 text-3xl font-black text-amber-900">{convertedCustomers}</div>
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

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Channel Performance</h2>
            <p className="mt-1 text-sm font-medium text-slate-600">
              Compare WhatsApp, SMS, and email campaign results.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {channelStats.map((channel) => (
              <div
                key={channel.name}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-lg font-black text-slate-900">{channel.name}</div>
                  <div className="text-sm font-bold text-slate-600">Total: {channel.total}</div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-4">
                  <div className="rounded-xl bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-700">
                    Sent: {channel.sent}
                  </div>
                  <div className="rounded-xl bg-violet-100 px-3 py-2 text-xs font-bold text-violet-700">
                    Delivered: {channel.delivered}
                  </div>
                  <div className="rounded-xl bg-rose-100 px-3 py-2 text-xs font-bold text-rose-700">
                    Failed: {channel.failed}
                  </div>
                  <div className="rounded-xl bg-sky-100 px-3 py-2 text-xs font-bold text-sky-700">
                    Replied: {channel.replied}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Delivery Funnel</h2>
            <p className="mt-1 text-sm font-medium text-slate-600">
              Quick view of pending, sent, delivered, failed, and replied status mix.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {[
              { label: "Pending", value: pendingMessages, color: "bg-slate-500" },
              { label: "Sent", value: sentMessages, color: "bg-emerald-500" },
              { label: "Delivered", value: deliveredMessages, color: "bg-violet-500" },
              { label: "Failed", value: failedMessages, color: "bg-rose-500" },
              { label: "Replied", value: repliedMessages, color: "bg-sky-500" },
            ].map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between text-sm font-bold text-slate-700">
                  <span>{item.label}</span>
                  <span>
                    {item.value} {totalTracked ? `(${pct(item.value, totalTracked)}%)` : ""}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full ${item.color}`}
                    style={{ width: `${pct(item.value, totalTracked)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-bold text-slate-700">Tracked Message Total</div>
            <div className="mt-2 text-3xl font-black text-slate-900">{totalTracked}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-rose-900">Overdue Follow-Ups</h2>
              <p className="mt-1 text-sm font-medium text-rose-700">
                Workshops that need action now.
              </p>
            </div>

            <Link
              href="/admin/outreach/leads"
              className="text-sm font-bold text-rose-700 hover:text-rose-900"
            >
              View leads →
            </Link>
          </div>

          {overdueFollowUps.length === 0 ? (
            <div className="mt-6 text-sm font-medium text-rose-700">
              No overdue follow-ups.
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {overdueFollowUps.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-rose-200 bg-white px-4 py-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="font-bold text-slate-900">{item.workshopLead.shopName}</div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${followUpStatusClass(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="mt-2 text-xs font-semibold text-rose-700">
                    Due: {item.followUpAt ? new Date(item.followUpAt).toLocaleString() : "—"}
                  </div>

                  <div className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {item.note}
                  </div>

                  <div className="mt-4">
                    <Link
                      href={`/admin/outreach/leads/${item.workshopLeadId}`}
                      className="text-sm font-bold text-blue-600 hover:text-blue-800"
                    >
                      Open Lead →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-amber-900">Upcoming Follow-Ups</h2>
              <p className="mt-1 text-sm font-medium text-amber-700">
                Next workshop reminders in queue.
              </p>
            </div>

            <Link
              href="/admin/outreach/leads"
              className="text-sm font-bold text-amber-700 hover:text-amber-900"
            >
              View leads →
            </Link>
          </div>

          {upcomingFollowUps.length === 0 ? (
            <div className="mt-6 text-sm font-medium text-amber-700">
              No upcoming follow-ups scheduled.
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {upcomingFollowUps.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-amber-200 bg-white px-4 py-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="font-bold text-slate-900">{item.workshopLead.shopName}</div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${followUpStatusClass(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="mt-2 text-xs font-semibold text-amber-700">
                    Due: {item.followUpAt ? new Date(item.followUpAt).toLocaleString() : "—"}
                  </div>

                  <div className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {item.note}
                  </div>

                  <div className="mt-4">
                    <Link
                      href={`/admin/outreach/leads/${item.workshopLeadId}`}
                      className="text-sm font-bold text-blue-600 hover:text-blue-800"
                    >
                      Open Lead →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Top Campaign Performance</h2>
            <p className="mt-1 text-sm font-medium text-slate-600">
              Best recent campaigns by replies and delivery activity.
            </p>
          </div>

          <Link
            href="/admin/outreach/campaigns"
            className="text-sm font-bold text-slate-700 hover:text-slate-900"
          >
            View all →
          </Link>
        </div>

        {topCampaigns.length === 0 ? (
          <div className="mt-6 text-sm font-medium text-slate-600">
            No campaign performance data found yet.
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-3 py-3 font-bold">Campaign</th>
                  <th className="px-3 py-3 font-bold">Channel</th>
                  <th className="px-3 py-3 font-bold">Total</th>
                  <th className="px-3 py-3 font-bold">Delivered</th>
                  <th className="px-3 py-3 font-bold">Replies</th>
                  <th className="px-3 py-3 font-bold">Failed</th>
                  <th className="px-3 py-3 font-bold">Reply Rate</th>
                </tr>
              </thead>
              <tbody>
                {topCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-slate-100">
                    <td className="px-3 py-3">
                      <div className="font-semibold text-slate-900">{campaign.name}</div>
                      <div className="mt-1 text-xs text-slate-500">{campaign.templateName}</div>
                    </td>
                    <td className="px-3 py-3 text-slate-700">{campaign.channel}</td>
                    <td className="px-3 py-3 text-slate-700">{campaign.total}</td>
                    <td className="px-3 py-3 font-bold text-violet-700">{campaign.delivered}</td>
                    <td className="px-3 py-3 font-bold text-sky-700">{campaign.replied}</td>
                    <td className="px-3 py-3 font-bold text-rose-700">{campaign.failed}</td>
                    <td className="px-3 py-3 text-slate-700">{campaign.replyRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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

                  <div className="mt-2 text-sm text-slate-700">{message.campaign.name}</div>

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