import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  markLeadAbandoned,
  markLeadCheckoutLinkSent,
  markLeadInventoryConfirmed,
  markLeadInventoryPending,
  markLeadInventoryUnavailable,
  markLeadAlternateOffered,
} from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  source?: string;
  reply?: string;
  customerType?: string;
  status?: string;
  inventory?: string;
}>;

function money(cents: number | null | undefined) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format((cents || 0) / 100);
}

function formatDateTime(date: Date | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-CA");
}

function badgeClass(value: string | null | undefined) {
  const text = String(value || "").toLowerCase();
  const base =
    "inline-flex rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap";

  if (text === "email") return `${base} bg-sky-100 text-sky-700`;
  if (text === "whatsapp") return `${base} bg-emerald-100 text-emerald-700`;
  if (text === "platform") return `${base} bg-violet-100 text-violet-700`;
  if (text === "dashboard") return `${base} bg-amber-100 text-amber-700`;

  if (text === "retail") return `${base} bg-slate-100 text-slate-700`;
  if (text === "mechanic_prospect") return `${base} bg-violet-100 text-violet-700`;
  if (text === "approved_mechanic") return `${base} bg-amber-100 text-amber-700`;

  if (text === "quote_viewed") return `${base} bg-slate-100 text-slate-700`;
  if (text === "checkout_started") return `${base} bg-indigo-100 text-indigo-700`;
  if (text === "contact_captured") return `${base} bg-sky-100 text-sky-700`;
  if (text === "ready_to_order") return `${base} bg-emerald-100 text-emerald-800`;
  if (text === "ordered") return `${base} bg-amber-100 text-amber-700`;
  if (text === "paid") return `${base} bg-emerald-100 text-emerald-700`;
  if (text === "abandoned") return `${base} bg-rose-100 text-rose-700`;
  if (text === "inventory_unavailable") return `${base} bg-rose-100 text-rose-700`;
  if (text === "alternate_offered") return `${base} bg-blue-100 text-blue-700`;

  if (text === "inventory_check_pending") return `${base} bg-amber-100 text-amber-800`;
  if (text === "inventory_confirmed") return `${base} bg-emerald-100 text-emerald-800`;

  return `${base} bg-slate-100 text-slate-700`;
}

function sourceLabel(value: string | null | undefined) {
  return value || "website";
}

function inventoryLabel(value: string | null | undefined) {
  const text = String(value || "").toLowerCase();

  if (text === "inventory_confirmed") return "Inventory Confirmed";
  if (text === "inventory_unavailable") return "Unavailable";
  if (text === "alternate_offered") return "Alternate Offered";

  return "Pending Check";
}

function getPreferredReplyChannel(sourceChannel: string | null | undefined, existing: string | null | undefined) {
  if (existing) return existing;

  const source = String(sourceChannel || "").toLowerCase();

  if (source === "whatsapp_campaign") return "whatsapp";
  if (
    source === "facebook_marketplace" ||
    source === "facebook" ||
    source === "instagram" ||
    source === "tiktok" ||
    source === "kijiji" ||
    source === "karrot"
  ) {
    return "platform";
  }
  if (source === "mechanic_dashboard") return "dashboard";

  return "email";
}

function getReplyInstruction(
  sourceChannel: string | null | undefined,
  preferredReplyChannel: string | null | undefined,
  hasPhone: boolean,
  hasEmail: boolean
) {
  const channel = getPreferredReplyChannel(sourceChannel, preferredReplyChannel);

  if (channel === "whatsapp") {
    return hasPhone
      ? "Send the checkout link on WhatsApp."
      : "WhatsApp preferred, but no phone found. Update contact details first.";
  }

  if (channel === "platform") {
    return "Reply on the same platform and share the checkout link there.";
  }

  if (channel === "dashboard") {
    return "Show ready-to-order status inside the mechanic dashboard.";
  }

  if (hasPhone) {
    return "Phone is available. SMS or WhatsApp can be used faster than email.";
  }

  if (hasEmail) {
    return "Send the checkout link by email.";
  }

  return "No direct reply channel found. Update contact details first.";
}

function getReadyTemplate(params: {
  firstName?: string | null;
  inventoryStatus?: string | null;
  checkoutLink?: string | null;
}) {
  const name = params.firstName?.trim() || "Customer";

  if (params.inventoryStatus === "inventory_confirmed" && params.checkoutLink) {
    return `Hi ${name}, good news — the requested item is available. You may now proceed with your order using the link below:\n\n${params.checkoutLink}\n\nIf you need any help, please let us know.`;
  }

  if (params.inventoryStatus === "inventory_unavailable") {
    return `Hi ${name}, thank you for your request. At the moment, the requested item is currently unavailable. Our team can help review an alternate option for you if needed.`;
  }

  if (params.inventoryStatus === "alternate_offered") {
    return `Hi ${name}, thank you for your request. We are currently reviewing an alternate option for your requested item and will update you shortly.`;
  }

  return `Hi ${name}, thank you for your request. Inventory availability is currently being verified, and we will update you shortly.`;
}

export default async function AdminQuoteLeadsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  const source = sp.source?.trim() || "";
  const reply = sp.reply?.trim() || "";
  const customerType = sp.customerType?.trim() || "";
  const status = sp.status?.trim() || "";
  const inventory = sp.inventory?.trim() || "";

  const where = {
    ...(source ? { sourceChannel: source } : {}),
    ...(reply ? { preferredReplyChannel: reply } : {}),
    ...(customerType ? { customerType } : {}),
    ...(status ? { status } : {}),
    ...(inventory ? { inventoryStatus: inventory } : {}),
  };

  const leads = await prisma.quoteLead.findMany({
    where,
    include: {
      customer: true,
      order: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const totalLeads = leads.length;
  const pendingInventory = leads.filter(
    (lead) => lead.inventoryStatus === "inventory_check_pending"
  ).length;
  const readyToOrder = leads.filter((lead) => lead.status === "ready_to_order").length;
  const ordered = leads.filter((lead) => lead.status === "ordered").length;
  const paid = leads.filter((lead) => lead.status === "paid").length;
  const mechanicProspects = leads.filter(
    (lead) => lead.customerType === "mechanic_prospect"
  ).length;

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL?.trim() || "http://localhost:3000";

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Quote Leads
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-600">
              Verify inventory first, then send checkout only when the lead is ready to order.
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to Admin
          </Link>
        </div>

        <form className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <select
            name="source"
            defaultValue={source}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All Sources</option>
            <option value="website">website</option>
            <option value="seo">seo</option>
            <option value="google_products">google_products</option>
            <option value="whatsapp_campaign">whatsapp_campaign</option>
            <option value="mechanic_dashboard">mechanic_dashboard</option>
            <option value="facebook_marketplace">facebook_marketplace</option>
            <option value="facebook">facebook</option>
            <option value="instagram">instagram</option>
            <option value="tiktok">tiktok</option>
            <option value="kijiji">kijiji</option>
            <option value="karrot">karrot</option>
          </select>

          <select
            name="reply"
            defaultValue={reply}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All Reply Routes</option>
            <option value="email">email</option>
            <option value="whatsapp">whatsapp</option>
            <option value="platform">platform</option>
            <option value="dashboard">dashboard</option>
          </select>

          <select
            name="customerType"
            defaultValue={customerType}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All Customer Types</option>
            <option value="retail">retail</option>
            <option value="mechanic_prospect">mechanic_prospect</option>
            <option value="approved_mechanic">approved_mechanic</option>
          </select>

          <select
            name="status"
            defaultValue={status}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All Lead Status</option>
            <option value="quote_viewed">quote_viewed</option>
            <option value="checkout_started">checkout_started</option>
            <option value="contact_captured">contact_captured</option>
            <option value="ready_to_order">ready_to_order</option>
            <option value="ordered">ordered</option>
            <option value="paid">paid</option>
            <option value="abandoned">abandoned</option>
            <option value="inventory_unavailable">inventory_unavailable</option>
            <option value="alternate_offered">alternate_offered</option>
          </select>

          <select
            name="inventory"
            defaultValue={inventory}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All Inventory Status</option>
            <option value="inventory_check_pending">inventory_check_pending</option>
            <option value="inventory_confirmed">inventory_confirmed</option>
            <option value="inventory_unavailable">inventory_unavailable</option>
            <option value="alternate_offered">alternate_offered</option>
          </select>

          <div className="md:col-span-2 xl:col-span-5 flex gap-3">
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white"
            >
              Apply Filters
            </button>
            <a
              href="/admin/quote-leads"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700"
            >
              Reset
            </a>
          </div>
        </form>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Total Leads
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">{totalLeads}</div>
          </div>

          <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
            <div className="text-xs font-bold uppercase tracking-wide text-amber-700">
              Inventory Pending
            </div>
            <div className="mt-2 text-2xl font-black text-amber-900">
              {pendingInventory}
            </div>
          </div>

          <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
            <div className="text-xs font-bold uppercase tracking-wide text-emerald-700">
              Ready to Order
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-900">
              {readyToOrder}
            </div>
          </div>

          <div className="rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-200">
            <div className="text-xs font-bold uppercase tracking-wide text-sky-700">
              Ordered
            </div>
            <div className="mt-2 text-2xl font-black text-sky-900">{ordered}</div>
          </div>

          <div className="rounded-2xl bg-violet-50 p-4 ring-1 ring-violet-200">
            <div className="text-xs font-bold uppercase tracking-wide text-violet-700">
              Mechanic Prospects
            </div>
            <div className="mt-2 text-2xl font-black text-violet-900">
              {mechanicProspects}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Lead</th>
                <th className="px-4 py-3 font-semibold">Vehicle / Part</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Lead Status</th>
                <th className="px-4 py-3 font-semibold">Inventory</th>
                <th className="px-4 py-3 font-semibold">Reply Channel</th>
                <th className="px-4 py-3 font-semibold">Reply Instruction</th>
                <th className="px-4 py-3 font-semibold">Source</th>
                <th className="px-4 py-3 font-semibold">Checkout Link / Template</th>
                <th className="px-4 py-3 font-semibold">Updated</th>
                <th className="px-4 py-3 font-semibold">Quick Actions</th>
              </tr>
            </thead>

            <tbody>
              {leads.length === 0 ? (
                <tr className="border-t">
                  <td colSpan={11} className="px-4 py-10 text-center text-slate-500">
                    No quote leads found.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const checkoutLink =
                    lead.inventoryStatus === "inventory_confirmed" && lead.quoteId
                      ? `${baseUrl}/checkout?quoteId=${encodeURIComponent(
                          lead.quoteId
                        )}&offerId=${encodeURIComponent(
                          lead.offerId || ""
                        )}&partType=${encodeURIComponent(
                          lead.partType || ""
                        )}&price=${encodeURIComponent(
                          String((lead.itemPriceCents || 0) / 100)
                        )}&qty=1${
                          lead.year ? `&year=${encodeURIComponent(String(lead.year))}` : ""
                        }${lead.make ? `&make=${encodeURIComponent(lead.make)}` : ""}${
                          lead.model ? `&model=${encodeURIComponent(lead.model)}` : ""
                        }${lead.engine ? `&engine=${encodeURIComponent(lead.engine)}` : ""}${
                          lead.vin ? `&vin=${encodeURIComponent(lead.vin)}` : ""
                        }${
                          lead.utmSource
                            ? `&utm_source=${encodeURIComponent(lead.utmSource)}`
                            : ""
                        }${
                          lead.utmMedium
                            ? `&utm_medium=${encodeURIComponent(lead.utmMedium)}`
                            : ""
                        }${
                          lead.utmCampaign
                            ? `&utm_campaign=${encodeURIComponent(lead.utmCampaign)}`
                            : ""
                        }${
                          lead.sourceChannel
                            ? `&source_channel=${encodeURIComponent(lead.sourceChannel)}`
                            : ""
                        }`
                      : null;

                  const replyInstruction = getReplyInstruction(
                    lead.sourceChannel,
                    lead.preferredReplyChannel,
                    Boolean(lead.phone || lead.whatsappNumber),
                    Boolean(lead.email)
                  );

                  const replyTemplate = getReadyTemplate({
                    firstName: lead.firstName,
                    inventoryStatus: lead.inventoryStatus,
                    checkoutLink,
                  });

                  return (
                    <tr key={lead.id} className="border-t align-top">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">
                          {[lead.firstName, lead.lastName].filter(Boolean).join(" ") || "Unknown Lead"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {lead.email || "No email"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {lead.phone || lead.whatsappNumber || "No phone"}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          Lead ID: {lead.id.slice(0, 8)}...
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">
                          {lead.partType || "Part"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {[lead.year, lead.make, lead.model, lead.engine]
                            .filter(Boolean)
                            .join(" • ") || "Vehicle details not complete"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          VIN: {lead.vin || "—"}
                        </div>
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {money(lead.itemPriceCents)}
                      </td>

                      <td className="px-4 py-3">
                        <span className={badgeClass(lead.status)}>{lead.status}</span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <span className={badgeClass(lead.inventoryStatus)}>
                            {inventoryLabel(lead.inventoryStatus)}
                          </span>
                          <div className="text-xs text-slate-500">
                            Checked: {formatDateTime(lead.inventoryCheckedAt)}
                          </div>
                          <div className="max-w-[220px] text-xs text-slate-500">
                            {lead.inventoryNotes || "No inventory notes yet."}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <span className={badgeClass(getPreferredReplyChannel(lead.sourceChannel, lead.preferredReplyChannel))}>
                            {getPreferredReplyChannel(lead.sourceChannel, lead.preferredReplyChannel)}
                          </span>
                          <div className="text-xs text-slate-500">
                            Inbound: {lead.lastInboundChannel || "—"}
                          </div>
                          <div className="text-xs text-slate-500">
                            Outbound: {lead.lastOutboundChannel || "—"}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="max-w-[220px] text-xs font-medium text-slate-700">
                          {replyInstruction}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                            {sourceLabel(lead.sourceChannel)}
                          </span>
                          <div className="text-xs text-slate-500">
                            {lead.customerType || "-"}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="space-y-2">
                          {checkoutLink ? (
                            <>
                              <a
                                href={checkoutLink}
                                target="_blank"
                                rel="noreferrer"
                                className="block text-xs font-semibold text-blue-600 underline break-all"
                              >
                                Open Checkout Link
                              </a>

                              <div className="text-[11px] text-slate-500 break-all">
                                {checkoutLink}
                              </div>

                              <form
                                action={async () => {
                                  "use server";
                                  await markLeadCheckoutLinkSent(lead.id);
                                }}
                              >
                                <button
                                  type="submit"
                                  className="rounded-xl border border-sky-200 px-3 py-2 text-xs font-bold text-sky-700 hover:bg-sky-50"
                                >
                                  Mark Link Sent
                                </button>
                              </form>

                              <div className="text-xs text-slate-500">
                                Sent: {formatDateTime(lead.checkoutLinkSentAt)}
                              </div>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400">
                              Checkout link available only after inventory confirmation.
                            </span>
                          )}

                          <div className="rounded-2xl bg-slate-50 p-3">
                            <div className="text-xs font-bold text-slate-900">
                              Suggested Reply Text
                            </div>
                            <div className="mt-2 whitespace-pre-wrap text-[11px] text-slate-700">
                              {replyTemplate}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        <div>{formatDateTime(lead.updatedAt)}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          Ready: {formatDateTime(lead.readyToOrderAt)}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Inventory Updated: {formatDateTime(lead.inventoryUpdatedAt)}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex min-w-[180px] flex-col gap-2">
                          <form
                            action={async () => {
                              "use server";
                              await markLeadInventoryPending(lead.id);
                            }}
                          >
                            <button
                              type="submit"
                              className="w-full rounded-xl border border-amber-200 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50"
                            >
                              Inventory Pending
                            </button>
                          </form>

                          <form
                            action={async () => {
                              "use server";
                              await markLeadInventoryConfirmed(lead.id);
                            }}
                          >
                            <button
                              type="submit"
                              className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50"
                            >
                              Confirm Available
                            </button>
                          </form>

                          <form
                            action={async () => {
                              "use server";
                              await markLeadInventoryUnavailable(lead.id);
                            }}
                          >
                            <button
                              type="submit"
                              className="w-full rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50"
                            >
                              Mark Unavailable
                            </button>
                          </form>

                          <form
                            action={async () => {
                              "use server";
                              await markLeadAlternateOffered(lead.id);
                            }}
                          >
                            <button
                              type="submit"
                              className="w-full rounded-xl border border-sky-200 px-3 py-2 text-xs font-bold text-sky-700 hover:bg-sky-50"
                            >
                              Offer Alternate
                            </button>
                          </form>

                          <form
                            action={async () => {
                              "use server";
                              await markLeadAbandoned(lead.id);
                            }}
                          >
                            <button
                              type="submit"
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                            >
                              Mark Abandoned
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-3xl bg-sky-50 p-5 text-sm font-medium text-sky-900 ring-1 ring-sky-200">
        Best flow for your business:
        <span className="font-bold">
          {" "}
          show price first, verify inventory, then send checkout only after stock is confirmed.
        </span>
      </div>
    </div>
  );
}