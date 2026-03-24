import { Campaign, SocialChannel, SocialPost } from "@prisma/client";
import { deleteSocialPost } from "./actions";

type PostRow = SocialPost & {
  channel: SocialChannel;
  campaign: Campaign | null;
};

export default function PostsTable({ posts }: { posts: PostRow[] }) {
  if (!posts.length) {
    return <div className="rounded-2xl border bg-white p-4">No post drafts found.</div>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border bg-white">
      <table className="min-w-full text-sm">
        <thead className="border-b bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left">Title</th>
            <th className="px-4 py-3 text-left">Platform</th>
            <th className="px-4 py-3 text-left">Handle</th>
            <th className="px-4 py-3 text-left">Campaign</th>
            <th className="px-4 py-3 text-left">Type</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Target</th>
            <th className="px-4 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id} className="border-b last:border-0">
              <td className="px-4 py-3">{post.title}</td>
              <td className="px-4 py-3">{post.channel.platform}</td>
              <td className="px-4 py-3">{post.channel.handle || "-"}</td>
              <td className="px-4 py-3">{post.campaign?.name || "-"}</td>
              <td className="px-4 py-3">{post.postType}</td>
              <td className="px-4 py-3">{post.status}</td>
              <td className="px-4 py-3">
                {post.targetUrl ? (
                  <a href={post.targetUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                    Open
                  </a>
                ) : (
                  "-"
                )}
              </td>
              <td className="px-4 py-3">
                <form
                  action={async () => {
                    "use server";
                    await deleteSocialPost(post.id);
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