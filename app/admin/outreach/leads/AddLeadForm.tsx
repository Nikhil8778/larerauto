import { createWorkshopLead } from "./actions";

export default function AddLeadForm() {
  return (
    <form
      action={createWorkshopLead}
      className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="text-2xl font-black text-slate-900">Add Workshop Lead</div>
      <p className="mt-2 text-sm font-medium text-slate-600">
        Manually add workshop leads before CSV import or scraping.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-bold text-slate-700">Shop Name</label>
          <input
            name="shopName"
            required
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
            placeholder="Sudbury Auto Repair"
          />
        </div>

        <div>
          <label className="text-sm font-bold text-slate-700">Contact Name</label>
          <input
            name="contactName"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
            placeholder="Owner or manager"
          />
        </div>

        <div>
          <label className="text-sm font-bold text-slate-700">Phone</label>
          <input
            name="phone"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
            placeholder="705..."
          />
        </div>

        <div>
          <label className="text-sm font-bold text-slate-700">WhatsApp Number</label>
          <input
            name="whatsappNumber"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
            placeholder="+1705..."
          />
        </div>

        <div>
          <label className="text-sm font-bold text-slate-700">Email</label>
          <input
            name="email"
            type="email"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
            placeholder="shop@example.com"
          />
        </div>

        <div>
          <label className="text-sm font-bold text-slate-700">Website</label>
          <input
            name="website"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
            placeholder="https://..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-bold text-slate-700">Address</label>
          <input
            name="addressLine1"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
            placeholder="123 Main St"
          />
        </div>

        <div>
          <label className="text-sm font-bold text-slate-700">City</label>
          <input
            name="city"
            defaultValue="Greater Sudbury"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
          />
        </div>

        <div>
          <label className="text-sm font-bold text-slate-700">Province</label>
          <input
            name="province"
            defaultValue="Ontario"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
          />
        </div>

        <div>
          <label className="text-sm font-bold text-slate-700">Postal Code</label>
          <input
            name="postalCode"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
            placeholder="P3..."
          />
        </div>

        <div>
          <label className="text-sm font-bold text-slate-700">Google Maps URL</label>
          <input
            name="googleMapsUrl"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
            placeholder="https://maps.google.com/..."
          />
        </div>

        <div>
          <label className="text-sm font-bold text-slate-700">Category</label>
          <input
            name="category"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
            placeholder="Mechanic / Body Shop / Tire Shop"
          />
        </div>

        <div>
          <label className="text-sm font-bold text-slate-700">Source</label>
          <select
            name="source"
            defaultValue="manual"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
          >
            <option value="manual">manual</option>
            <option value="yellowpages">yellowpages</option>
            <option value="google">google</option>
            <option value="csv">csv</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-bold text-slate-700">Status</label>
          <select
            name="status"
            defaultValue="new"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
          >
            <option value="new">new</option>
            <option value="reviewed">reviewed</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
            <option value="contacted">contacted</option>
            <option value="replied">replied</option>
            <option value="converted">converted</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-bold text-slate-700">Rating</label>
          <input
            name="rating"
            type="number"
            step="0.1"
            min="0"
            max="5"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
            placeholder="4.6"
          />
        </div>

        <div>
          <label className="text-sm font-bold text-slate-700">Review Count</label>
          <input
            name="reviewCount"
            type="number"
            min="0"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
            placeholder="120"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-bold text-slate-700">Notes</label>
          <textarea
            name="notes"
            rows={4}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
            placeholder="Any useful notes about this workshop..."
          />
        </div>
      </div>

      <button
        type="submit"
        className="mt-6 rounded-full bg-slate-900 px-6 py-3 text-sm font-extrabold text-white hover:bg-slate-800"
      >
        Save Workshop Lead
      </button>
    </form>
  );
}