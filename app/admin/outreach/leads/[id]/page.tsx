import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  createLeadFollowUp,
  deleteLeadFollowUp,
  sendLeadManualReply,
  updateLeadFollowUpStatus,
} from "../actions";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function badgeClass(status: string) {
  switch (status) {
    case "sent":
      return "bg-emerald-100 text-emerald-700";
    case "delivered":
      return "bg-violet-100 text-violet-700";
    case "failed":
      return "bg-rose-100 text-rose-700";
    case "replied":
      return "bg-sky-100 text-sky-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function leadStatusClass(status: string) {
  switch (status) {
    case "approved":
      return "bg-emerald-100 text-emerald-700";
    case "replied":
      return "bg-sky-100 text-sky-700";
    case "converted":
      return "bg-violet-100 text-violet-700";
    case "rejected":
      return "bg-rose-100 text-rose-700";
    case "contacted":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
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

function applyTemplateVars(
  body: string,
  params: {
    shopName?: string | null;
    contactName?: string | null;
    city?: string | null;
    phone?: string | null;
    email?: string | null;
  }
) {
  return body
    .replaceAll("{{shopName}}", params.shopName || "")
    .replaceAll("{{contactName}}", params.contactName || "")
    .replaceAll("{{city}}", params.city || "")
    .replaceAll("{{phone}}", params.phone || "")
    .replaceAll("{{email}}", params.email || "");
}

export default async function OutreachLeadConversationPage({ params }: PageProps) {
  const { id } = await params;

  const [lead, templates] = await Promise.all([
    prisma.workshopLead.findUnique({
      where: { id },
      include: {
        messages: {
          include: {
            campaign: true,
          },
          orderBy: { createdAt: "asc" },
        },
        inboundMessages: {
          orderBy: { createdAt: "asc" },
        },
        replySession: true,
        followUps: {
          orderBy: [{ status: "asc" }, { followUpAt: "asc" }, { createdAt: "desc" }],
        },
      },
    }),
    prisma.messageTemplate.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        channel: true,
        audience: true,
        subject: true,
        body: true,
        mediaUrl: true,
      },
    }),
  ]);

  if (!lead) {
    notFound();
  }

  const templateOptions = templates.map((template) => ({
    ...template,
    renderedBody: applyTemplateVars(template.body, {
      shopName: lead.shopName,
      contactName: lead.contactName,
      city: lead.city,
      phone: lead.phone || lead.whatsappNumber,
      email: lead.email,
    }),
  }));

  const timeline = [
    ...lead.messages.map((message) => ({
      id: `out_${message.id}`,
      type: "outbound" as const,
      createdAt: message.createdAt,
      channel: message.channel,
      body: message.bodySnapshot,
      sendStatus: message.sendStatus,
      providerMessageId: message.providerMessageId,
      errorMessage: message.errorMessage,
      mediaUrl: message.mediaUrl,
      campaignName: message.campaign.name,
      sentAt: message.sentAt,
      deliveredAt: message.deliveredAt,
      repliedAt: message.repliedAt,
    })),
    ...lead.inboundMessages.map((message) => ({
      id: `in_${message.id}`,
      type: "inbound" as const,
      createdAt: message.createdAt,
      channel: message.channel,
      body: message.body,
      providerMessageId: message.providerMessageId,
      fromNumber: message.fromNumber,
    })),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Lead Conversation</h1>
          <p className="mt-1 text-sm font-medium text-slate-600">
            View outbound outreach, inbound replies, and quote session progress.
          </p>
        </div>

        <Link
          href="/admin/outreach/leads"
          className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-900 hover:bg-slate-50"
        >
          ← Back to Leads
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_1.45fr]">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-2xl font-black text-slate-900">{lead.shopName}</div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${leadStatusClass(
                  lead.status || "new"
                )}`}
              >
                {lead.status || "new"}
              </span>
            </div>

            <div className="mt-5 space-y-3 text-sm text-slate-700">
              <div><span className="font-bold text-slate-900">Contact:</span> {lead.contactName || "—"}</div>
              <div><span className="font-bold text-slate-900">Phone:</span> {lead.phone || "—"}</div>
              <div><span className="font-bold text-slate-900">WhatsApp:</span> {lead.whatsappNumber || "—"}</div>
              <div><span className="font-bold text-slate-900">Email:</span> {lead.email || "—"}</div>
              <div><span className="font-bold text-slate-900">City:</span> {lead.city || "—"}</div>
              <div><span className="font-bold text-slate-900">Province:</span> {lead.province || "—"}</div>
              <div><span className="font-bold text-slate-900">Source:</span> {lead.source || "—"}</div>
              <div><span className="font-bold text-slate-900">Category:</span> {lead.category || "—"}</div>
              <div>
                <span className="font-bold text-slate-900">Website:</span>{" "}
                {lead.website ? (
                  <a href={lead.website} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                    Open
                  </a>
                ) : (
                  "—"
                )}
              </div>
              <div><span className="font-bold text-slate-900">Address:</span> {lead.addressLine1 || "—"}</div>
              <div><span className="font-bold text-slate-900">Notes:</span> {lead.notes || "—"}</div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-2xl font-black text-slate-900">Reply Session</div>
            <p className="mt-2 text-sm font-medium text-slate-600">
              Current quote assistant memory for this lead.
            </p>

            {lead.replySession ? (
              <div className="mt-5 space-y-3 text-sm text-slate-700">
                <div><span className="font-bold text-slate-900">Channel:</span> {lead.replySession.channel}</div>
                <div><span className="font-bold text-slate-900">Status:</span> {lead.replySession.status}</div>
                <div><span className="font-bold text-slate-900">Part Type:</span> {lead.replySession.partType || "—"}</div>
                <div><span className="font-bold text-slate-900">Year:</span> {lead.replySession.year || "—"}</div>
                <div><span className="font-bold text-slate-900">Make:</span> {lead.replySession.make || "—"}</div>
                <div><span className="font-bold text-slate-900">Model:</span> {lead.replySession.model || "—"}</div>
                <div><span className="font-bold text-slate-900">Engine:</span> {lead.replySession.engine || "—"}</div>
                <div>
                  <span className="font-bold text-slate-900">Last inbound:</span>{" "}
                  {lead.replySession.lastInboundAt
                    ? new Date(lead.replySession.lastInboundAt).toLocaleString()
                    : "—"}
                </div>
                <div>
                  <span className="font-bold text-slate-900">Last outbound:</span>{" "}
                  {lead.replySession.lastOutboundAt
                    ? new Date(lead.replySession.lastOutboundAt).toLocaleString()
                    : "—"}
                </div>
              </div>
            ) : (
              <div className="mt-5 text-sm font-medium text-slate-600">
                No reply session has started yet.
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-2xl font-black text-slate-900">Follow-Up Notes & Reminders</div>
            <p className="mt-2 text-sm font-medium text-slate-600">
              Add internal notes and next-action reminders for this workshop lead.
            </p>

            <form action={createLeadFollowUp} className="mt-6 grid gap-4">
              <input type="hidden" name="leadId" value={lead.id} />

              <div>
                <label className="text-sm font-bold text-slate-700">Follow-Up Note</label>
                <textarea
                  name="note"
                  required
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
                  placeholder="Example: Owner asked for brake pad pricing. Follow up with rotor combo offer tomorrow."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-bold text-slate-700">Follow-Up Date/Time</label>
                  <input
                    name="followUpAt"
                    type="datetime-local"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700">Status</label>
                  <select
                    name="status"
                    defaultValue="open"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
                  >
                    <option value="open">open</option>
                    <option value="done">done</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="rounded-full bg-slate-900 px-6 py-3 text-sm font-extrabold text-white hover:bg-slate-800"
                >
                  Save Follow-Up
                </button>
              </div>
            </form>

            <div className="mt-6 space-y-3">
              {lead.followUps.length === 0 ? (
                <div className="text-sm font-medium text-slate-600">
                  No follow-up notes saved yet.
                </div>
              ) : (
                lead.followUps.map((followUp) => (
                  <div
                    key={followUp.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${followUpStatusClass(
                          followUp.status
                        )}`}
                      >
                        {followUp.status}
                      </span>

                      <div className="text-xs font-semibold text-slate-500">
                        {followUp.followUpAt
                          ? `Follow up: ${new Date(followUp.followUpAt).toLocaleString()}`
                          : "No date set"}
                      </div>
                    </div>

                    <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-800">
                      {followUp.note}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <form
                        action={async () => {
                          "use server";
                          await updateLeadFollowUpStatus(followUp.id, lead.id, "open");
                        }}
                      >
                        <button
                          type="submit"
                          className="rounded-xl border border-amber-200 px-3 py-2 text-xs font-bold text-amber-700"
                        >
                          Mark Open
                        </button>
                      </form>

                      <form
                        action={async () => {
                          "use server";
                          await updateLeadFollowUpStatus(followUp.id, lead.id, "done");
                        }}
                      >
                        <button
                          type="submit"
                          className="rounded-xl border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700"
                        >
                          Mark Done
                        </button>
                      </form>

                      <form
                        action={async () => {
                          "use server";
                          await updateLeadFollowUpStatus(followUp.id, lead.id, "cancelled");
                        }}
                      >
                        <button
                          type="submit"
                          className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700"
                        >
                          Cancel
                        </button>
                      </form>

                      <form
                        action={async () => {
                          "use server";
                          await deleteLeadFollowUp(followUp.id, lead.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-2xl font-black text-slate-900">Manual Reply</div>
            <p className="mt-2 text-sm font-medium text-slate-600">
              Pick a template or type your own direct WhatsApp, SMS, or email reply.
            </p>

            <form action={sendLeadManualReply} className="mt-6 grid gap-4 md:grid-cols-2">
              <input type="hidden" name="leadId" value={lead.id} />

              <div className="md:col-span-2">
                <label className="text-sm font-bold text-slate-700">Quick Insert Template</label>
                <select
                  id="templateSelect"
                  defaultValue=""
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
                >
                  <option value="">Select template</option>
                  {templateOptions.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.channel}
                      {template.audience ? ` • ${template.audience}` : ""})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">Channel</label>
                <select
                  id="replyChannel"
                  name="channel"
                  defaultValue={lead.whatsappNumber ? "whatsapp" : lead.email ? "email" : "sms"}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
                >
                  <option value="whatsapp">whatsapp</option>
                  <option value="sms">sms</option>
                  <option value="email">email</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">Subject</label>
                <input
                  id="replySubject"
                  name="subject"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
                  placeholder="Optional, mainly for email"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-bold text-slate-700">Media URL</label>
                <input
                  id="replyMediaUrl"
                  name="mediaUrl"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
                  placeholder="Optional public image URL for WhatsApp"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-bold text-slate-700">Reply Message</label>
                <textarea
                  id="replyBody"
                  name="body"
                  required
                  rows={6}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
                  placeholder="Type your direct reply here..."
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="rounded-full bg-slate-900 px-6 py-3 text-sm font-extrabold text-white hover:bg-slate-800"
                >
                  Send Reply
                </button>
              </div>
            </form>

            <script
              dangerouslySetInnerHTML={{
                __html: `
                  (() => {
                    const templates = ${JSON.stringify(templateOptions)};
                    const select = document.getElementById("templateSelect");
                    const channel = document.getElementById("replyChannel");
                    const subject = document.getElementById("replySubject");
                    const mediaUrl = document.getElementById("replyMediaUrl");
                    const body = document.getElementById("replyBody");

                    if (!select || !channel || !subject || !mediaUrl || !body) return;

                    select.addEventListener("change", function () {
                      const chosen = templates.find((t) => t.id === select.value);
                      if (!chosen) return;

                      channel.value = chosen.channel || "whatsapp";
                      subject.value = chosen.subject || "";
                      mediaUrl.value = chosen.mediaUrl || "";
                      body.value = chosen.renderedBody || "";
                    });
                  })();
                `,
              }}
            />
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-2xl font-black text-slate-900">Conversation Timeline</div>
              <p className="mt-2 text-sm font-medium text-slate-600">
                Outbound campaign messages, inbound replies, and bot follow-ups.
              </p>
            </div>
          </div>

          {timeline.length === 0 ? (
            <div className="mt-6 text-sm font-medium text-slate-600">
              No conversation records found for this lead yet.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {timeline.map((item) =>
                item.type === "outbound" ? (
                  <div
                    key={item.id}
                    className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm font-black uppercase tracking-wide text-emerald-700">
                        Outbound
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${badgeClass(
                          item.sendStatus
                        )}`}
                      >
                        {item.sendStatus}
                      </span>
                    </div>

                    <div className="mt-3 text-sm font-bold text-slate-900">
                      Campaign: {item.campaignName}
                    </div>

                    <div className="mt-2 text-xs text-slate-500">
                      {new Date(item.createdAt).toLocaleString()} • {item.channel}
                    </div>

                    <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-800">
                      {item.body}
                    </div>

                    {item.mediaUrl ? (
                      <div className="mt-4">
                        <a
                          href={item.mediaUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-blue-600 underline break-all"
                        >
                          {item.mediaUrl}
                        </a>
                      </div>
                    ) : null}

                    <div className="mt-4 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                      <div>
                        <span className="font-bold text-slate-900">Provider ID:</span>{" "}
                        {item.providerMessageId || "—"}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900">Sent:</span>{" "}
                        {item.sentAt ? new Date(item.sentAt).toLocaleString() : "—"}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900">Delivered:</span>{" "}
                        {item.deliveredAt ? new Date(item.deliveredAt).toLocaleString() : "—"}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900">Replied:</span>{" "}
                        {item.repliedAt ? new Date(item.repliedAt).toLocaleString() : "—"}
                      </div>
                    </div>

                    {item.errorMessage ? (
                      <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
                        {item.errorMessage}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div
                    key={item.id}
                    className="rounded-[24px] border border-sky-200 bg-sky-50 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm font-black uppercase tracking-wide text-sky-700">
                        Inbound Reply
                      </div>
                      <div className="text-xs font-bold text-slate-500">
                        {new Date(item.createdAt).toLocaleString()} • {item.channel}
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-slate-600">
                      <span className="font-bold text-slate-900">From:</span>{" "}
                      {"fromNumber" in item ? item.fromNumber || "—" : "—"}
                    </div>

                    <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-800">
                      {item.body}
                    </div>

                    <div className="mt-4 text-xs text-slate-600">
                      <span className="font-bold text-slate-900">Provider ID:</span>{" "}
                      {"providerMessageId" in item ? item.providerMessageId || "—" : "—"}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}