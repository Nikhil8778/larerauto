import CandidateTable from "./CandidateTable";

async function getData() {
  const res = await fetch("http://localhost:3000/api/admin/candidates", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to load candidates");
  }

  const data = await res.json();
  return data.rows ?? [];
}

export default async function Page() {
  const rows = await getData();

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Vendor Candidates</h1>
      <CandidateTable rows={rows} />
    </div>
  );
}