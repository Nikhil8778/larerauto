import { prisma } from "@/lib/prisma";
import AddTemplateForm from "./AddTemplateForm";
import { deleteMessageTemplate, toggleMessageTemplate } from "./actions";

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
        <div className="text-2xl font-black text-slate-900">Saved Templates</div>
        <p className="mt-2 text-sm font-medium text-slate-600">
          Review, activate, and manage reusable outreach templates.
        </p>

        {templates.length === 0 ? (
          <div className="mt-6 text-sm font-medium text-slate-600">
            No templates created yet.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="rounded-[24px] border border-slate-200 p-5"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-lg font-black text-slate-900">{template.name}</div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                    {template.channel}
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                    {template.audience || "general"}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      template.isActive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {template.isActive ? "active" : "inactive"}
                  </span>
                </div>

                {template.subject ? (
                  <div className="mt-3 text-sm font-semibold text-slate-800">
                    Subject: {template.subject}
                  </div>
                ) : null}

                <div className="mt-3 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  {template.body}
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <form
                    action={async () => {
                      "use server";
                      await toggleMessageTemplate(template.id, !template.isActive);
                    }}
                  >
                    <button
                      type="submit"
                      className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-800"
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
                      className="rounded-xl border border-rose-200 px-4 py-2 text-xs font-bold text-rose-700"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}