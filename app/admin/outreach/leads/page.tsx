import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AddLeadForm from "./AddLeadForm";
import { deleteWorkshopLead, updateWorkshopLeadStatus } from "./actions";

export const dynamic = "force-dynamic";

export default async function OutreachLeadsPage() {
  const leads = await prisma.workshopLead.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-3xl font-black text-slate-900">Workshop Leads</div>
          <p className="mt-1 text-sm font-medium text-slate-600">
            Add manually or bulk import by CSV.
          </p>
        </div>

        <Link
          href="/admin/outreach/leads/import"
          className="rounded-full bg-slate-900 px-5 py-3 text-sm font-extrabold text-white hover:bg-slate-800"
        >
          Import CSV
        </Link>
      </div>

      <AddLeadForm />

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-2xl font-black text-slate-900">Saved Workshop Leads</div>
        <p className="mt-2 text-sm font-medium text-slate-600">
          Review, update status, and clean your Sudbury workshop lead list.
        </p>

        {leads.length === 0 ? (
          <div className="mt-6 text-sm font-medium text-slate-600">
            No workshop leads found yet.
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-3 py-3 font-bold">Shop</th>
                  <th className="px-3 py-3 font-bold">Phone</th>
                  <th className="px-3 py-3 font-bold">WhatsApp</th>
                  <th className="px-3 py-3 font-bold">Email</th>
                  <th className="px-3 py-3 font-bold">City</th>
                  <th className="px-3 py-3 font-bold">Source</th>
                  <th className="px-3 py-3 font-bold">Status</th>
                  <th className="px-3 py-3 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-slate-100 align-top">
                    <td className="px-3 py-3">
                      <div className="font-semibold text-slate-900">{lead.shopName}</div>
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
                    </td>

                    <td className="px-3 py-3 text-slate-700">{lead.phone || "—"}</td>
                    <td className="px-3 py-3 text-slate-700">{lead.whatsappNumber || "—"}</td>
                    <td className="px-3 py-3 text-slate-700">{lead.email || "—"}</td>
                    <td className="px-3 py-3 text-slate-700">{lead.city || "—"}</td>
                    <td className="px-3 py-3 text-slate-700">{lead.source || "—"}</td>

                    <td className="px-3 py-3">
                      <form
                        action={async (formData) => {
                          "use server";
                          const id = String(formData.get("id"));
                          const status = String(formData.get("status"));
                          await updateWorkshopLeadStatus(id, status);
                        }}
                      >
                        <input type="hidden" name="id" value={lead.id} />
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