import { Campaign } from "@prisma/client";
import { deleteCampaign } from "./actions";

export default function CampaignsTable({ campaigns }: { campaigns: Campaign[] }) {
  if (!campaigns.length) {
    return <div className="rounded-2xl border bg-white p-4">No campaigns found.</div>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border bg-white">
      <table className="min-w-full text-sm">
        <thead className="border-b bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left">Name</th>
            <th className="px-4 py-3 text-left">Platform</th>
            <th className="px-4 py-3 text-left">Objective</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Landing URL</th>
            <th className="px-4 py-3 text-left">UTM Campaign</th>
            <th className="px-4 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((campaign) => (
            <tr key={campaign.id} className="border-b last:border-0">
              <td className="px-4 py-3">{campaign.name}</td>
              <td className="px-4 py-3">{campaign.platform || "-"}</td>
              <td className="px-4 py-3">{campaign.objective || "-"}</td>
              <td className="px-4 py-3">{campaign.status}</td>
              <td className="px-4 py-3">
                <a href={campaign.landingUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                  Open
                </a>
              </td>
              <td className="px-4 py-3">{campaign.utmCampaign || "-"}</td>
              <td className="px-4 py-3">
                <form
                  action={async () => {
                    "use server";
                    await deleteCampaign(campaign.id);
                  }}
                >
                  <button type="submit" className="rounded-lg border border-red-300 px-3 py-1 text-red-600">
                    Delete
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}