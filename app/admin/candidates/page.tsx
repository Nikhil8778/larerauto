import CandidateTable from "./CandidateTable";

async function getData() {
  const res = await fetch("http://localhost:3000/api/admin/candidates", {
    cache: "no-store",
  });

  const data = await res.json();
  return data.rows;
}

export default async function Page() {
  const rows = await getData();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Vendor Candidates</h1>

      <CandidateTable rows={rows} />
    </div>
  );
}