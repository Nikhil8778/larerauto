import { prisma } from "@/lib/prisma";
import AddCampaignForm from "./AddCampaignForm";
import {
  deleteOutreachCampaign,
  queueCampaignMessages,
  updateOutreachCampaignStatus,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function OutreachCampaignsPage() {
  const campaigns = await prisma.outreachCampaign.findMany({
    include: {
      template: true,
      _count: {
        select: {
          messages: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <AddCampaignForm />

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-2xl font-black text-slate-900">Saved Campaigns</div>
        <p className="mt-2 text-sm font-medium text-slate-600">
          Review, activate, pause, queue messages, and manage daily outreach batches.
        </p>

        {campaigns.length === 0 ? (
          <div className="mt-6 text-sm font-medium text-slate-600">
            No outreach campaigns found yet.
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-3 py-3 font-bold">Name</th>
                  <th className="px-3 py-3 font-bold">Channel</th>
                  <th className="px-3 py-3 font-bold">Template</th>
                  <th className="px-3 py-3 font-bold">Filters</th>
                  <th className="px-3 py-3 font-bold">Daily Limit</th>
                  <th className="px-3 py-3 font-bold">Messages</th>
                  <th className="px-3 py-3 font-bold">Status</th>
                  <th className="px-3 py-3 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-slate-100 align-top">
                    <td className="px-3 py-3">
                      <div className="font-semibold text-slate-900">{campaign.name}</div>
                      {campaign.notes ? (
                        <div className="mt-1 text-xs text-slate-500">{campaign.notes}</div>
                      ) : null}
                    </td>

                    <td className="px-3 py-3 text-slate-700">{campaign.channel}</td>

                    <td className="px-3 py-3 text-slate-700">
                      {campaign.template?.name || "—"}
                    </td>

                    <td className="px-3 py-3 text-xs text-slate-600">
                      <div>Status: {campaign.filterLeadStatus || "—"}</div>
                      <div>City: {campaign.filterCity || "all"}</div>
                      <div>Source: {campaign.filterSource || "all"}</div>
                      <div>Need WhatsApp: {campaign.requireWhatsapp ? "yes" : "no"}</div>
                      <div>Need Email: {campaign.requireEmail ? "yes" : "no"}</div>
                    </td>

                    <td className="px-3 py-3 text-slate-700">{campaign.dailyLimit}</td>
                    <td className="px-3 py-3 text-slate-700">{campaign._count.messages}</td>

                    <td className="px-3 py-3">
                      <form
                        action={async (formData) => {
                          "use server";
                          const id = String(formData.get("id"));
                          const status = String(formData.get("status"));
                          await updateOutreachCampaignStatus(id, status);
                        }}
                      >
                        <input type="hidden" name="id" value={campaign.id} />
                        <select
                          name="status"
                          defaultValue={campaign.status}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800"
                        >
                          <option value="draft">draft</option>
                          <option value="active">active</option>
                          <option value="paused">paused</option>
                          <option value="completed">completed</option>
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
                        <form
                          action={async () => {
                            "use server";
                            await queueCampaignMessages(campaign.id);
                          }}
                        >
                          <button
                            type="submit"
                            className="rounded-xl border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700"
                          >
                            Queue Messages
                          </button>
                        </form>

                        <form
                          action={async () => {
                            "use server";
                            await deleteOutreachCampaign(campaign.id);
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