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
  title: string;
  candidates: Candidate[];
};

export default function CandidateTable({ rows }: { rows: Row[] }) {
  return (
    <div className="space-y-10">

      {rows.map((row) => (
        <div key={row.offerId} className="border rounded-lg p-4">

          <h2 className="font-semibold mb-3">
            {row.year} {row.make} {row.model} {row.engine} — {row.partType}
          </h2>

          <table className="w-full text-sm">

            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Vendor</th>
                <th>Title</th>
                <th>Score</th>
                <th>Open</th>
              </tr>
            </thead>

            <tbody>
  {row.candidates.map((c) => (
    <tr key={c.id} className="border-b">

  <td className="py-2 capitalize pr-4">{c.vendor}</td>

  <td>{c.title}</td>

  <td>{c.score}</td>

  <td>

    <a
      href={c.productUrl}
      target="_blank"
      className="text-blue-600 underline mr-4"
    >
      Open
    </a>

    {c.selected ? (
      <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">
        Selected
      </span>
    ) : (
      <button
        className="bg-black text-white px-3 py-1 rounded"
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
        </tbody>

          </table>
        </div>
      ))}

    </div>
  );
}