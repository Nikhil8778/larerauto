import { prisma } from "@/lib/prisma";
import AddTemplateForm from "./AddTemplateForm";
import {
  deleteMessageTemplate,
  sendTestTemplate,
  toggleMessageTemplate,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function OutreachTemplatesPage() {
  const templates = await prisma.messageTemplate.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <AddTemplateForm />

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-2xl font-black text-slate-900">Test Template</div>
        <p className="mt-2 text-sm font-medium text-slate-600">
          Send a one-off test before using a template in a campaign.
        </p>

        <form action={sendTestTemplate} className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-sm font-bold text-slate-700">Template</label>
            <select
              name="templateId"
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
            >
              <option value="">Select template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.channel}
                  {template.audience ? ` • ${template.audience}` : ""})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">Recipient Phone</label>
            <input
              name="recipientPhone"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
              placeholder="7055551234"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">Recipient Email</label>
            <input
              name="recipientEmail"
              type="email"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
              placeholder="shop@example.com"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">Shop Name</label>
            <input
              name="shopName"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
              placeholder="True Mechanic"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">Contact Name</label>
            <input
              name="contactName"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
              placeholder="Keith"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-bold text-slate-700">City</label>
            <input
              name="city"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
              placeholder="Sudbury"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-extrabold text-white hover:bg-slate-800"
            >
              Send Test
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-2xl font-black text-slate-900">Saved Templates</div>
        <p className="mt-2 text-sm font-medium text-slate-600">
          Review, activate, and manage reusable outreach templates.
        </p>

        {templates.length === 0 ? (
          <div className="mt-6 text-sm font-medium text-slate-600">
            No templates found yet.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="rounded-[24px] border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-2xl font-black text-slate-900">{template.name}</div>
                      <div className="text-sm font-bold text-slate-600">{template.channel}</div>
                      <div className="text-sm font-bold text-slate-600">
                        {template.audience || "general"}
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          template.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {template.isActive ? "active" : "inactive"}
                      </span>
                    </div>

                    {template.subject ? (
                      <div className="mt-4 text-sm font-semibold text-slate-700">
                        Subject: {template.subject}
                      </div>
                    ) : null}

                    {template.mediaUrl ? (
                      <div className="mt-3">
                        <a
                          href={template.mediaUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-blue-600 underline break-all"
                        >
                          {template.mediaUrl}
                        </a>
                      </div>
                    ) : null}

                    <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                      {template.body}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <form
                      action={async () => {
                        "use server";
                        await toggleMessageTemplate(template.id, !template.isActive);
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-800"
                      >
                        {template.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </form>

                    <form
                      action={async () => {
                        "use server";
                        await deleteMessageTemplate(template.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-bold text-rose-700"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}