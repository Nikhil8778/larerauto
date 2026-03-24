import Link from "next/link";

export default function MarketingPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Marketing Admin</h1>
        <p className="text-sm text-slate-600">
          Manage channels, post drafts, and campaign tracking.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/admin/marketing/channels" className="rounded-2xl border bg-white p-4 hover:shadow">
          <h2 className="font-semibold">Channels</h2>
          <p className="mt-1 text-sm text-slate-600">Manage connected social handles.</p>
        </Link>

        <Link href="/admin/marketing/posts" className="rounded-2xl border bg-white p-4 hover:shadow">
          <h2 className="font-semibold">Posts</h2>
          <p className="mt-1 text-sm text-slate-600">Create and manage post drafts.</p>
        </Link>

        <Link href="/admin/marketing/campaigns" className="rounded-2xl border bg-white p-4 hover:shadow">
          <h2 className="font-semibold">Campaigns</h2>
          <p className="mt-1 text-sm text-slate-600">Manage landing links and UTM tracking.</p>
        </Link>
      </div>
    </div>
  );
}