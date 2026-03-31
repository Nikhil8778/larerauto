import { prisma } from "@/lib/prisma";
import { sendMechanicInvite } from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  reply?: string;
  customerType?: string;
  source?: string;
  eligible?: string;
}>;

function shortToken(token: string | null) {
  if (!token) return "-";
  if (token.length <= 16) return token;
  return `${token.slice(0, 10)}...${token.slice(-8)}`;
}

function badgeTone(value: string | null | undefined) {
  const text = String(value || "").toLowerCase();

  if (text === "whatsapp") return "bg-emerald-100 text-emerald-700";
  if (text === "email") return "bg-sky-100 text-sky-700";
  if (text === "platform") return "bg-violet-100 text-violet-700";
  if (text === "dashboard") return "bg-amber-100 text-amber-700";
  if (text === "approved_mechanic") return "bg-amber-100 text-amber-700";
  if (text === "mechanic_prospect") return "bg-violet-100 text-violet-700";
  if (text === "retail") return "bg-slate-100 text-slate-700";

  return "bg-slate-100 text-slate-700";
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  const reply = sp.reply?.trim() || "";
  const customerType = sp.customerType?.trim() || "";
  const source = sp.source?.trim() || "";
  const eligible = sp.eligible?.trim() || "";

  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 30);

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL?.trim() || "http://localhost:3000";

  const customers = await prisma.customer.findMany({
    include: {
      convertedWorkshopLead: true,
      orders: {
        select: {
          id: true,
          createdAt: true,
          totalCents: true,
          paymentStatus: true,
        },
      },
      _count: {
        select: {
          orders: true,
          invoices: true,
          conversations: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const filteredCustomers = customers.filter((customer) => {
    const paidOrdersLast30 = customer.orders.filter(
      (order) =>
        order.createdAt >= start &&
        ["paid", "completed"].includes((order.paymentStatus || "").toLowerCase())
    );

    const isEligible =
      customer.isMechanicEligible || paidOrdersLast30.length >= 2;

    const sourceValue = customer.convertedWorkshopLead ? "outreach_conversion" : "direct";

    if (reply && customer.preferredReplyChannel !== reply) return false;
    if (customerType && customer.customerType !== customerType) return false;
    if (source && sourceValue !== source) return false;
    if (eligible === "yes" && !isEligible) return false;
    if (eligible === "no" && isEligible) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Customers</h1>
        <p className="mt-2 text-sm font-medium text-slate-600">
          Customer CRM with outreach conversion visibility and repeat-buyer tracking.
        </p>

        <form className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select
            name="reply"
            defaultValue={reply}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All Reply Channels</option>
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
            name="source"
            defaultValue={source}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All Sources</option>
            <option value="direct">direct</option>
            <option value="outreach_conversion">outreach_conversion</option>
          </select>

          <select
            name="eligible"
            defaultValue={eligible}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All Eligibility</option>
            <option value="yes">eligible</option>
            <option value="no">not eligible</option>
          </select>

          <div className="md:col-span-2 xl:col-span-4 flex gap-3">
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white"
            >
              Apply Filters
            </button>
            <a
              href="/admin/customers"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700"
            >
              Reset
            </a>
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Company</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Orders</th>
              <th className="px-4 py-3 font-semibold">Last 30 Days</th>
              <th className="px-4 py-3 font-semibold">Eligibility</th>
              <th className="px-4 py-3 font-semibold">Invite</th>
              <th className="px-4 py-3 font-semibold">Signup Link</th>
              <th className="px-4 py-3 font-semibold">Token</th>
              <th className="px-4 py-3 font-semibold">Reply Channel</th>
              <th className="px-4 py-3 font-semibold">Customer Type</th>
              <th className="px-4 py-3 font-semibold">Source</th>
              <th className="px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr className="border-t">
                <td colSpan={14} className="px-4 py-10 text-center text-slate-500">
                  No customers found.
                </td>
              </tr>
            ) : (
              filteredCustomers.map((customer) => {
                const paidOrdersLast30 = customer.orders.filter(
                  (order) =>
                    order.createdAt >= start &&
                    ["paid", "completed"].includes((order.paymentStatus || "").toLowerCase())
                );

                const isEligible =
                  customer.isMechanicEligible || paidOrdersLast30.length >= 2;

                const signupUrl = customer.mechanicInviteToken
                  ? `${baseUrl}/mechanic-signup?token=${customer.mechanicInviteToken}`
                  : null;

                return (
                  <tr key={customer.id} className="border-t align-top">
                    <td className="px-4 py-3 font-semibold">
                      {customer.firstName} {customer.lastName ?? ""}
                    </td>

                    <td className="px-4 py-3">{customer.companyName ?? "-"}</td>
                    <td className="px-4 py-3">{customer.phone ?? "-"}</td>
                    <td className="px-4 py-3">{customer.email ?? "-"}</td>
                    <td className="px-4 py-3">{customer._count.orders}</td>
                    <td className="px-4 py-3">{paidOrdersLast30.length}</td>

                    <td className="px-4 py-3">
                      {isEligible ? (
                        <div className="space-y-1">
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                            mechanic-eligible
                          </span>
                          <div className="text-xs text-slate-500">
                            Since{" "}
                            {customer.mechanicEligibleAt
                              ? new Date(customer.mechanicEligibleAt).toLocaleString()
                              : "-"}
                          </div>
                        </div>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                          normal
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {customer.mechanicInviteSentAt ? (
                        <div className="space-y-1">
                          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">
                            invite sent
                          </span>
                          <div className="text-xs text-slate-500">
                            Sent: {new Date(customer.mechanicInviteSentAt).toLocaleString()}
                          </div>
                          <div className="text-xs text-slate-500">
                            Expires:{" "}
                            {customer.mechanicInviteExpiresAt
                              ? new Date(customer.mechanicInviteExpiresAt).toLocaleString()
                              : "-"}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">not sent</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {signupUrl ? (
                        <div className="max-w-[260px] space-y-2">
                          <a
                            href={signupUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block break-all text-xs font-semibold text-blue-600 underline"
                          >
                            Open signup link
                          </a>
                          <div className="break-all text-[11px] text-slate-500">
                            {signupUrl}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {customer.mechanicInviteToken ? (
                        <div className="space-y-1">
                          <div className="text-xs font-semibold text-slate-700">
                            {shortToken(customer.mechanicInviteToken)}
                          </div>
                          <div className="break-all text-[11px] text-slate-500">
                            {customer.mechanicInviteToken}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {customer.preferredReplyChannel ? (
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${badgeTone(
                            customer.preferredReplyChannel
                          )}`}
                        >
                          {customer.preferredReplyChannel}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {customer.customerType ? (
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${badgeTone(
                            customer.customerType
                          )}`}
                        >
                          {customer.customerType}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {customer.convertedWorkshopLead ? (
                        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
                          outreach conversion
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                          direct
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {customer.mechanicSignupCompletedAt ? (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                          signup completed
                        </span>
                      ) : isEligible ? (
                        customer.mechanicInviteSentAt ? (
                          <span className="text-xs font-semibold text-slate-500">
                            Waiting for response
                          </span>
                        ) : (
                          <form
                            action={async () => {
                              "use server";
                              await sendMechanicInvite(customer.id);
                            }}
                          >
                            <button
                              type="submit"
                              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-extrabold text-white hover:bg-slate-800"
                            >
                              Send Invite
                            </button>
                          </form>
                        )
                      ) : (
                        <span className="text-xs text-slate-400">Not eligible yet</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}