import Link from "next/link";

export default function OutreachDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900">Outreach Dashboard</h1>
        <p className="mt-2 text-sm font-medium text-slate-600">
          Manage workshop leads, templates, campaigns, and outreach history.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/admin/outreach/leads"
          className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
        >
          <div className="text-lg font-black text-slate-900">Workshop Leads</div>
          <div className="mt-2 text-sm font-medium text-slate-600">
            Review scraped or manually added workshops.
          </div>
        </Link>

        <Link
          href="/admin/outreach/templates"
          className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
        >
          <div className="text-lg font-black text-slate-900">Templates</div>
          <div className="mt-2 text-sm font-medium text-slate-600">
            Create WhatsApp, SMS, and email message templates.
          </div>
        </Link>

        <Link
          href="/admin/outreach/campaigns"
          className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
        >
          <div className="text-lg font-black text-slate-900">Campaigns</div>
          <div className="mt-2 text-sm font-medium text-slate-600">
            Prepare controlled outreach batches.
          </div>
        </Link>

        <Link
          href="/admin/outreach/history"
          className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
        >
          <div className="text-lg font-black text-slate-900">Message History</div>
          <div className="mt-2 text-sm font-medium text-slate-600">
            Track pending, sent, failed, delivered, and replied messages.
          </div>
        </Link>
      </div>
    </div>
  );
}