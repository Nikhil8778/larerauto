"use client";

type Candidate = {
  id: string;
  vendor: string;
  title: string;
  productUrl: string;
  score: number;
  selected: boolean;
};

type Row = {
  offerId: string;
  make: string;
  model: string;
  engine: string;
  year: number;
  partType: string;
  title?: string;
  candidates: Candidate[];
};

export default function CandidateTable({ rows }: { rows: Row[] }) {
  return (
    <div className="space-y-10">
      {rows.map((row) => (
        <div key={row.offerId} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            {row.year} {row.make} {row.model} {row.engine} — {row.partType}
          </h2>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-700">
                  <th className="py-2 pr-4 font-semibold">Vendor</th>
                  <th className="px-2 py-2 font-semibold">Title</th>
                  <th className="px-2 py-2 font-semibold">Score</th>
                  <th className="px-2 py-2 font-semibold">Open</th>
                  <th className="px-2 py-2 font-semibold">Select</th>
                </tr>
              </thead>

              <tbody>
                {row.candidates.map((c) => (
                  <tr key={c.id} className="border-b align-top">
                    <td className="py-3 pr-4 capitalize text-slate-800">{c.vendor}</td>

                    <td className="px-2 py-3 text-slate-800">
                      <div className="max-w-[720px] whitespace-normal break-words">
                        {c.title}
                      </div>
                    </td>

                    <td className="px-2 py-3 text-slate-800">{c.score}</td>

                    <td className="px-2 py-3">
                      <a
                        href={c.productUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline"
                      >
                        Open
                      </a>
                    </td>

                    <td className="px-2 py-3">
                      {c.selected ? (
                        <span className="rounded bg-green-600 px-2 py-1 text-xs font-semibold text-white">
                          Selected
                        </span>
                      ) : (
                        <button
                          className="rounded bg-black px-3 py-1 text-white"
                          onClick={async () => {
                            await fetch("/api/admin/select-candidate", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                candidateId: c.id,
                              }),
                            });

                            location.reload();
                          }}
                        >
                          Select
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {row.candidates.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-sm text-slate-500">
                      No candidates found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}