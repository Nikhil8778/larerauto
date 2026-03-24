import { prisma } from "@/lib/prisma";
import AddCampaignForm from "./AddCampaignForm";
import CampaignsTable from "./CampaignsTable";

export const dynamic = "force-dynamic";

export default async function MarketingCampaignsPage() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Marketing Campaigns</h1>
        <p className="text-sm text-slate-600">
          Create and manage campaign links, UTM tracking, and objectives.
        </p>
      </div>

      <AddCampaignForm />

      <CampaignsTable campaigns={campaigns} />
    </div>
  );
}