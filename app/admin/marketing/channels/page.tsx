import { prisma } from "@/lib/prisma";
import AddChannelForm from "./AddChannelForm";
import ChannelsTable from "./ChannelsTable";

export const dynamic = "force-dynamic";

export default async function MarketingChannelsPage() {
  const channels = await prisma.socialChannel.findMany({
    orderBy: [{ platform: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Marketing Channels</h1>
        <p className="text-sm text-slate-600">
          Manage Facebook, Instagram, and TikTok handles for LARE Auto.
        </p>
      </div>

      <AddChannelForm />

      <ChannelsTable channels={channels} />
    </div>
  );
}