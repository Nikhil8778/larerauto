import { prisma } from "@/lib/prisma";
import { createOutreachCampaign } from "./actions";

export default async function AddCampaignForm() {
  const templates = await prisma.messageTemplate.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      channel: true,
      audience: true,
    },
  });

  return (
    <form
      action={createOutreachCampaign}
      className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="text-2xl font-black text-slate-900">Add Outreach Campaign</div>
      <p className="mt-2 text-sm font-medium text-slate-600">
        Create controlled daily outreach batches for workshops and future lead groups.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-bold text-slate-700">Campaign Name</label>
          <input
            name="name"
            required
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
            placeholder="Sudbury Intro Batch 1"
          />
        </div>

        <div>
          <label className="text-sm font-bold text-slate-700">Channel</label>
          <select
            name="channel"
            defaultValue="whatsapp"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
          >
            <option value="whatsapp">whatsapp</option>
            <option value="sms">sms</option>
            <option value="email">email</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-bold text-slate-700">Audience</label>
          <select
            name="audience"
            defaultValue="workshop"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
          >
            <option value="workshop">workshop</option>
            <option value="mechanic">mechanic</option>
            <option value="retail">retail</option>
            <option value="general">general</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-bold text-slate-700">Status</label>
          <select
            name="status"
            defaultValue="draft"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
          >
            <option value="draft">draft</option>
            <option value="active">active</option>
            <option value="paused">paused</option>
            <option value="completed">completed</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-bold text-slate-700">Daily Limit</label>
          <input
            name="dailyLimit"
            type="number"
            min="1"
            defaultValue="25"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
          />
        </div>

        <div>
          <label className="text-sm font-bold text-slate-700">Template</label>
          <select
            name="templateId"
            defaultValue=""
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
          >
            <option value="">No template selected</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} ({template.channel}
                {template.audience ? ` • ${template.audience}` : ""})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-bold text-slate-700">Filter City</label>
          <input
            name="filterCity"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
            placeholder="Sudbury or Greater Sudbury"
          />
        </div>

        <div>
          <label className="text-sm font-bold text-slate-700">Filter Source</label>
          <select
            name="filterSource"
            defaultValue=""
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
          >
            <option value="">All sources</option>
            <option value="manual">manual</option>
            <option value="csv">csv</option>
            <option value="yellowpages">yellowpages</option>
            <option value="google">google</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-bold text-slate-700">Filter Lead Status</label>
          <select
            name="filterLeadStatus"
            defaultValue="approved"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
          >
            <option value="approved">approved</option>
            <option value="new">new</option>
            <option value="reviewed">reviewed</option>
            <option value="contacted">contacted</option>
            <option value="replied">replied</option>
            <option value="converted">converted</option>
          </select>
        </div>

        <div className="flex items-center gap-6 pt-8">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input type="checkbox" name="requireWhatsapp" value="true" />
            Require WhatsApp / Phone
          </label>

          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input type="checkbox" name="requireEmail" value="true" />
            Require Email
          </label>
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-bold text-slate-700">Notes</label>
          <textarea
            name="notes"
            rows={4}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
            placeholder="Any internal notes for this outreach campaign..."
          />
        </div>
      </div>

      <button
        type="submit"
        className="mt-6 rounded-full bg-slate-900 px-6 py-3 text-sm font-extrabold text-white hover:bg-slate-800"
      >
        Save Campaign
      </button>
    </form>
  );
}