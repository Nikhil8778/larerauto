import { headers } from "next/headers";
import CandidateTable from "./CandidateTable";

type SearchParams = Promise<{
  make?: string;
  model?: string;
  partType?: string;
  status?: string;
  take?: string;
}>;

async function getData(searchParams: {
  make?: string;
  model?: string;
  partType?: string;
  status?: string;
  take?: string;
}) {
  const h = await headers();
  const host = h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";

  const url = new URL("/api/admin/candidates", `${proto}://${host}`);

  if (searchParams.make) url.searchParams.set("make", searchParams.make);
  if (searchParams.model) url.searchParams.set("model", searchParams.model);
  if (searchParams.partType) url.searchParams.set("partType", searchParams.partType);
  if (searchParams.status) url.searchParams.set("status", searchParams.status);
  if (searchParams.take) url.searchParams.set("take", searchParams.take);

  const res = await fetch(url.toString(), {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to load candidates");
  }

  const data = await res.json();
  return data;
}

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  const data = await getData({
    make: sp.make,
    model: sp.model,
    partType: sp.partType,
    status: sp.status,
    take: sp.take,
  });

  const rows = data.rows ?? [];
  const makeOptions = data.makeOptions ?? [];
  const modelOptions = data.modelOptions ?? [];
  const partTypeOptions = data.partTypeOptions ?? [];

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-3xl font-black text-slate-900">Vendor Candidates</h1>
        <p className="mt-2 text-sm font-medium text-slate-600">
          Review Amazon candidate matches before or after automated price sync.
        </p>

        <form method="GET" className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <select
            name="make"
            defaultValue={sp.make ?? ""}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All Makes</option>
            {makeOptions.map((item: string) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            name="model"
            defaultValue={sp.model ?? ""}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All Models</option>
            {modelOptions.map((item: string) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            name="partType"
            defaultValue={sp.partType ?? ""}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All Part Types</option>
            {partTypeOptions.map((item: string) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            name="status"
            defaultValue={sp.status ?? ""}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All Offer Status</option>
            <option value="pending">pending</option>
            <option value="failed">failed</option>
            <option value="success">success</option>
          </select>

          <select
            name="take"
            defaultValue={sp.take ?? "20"}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="10">10 offers</option>
            <option value="20">20 offers</option>
            <option value="50">50 offers</option>
            <option value="100">100 offers</option>
          </select>

          <div className="md:col-span-2 xl:col-span-5 flex gap-3">
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white"
            >
              Apply Filters
            </button>
            <a
              href="/admin/candidates"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700"
            >
              Reset
            </a>
          </div>
        </form>
      </div>

      <CandidateTable rows={rows} />
    </div>
  );
}