import Link from "next/link";
import { importWorkshopLeadsCsv } from "./actions";

export default function ImportWorkshopLeadsPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900">Import Workshop Leads CSV</h1>
        <p className="mt-2 text-sm font-medium text-slate-600">
          Upload a CSV file to bulk import workshop leads into Outreach.
        </p>
      </div>

      <form
        action={importWorkshopLeadsCsv}
        className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="text-xl font-black text-slate-900">CSV Upload</div>

        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          <div className="font-bold">Supported columns</div>
          <div className="mt-2 break-all">
            shopName, contactName, phone, whatsappNumber, email, website, addressLine1, city,
            province, postalCode, googleMapsUrl, category, rating, reviewCount, source, status,
            notes
          </div>
        </div>

        <div className="mt-6">
          <label className="text-sm font-bold text-slate-700">CSV File</label>
          <input
            name="csvFile"
            type="file"
            accept=".csv,text/csv"
            required
            className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900"
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-full bg-slate-900 px-6 py-3 text-sm font-extrabold text-white hover:bg-slate-800"
          >
            Import CSV
          </button>

          <Link
            href="/admin/outreach/leads"
            className="rounded-full border border-slate-300 px-6 py-3 text-sm font-extrabold text-slate-800 hover:bg-slate-50"
          >
            Back to Leads
          </Link>
        </div>
      </form>
    </div>
  );
}