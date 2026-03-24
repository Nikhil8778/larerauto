import { prisma } from "@/lib/prisma";
import AddPostForm from "./AddPostForm";
import PostsTable from "./PostsTable";

export const dynamic = "force-dynamic";

export default async function MarketingPostsPage() {
  const channels = await prisma.socialChannel.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
  });

  const posts = await prisma.socialPost.findMany({
    include: {
      channel: true,
      campaign: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Marketing Posts</h1>
        <p className="text-sm text-slate-600">
          Create and manage social post drafts for LARE Auto.
        </p>
      </div>

      <AddPostForm channels={channels} campaigns={campaigns} />

      <PostsTable posts={posts} />
    </div>
  );
}