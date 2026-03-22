"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MechanicLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/mechanic/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Login failed.");
        return;
      }

      router.push("/mechanic-dashboard");
      router.refresh();
    } catch {
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">Mechanic Login</h1>
      <p className="mb-6 text-sm text-gray-600">
        Approved mechanics can log in here for trade access and referral tools.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border p-6 shadow-sm">
        <input
          className="w-full rounded-xl border px-4 py-3"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full rounded-xl border px-4 py-3"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-black px-5 py-3 text-white"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {message ? <p className="text-sm">{message}</p> : null}
      </form>
    </div>
  );
}