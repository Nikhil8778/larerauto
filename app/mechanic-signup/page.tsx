import { prisma } from "@/lib/prisma";
import { submitMechanicSignup } from "./actions";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function MechanicSignupPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const token = String(sp.token ?? "").trim();

  let customer:
    | {
        firstName: string;
        lastName: string | null;
        email: string | null;
        phone: string | null;
        whatsappNumber: string | null;
        companyName: string | null;
        mechanicInviteExpiresAt: Date | null;
        mechanicSignupCompletedAt: Date | null;
      }
    | null = null;

  if (token) {
    customer = await prisma.customer.findFirst({
      where: {
        mechanicInviteToken: token,
      },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        whatsappNumber: true,
        companyName: true,
        mechanicInviteExpiresAt: true,
        mechanicSignupCompletedAt: true,
      },
    });

    if (!customer) {
      return (
        <div className="mx-auto max-w-2xl px-4 py-12">
          <div className="rounded-3xl border border-rose-200 bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-black text-slate-900">Invalid Signup Link</h1>
            <p className="mt-3 text-sm font-medium text-slate-600">
              We could not find a valid invitation for this link.
            </p>
          </div>
        </div>
      );
    }

    if (customer.mechanicSignupCompletedAt) {
      return (
        <div className="mx-auto max-w-2xl px-4 py-12">
          <div className="rounded-3xl border border-emerald-200 bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-black text-slate-900">Signup Already Completed</h1>
            <p className="mt-3 text-sm font-medium text-slate-600">
              This invitation has already been used.
            </p>
          </div>
        </div>
      );
    }

    if (!customer.mechanicInviteExpiresAt || customer.mechanicInviteExpiresAt < new Date()) {
      return (
        <div className="mx-auto max-w-2xl px-4 py-12">
          <div className="rounded-3xl border border-rose-200 bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-black text-slate-900">Signup Link Expired</h1>
            <p className="mt-3 text-sm font-medium text-slate-600">
              This invitation link has expired. Please request a new one from Lare Auto.
            </p>
          </div>
        </div>
      );
    }
  }

  const isInviteMode = Boolean(token);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900">
          {isInviteMode ? "Join Lare Auto Mechanic Program" : "Mechanic / Workshop Signup"}
        </h1>

        <p className="mt-3 text-sm font-medium text-slate-600">
          {isInviteMode
            ? "Complete your signup to access mechanic and workshop partner benefits."
            : "Apply for a Lare Auto mechanic or workshop account. After admin approval, you can log in and use trade features."}
        </p>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Benefits may include trade pricing, referral benefits, and preferred partner support.
        </div>

        <form action={submitMechanicSignup} className="mt-8 grid gap-4 md:grid-cols-2">
          <input type="hidden" name="token" value={token} />

          <div>
            <label className="text-sm font-bold text-slate-700">Shop Name</label>
            <input
              name="shopName"
              defaultValue={customer?.companyName || ""}
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
              placeholder="Your workshop or business name"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">Contact Name</label>
            <input
              name="contactName"
              defaultValue={[customer?.firstName, customer?.lastName].filter(Boolean).join(" ")}
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
              placeholder="Owner or manager name"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">Email</label>
            <input
              name="email"
              type="email"
              defaultValue={customer?.email || ""}
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">Phone</label>
            <input
              name="phone"
              defaultValue={customer?.phone || customer?.whatsappNumber || ""}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
              placeholder="+1..."
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">Password</label>
            <input
              name="password"
              type="password"
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">Confirm Password</label>
            <input
              name="confirmPassword"
              type="password"
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
              placeholder="Re-enter password"
            />
          </div>

          <div className="md:col-span-2 pt-2">
            <button
              type="submit"
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-extrabold text-white hover:bg-slate-800"
            >
              Create My Mechanic Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}