import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/auth";
import AdminLogoutButton from "./AdminLogoutButton";

const navGroups = [
  {
    title: "Overview",
    items: [
      { href: "/admin", label: "Dashboard" },
      { href: "/admin/sales", label: "Sales" },
      { href: "/admin/orders", label: "Orders" },
      { href: "/admin/customers", label: "Customers" },
      { href: "/admin/invoices", label: "Invoices" },
      { href: "/admin/mechanics", label: "Mechanics" },
    ],
  },
  {
    title: "Marketing",
    items: [
      { href: "/admin/marketing", label: "Dashboard" },
      { href: "/admin/marketing/channels", label: "Channels" },
      { href: "/admin/marketing/posts", label: "Posts" },
      { href: "/admin/marketing/campaigns", label: "Campaigns" },
    ],
  },
  {
    title: "Communication",
    items: [
      { href: "/admin/messages", label: "Messages" },
      { href: "/admin/automation", label: "Automation" },
    ],
  },
  {
    title: "Catalog Ops",
    items: [
      { href: "/admin/parts", label: "Parts" },
      { href: "/admin/pricing", label: "Pricing" },
      { href: "/admin/inventory", label: "Inventory" },
      { href: "/admin/candidates", label: "Candidates" },
    ],
  },
  {
    title: "System",
    items: [{ href: "/admin/settings", label: "Settings" }],
  },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminUser = await getCurrentAdminUser();

  if (!adminUser) {
    redirect("/admin-login");
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 xl:grid-cols-[280px_1fr]">
        <aside className="border-r border-slate-200 bg-slate-950 text-white">
          <div className="sticky top-0 h-screen overflow-y-auto">
            <div className="border-b border-slate-800 px-6 py-6">
              <div className="text-2xl font-black tracking-tight">
                Lare Auto Admin
              </div>
              <div className="mt-2 text-sm text-slate-400">
                Sales, operations, automation, marketing and catalog control.
              </div>

              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Signed in as
                </div>
                <div className="mt-2 text-sm font-bold text-slate-100">
                  {adminUser.name || "Admin"}
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  {adminUser.email}
                </div>
              </div>
            </div>

            <nav className="px-4 py-5">
              <div className="space-y-6">
                {navGroups.map((group) => (
                  <div key={group.title}>
                    <div className="px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      {group.title}
                    </div>

                    <div className="mt-2 space-y-1">
                      {group.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-900 hover:text-white"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 border-t border-slate-800 pt-6">
                <AdminLogoutButton />
              </div>
            </nav>
          </div>
        </aside>

        <main className="min-w-0 bg-slate-100">
          <div className="p-4 md:p-6 xl:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}