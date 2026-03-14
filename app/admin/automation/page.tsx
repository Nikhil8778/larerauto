import { prisma } from "@/lib/prisma";

export default async function AdminAutomationPage() {
  const rules = await prisma.autoReplyRule.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Automation</h1>
        <p className="mt-2 text-sm font-medium text-slate-600">
          Manage smart channel reply rules and response templates.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Channel</th>
              <th className="px-4 py-3 font-semibold">Trigger</th>
              <th className="px-4 py-3 font-semibold">Active</th>
              <th className="px-4 py-3 font-semibold">Template</th>
            </tr>
          </thead>
          <tbody>
            {rules.length === 0 ? (
              <tr className="border-t">
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  No automation rules yet.
                </td>
              </tr>
            ) : (
              rules.map((rule) => (
                <tr key={rule.id} className="border-t">
                  <td className="px-4 py-3 font-semibold">{rule.name}</td>
                  <td className="px-4 py-3">{rule.channel}</td>
                  <td className="px-4 py-3">{rule.triggerType}</td>
                  <td className="px-4 py-3">{rule.isActive ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 max-w-[520px] break-words">
                    {rule.replyTemplate}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}