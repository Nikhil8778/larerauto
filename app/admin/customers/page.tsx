import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { sendMechanicInvite } from "./actions";

export const dynamic = "force-dynamic";

function shortToken(token: string | null) {
  if (!token) return "-";
  if (token.length <= 16) return token;
  return `${token.slice(0, 10)}...${token.slice(-8)}`;
}

export default async function AdminCustomersPage() {
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

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Customers</h1>
        <p className="mt-2 text-sm font-medium text-slate-600">
          Customer CRM with outreach conversion visibility and repeat-buyer tracking.
        </p>
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
              <th className="px-4 py-3 font-semibold">Source</th>
              <th className="px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>

          <tbody>
            {customers.length === 0 ? (
              <tr className="border-t">
                <td colSpan={12} className="px-4 py-10 text-center text-slate-500">
                  No customers yet.
                </td>
              </tr>
            ) : (
              customers.map((customer) => {
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