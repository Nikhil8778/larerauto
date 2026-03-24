import { createCampaign } from "./actions";

export default function AddCampaignForm() {
  return (
    <form action={createCampaign} className="grid gap-4 rounded-2xl border bg-white p-4">
      <h2 className="text-lg font-semibold">Add Campaign</h2>

      <div className="grid gap-2 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Campaign Name</label>
          <input
            name="name"
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Brake Pads Launch Campaign"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Status</label>
          <select name="status" className="w-full rounded-lg border px-3 py-2" defaultValue="DRAFT">
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Objective</label>
          <input
            name="objective"
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Get quote requests"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Platform</label>
          <input
            name="platform"
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Facebook / Instagram / TikTok"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Audience</label>
          <input
            name="audience"
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Ontario drivers and mechanics"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Landing URL</label>
          <input
            name="landingUrl"
            className="w-full rounded-lg border px-3 py-2"
            placeholder="https://www.lareauto.ca/instant-quote"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">UTM Source</label>
          <input
            name="utmSource"
            className="w-full rounded-lg border px-3 py-2"
            placeholder="facebook"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">UTM Medium</label>
          <input
            name="utmMedium"
            className="w-full rounded-lg border px-3 py-2"
            placeholder="social"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">UTM Campaign</label>
          <input
            name="utmCampaign"
            className="w-full rounded-lg border px-3 py-2"
            placeholder="brakepads_launch"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Notes</label>
        <textarea
          name="notes"
          className="w-full rounded-lg border px-3 py-2"
          rows={3}
          placeholder="Optional campaign notes"
        />
      </div>

      <div>
        <button type="submit" className="rounded-lg bg-black px-4 py-2 text-white">
          Save Campaign
        </button>
      </div>
    </form>
  );
}