import { createSocialChannel } from "./actions";

export default function AddChannelForm() {
  return (
    <form
      action={createSocialChannel}
      className="grid gap-4 rounded-2xl border bg-white p-4"
    >
      <h2 className="text-lg font-semibold">Add Social Channel</h2>

      <div className="grid gap-2 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Platform</label>
          <select
            name="platform"
            className="w-full rounded-lg border px-3 py-2"
            required
            defaultValue="FACEBOOK"
          >
            <option value="FACEBOOK">Facebook</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="TIKTOK">TikTok</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Display Name</label>
          <input
            name="displayName"
            className="w-full rounded-lg border px-3 py-2"
            placeholder="LARE Auto"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Handle</label>
          <input
            name="handle"
            className="w-full rounded-lg border px-3 py-2"
            placeholder="@lareauto"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Profile URL</label>
          <input
            name="profileUrl"
            className="w-full rounded-lg border px-3 py-2"
            placeholder="https://www.instagram.com/lareauto/"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Profile Image URL</label>
          <input
            name="profileImageUrl"
            className="w-full rounded-lg border px-3 py-2"
            placeholder="https://..."
          />
        </div>

        <div className="flex items-center gap-2 pt-7">
          <input type="checkbox" name="isActive" defaultChecked />
          <label className="text-sm font-medium">Active</label>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Notes</label>
        <textarea
          name="notes"
          className="w-full rounded-lg border px-3 py-2"
          rows={3}
          placeholder="Manual connection for now. OAuth later."
        />
      </div>

      <div>
        <button
          type="submit"
          className="rounded-lg bg-black px-4 py-2 text-white"
        >
          Save Channel
        </button>
      </div>
    </form>
  );
}