import { prisma } from "@/lib/prisma";

export default async function AdminSettingsPage() {
  let settings = await prisma.businessSetting.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!settings) {
    settings = await prisma.businessSetting.create({
      data: {},
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Settings</h1>
        <p className="mt-2 text-sm font-medium text-slate-600">
          Business identity, invoice setup, taxes and communication defaults.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-black text-slate-900">Business Settings</h2>
          <div className="mt-5 space-y-3 text-sm text-slate-700">
            <div><span className="font-bold">Business:</span> {settings.businessName}</div>
            <div><span className="font-bold">Email:</span> {settings.businessEmail ?? "-"}</div>
            <div><span className="font-bold">Phone:</span> {settings.businessPhone ?? "-"}</div>
            <div><span className="font-bold">Invoice Prefix:</span> {settings.invoicePrefix}</div>
            <div><span className="font-bold">Quote Prefix:</span> {settings.quotePrefix}</div>
            <div><span className="font-bold">Default Tax %:</span> {settings.defaultTaxPercent}</div>
            <div><span className="font-bold">Currency:</span> {settings.currency}</div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-black text-slate-900">Channel Settings</h2>
          <div className="mt-5 space-y-3 text-sm text-slate-700">
            <div><span className="font-bold">WhatsApp:</span> {settings.whatsappNumber ?? "-"}</div>
            <div><span className="font-bold">Instagram:</span> {settings.instagramHandle ?? "-"}</div>
            <div><span className="font-bold">Facebook:</span> {settings.facebookPage ?? "-"}</div>
            <div><span className="font-bold">Welcome Reply:</span> {settings.welcomeReply ?? "-"}</div>
            <div><span className="font-bold">After Hours Reply:</span> {settings.afterHoursReply ?? "-"}</div>
            <div><span className="font-bold">Invoice Reminder Reply:</span> {settings.invoiceReminderReply ?? "-"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}