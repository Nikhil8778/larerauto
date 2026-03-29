export default function MechanicSignupSuccessPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-3xl border border-emerald-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900">Signup Submitted Successfully</h1>
        <p className="mt-3 text-sm font-medium text-slate-600">
          Your mechanic/workshop account has been created and is waiting for admin approval.
        </p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          Lare Auto will review your signup and activate your partner access.
        </div>
      </div>
    </div>
  );
}