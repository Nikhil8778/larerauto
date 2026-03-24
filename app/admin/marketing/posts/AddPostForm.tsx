import { Campaign, SocialChannel } from "@prisma/client";
import { createSocialPost } from "./actions";

export default function AddPostForm({
  channels,
  campaigns,
}: {
  channels: SocialChannel[];
  campaigns: Campaign[];
}) {
  return (
    <form action={createSocialPost} className="grid gap-4 rounded-2xl border bg-white p-4">
      <h2 className="text-lg font-semibold">Add Social Post Draft</h2>

      <div className="grid gap-2 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Channel</label>
          <select name="channelId" className="w-full rounded-lg border px-3 py-2" required>
            <option value="">Select channel</option>
            {channels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                {channel.platform} - {channel.displayName} {channel.handle ? `(${channel.handle})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Campaign</label>
          <select name="campaignId" className="w-full rounded-lg border px-3 py-2" defaultValue="">
            <option value="">No campaign</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Title</label>
          <input
            name="title"
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Welcome to LARE Auto"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Post Type</label>
          <select name="postType" className="w-full rounded-lg border px-3 py-2" defaultValue="IMAGE">
            <option value="IMAGE">Image</option>
            <option value="VIDEO">Video</option>
            <option value="TEXT">Text</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Status</label>
          <select name="status" className="w-full rounded-lg border px-3 py-2" defaultValue="DRAFT">
            <option value="DRAFT">Draft</option>
            <option value="READY">Ready</option>
            <option value="PUBLISHED">Published</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Media URL</label>
          <input
            name="mediaUrl"
            className="w-full rounded-lg border px-3 py-2"
            placeholder="https://..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Target URL</label>
          <input
            name="targetUrl"
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Leave blank to use campaign landing URL"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Caption</label>
        <textarea
          name="caption"
          className="w-full rounded-lg border px-3 py-2"
          rows={5}
          placeholder="Write your caption here..."
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Notes</label>
        <textarea
          name="notes"
          className="w-full rounded-lg border px-3 py-2"
          rows={3}
          placeholder="Optional internal notes"
        />
      </div>

      <div>
        <button type="submit" className="rounded-lg bg-black px-4 py-2 text-white">
          Save Draft
        </button>
      </div>
    </form>
  );
}