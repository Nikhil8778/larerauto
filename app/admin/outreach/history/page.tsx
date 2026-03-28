import { prisma } from "@/lib/prisma";
import { updateOutreachMessageStatus } from "./actions";

type SearchParams = Promise<{
  status?: string;
}>;

export const dynamic = "force-dynamic";

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

function isPreviewableImage(url: string | null) {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes(".png") ||
    lower.includes(".jpg") ||
    lower.includes(".jpeg") ||
    lower.includes(".webp")
  );
}

export default async function OutreachHistoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const statusFilter = (sp.status || "").trim().toLowerCase();

  const messages = await prisma.outreachMessage.findMany({
    where:
      statusFilter && statusFilter !== "all"
        ? { sendStatus: statusFilter }
        : undefined,
    include: {
      campaign: true,
      workshopLead: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900">Message History</h1>
        <p className="mt-2 text-sm font-medium text-slate-600">
          Track outreach delivery and reply history.
        </p>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <form method="GET" className="mb-6 flex flex-wrap items-end gap-3">
          <div>
            <label className="text-sm font-bold text-slate-700">Status</label>
            <select
              name="status"
              defaultValue={statusFilter || "all"}
              className="mt-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
            >
              <option value="all">all</option>
              <option value="pending">pending</option>
              <option value="sent">sent</option>
              <option value="delivered">delivered</option>
              <option value="failed">failed</option>
              <option value="replied">replied</option>
            </select>
          </div>

          <button
            type="submit"
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-extrabold text-white hover:bg-slate-800"
          >
            Apply Filter
          </button>
        </form>

        {messages.length === 0 ? (
          <div className="text-sm font-medium text-slate-600">
            No outreach messages found yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-3 py-3 font-bold">Campaign</th>
                  <th className="px-3 py-3 font-bold">Recipient</th>
                  <th className="px-3 py-3 font-bold">Contact</th>
                  <th className="px-3 py-3 font-bold">Channel</th>
                  <th className="px-3 py-3 font-bold">Message</th>
                  <th className="px-3 py-3 font-bold">Media</th>
                  <th className="px-3 py-3 font-bold">Status</th>
                  <th className="px-3 py-3 font-bold">Provider ID</th>
                  <th className="px-3 py-3 font-bold">Timeline</th>
                  <th className="px-3 py-3 font-bold">Error</th>
                  <th className="px-3 py-3 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((message) => (
                  <tr key={message.id} className="border-b border-slate-100 align-top">
                    <td className="px-3 py-3 font-semibold text-slate-900">
                      {message.campaign.name}
                    </td>

                    <td className="px-3 py-3 text-slate-700">
                      {message.recipientName || message.workshopLead?.shopName || "—"}
                    </td>

                    <td className="px-3 py-3 text-slate-700">
                      <div>{message.recipientPhone || "—"}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {message.recipientEmail || "—"}
                      </div>
                    </td>

                    <td className="px-3 py-3 text-slate-700">{message.channel}</td>

                    <td className="px-3 py-3 text-slate-700">
                      <div className="max-w-[280px] whitespace-pre-wrap break-words text-xs leading-6">
                        {message.bodySnapshot || "—"}
                      </div>
                    </td>

                    <td className="px-3 py-3 text-xs text-slate-700">
                      {message.mediaUrl ? (
                        <div className="max-w-[220px] space-y-2">
                          {isPreviewableImage(message.mediaUrl) ? (
                            <img
                              src={message.mediaUrl}
                              alt="Media preview"
                              className="h-20 w-20 rounded-xl border border-slate-200 object-cover"
                            />
                          ) : null}

                          <a
                            href={message.mediaUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block break-all font-semibold text-blue-600 underline"
                          >
                            Open media
                          </a>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${badgeClass(
                          message.sendStatus
                        )}`}
                      >
                        {message.sendStatus}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-xs text-slate-600">
                      <div className="max-w-[180px] break-all">
                        {message.providerMessageId || "—"}
                      </div>
                    </td>

                    <td className="px-3 py-3 text-xs text-slate-700">
                      <div>Sent: {message.sentAt ? new Date(message.sentAt).toLocaleString() : "—"}</div>
                      <div className="mt-1">
                        Delivered:{" "}
                        {message.deliveredAt ? new Date(message.deliveredAt).toLocaleString() : "—"}
                      </div>
                      <div className="mt-1">
                        Replied:{" "}
                        {message.repliedAt ? new Date(message.repliedAt).toLocaleString() : "—"}
                      </div>
                    </td>

                    <td className="px-3 py-3 text-xs text-rose-700">
                      <div className="max-w-[220px] whitespace-pre-wrap break-words">
                        {message.errorMessage || "—"}
                      </div>
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        {message.sendStatus === "pending" ? (
                          <>
                            <form
                              action={async () => {
                                "use server";
                                await updateOutreachMessageStatus(message.id, "sent");
                              }}
                            >
                              <button
                                type="submit"
                                className="rounded-xl border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700"
                              >
                                Mark Sent
                              </button>
                            </form>

                            <form
                              action={async () => {
                                "use server";
                                await updateOutreachMessageStatus(message.id, "failed");
                              }}
                            >
                              <button
                                type="submit"
                                className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700"
                              >
                                Mark Failed
                              </button>
                            </form>
                          </>
                        ) : null}

                        {message.sendStatus === "sent" ? (
                          <>
                            <form
                              action={async () => {
                                "use server";
                                await updateOutreachMessageStatus(message.id, "delivered");
                              }}
                            >
                              <button
                                type="submit"
                                className="rounded-xl border border-violet-200 px-3 py-2 text-xs font-bold text-violet-700"
                              >
                                Mark Delivered
                              </button>
                            </form>

                            <form
                              action={async () => {
                                "use server";
                                await updateOutreachMessageStatus(message.id, "replied");
                              }}
                            >
                              <button
                                type="submit"
                                className="rounded-xl border border-sky-200 px-3 py-2 text-xs font-bold text-sky-700"
                              >
                                Mark Replied
                              </button>
                            </form>

                            <form
                              action={async () => {
                                "use server";
                                await updateOutreachMessageStatus(message.id, "failed");
                              }}
                            >
                              <button
                                type="submit"
                                className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700"
                              >
                                Mark Failed
                              </button>
                            </form>
                          </>
                        ) : null}

                        {message.sendStatus === "delivered" ? (
                          <>
                            <form
                              action={async () => {
                                "use server";
                                await updateOutreachMessageStatus(message.id, "replied");
                              }}
                            >
                              <button
                                type="submit"
                                className="rounded-xl border border-sky-200 px-3 py-2 text-xs font-bold text-sky-700"
                              >
                                Mark Replied
                              </button>
                            </form>

                            <form
                              action={async () => {
                                "use server";
                                await updateOutreachMessageStatus(message.id, "failed");
                              }}
                            >
                              <button
                                type="submit"
                                className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700"
                              >
                                Mark Failed
                              </button>
                            </form>
                          </>
                        ) : null}

                        {(message.sendStatus === "failed" || message.sendStatus === "replied") ? (
                          <form
                            action={async () => {
                              "use server";
                              await updateOutreachMessageStatus(message.id, "pending");
                            }}
                          >
                            <button
                              type="submit"
                              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700"
                            >
                              Reset Pending
                            </button>
                          </form>
                        ) : null}
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