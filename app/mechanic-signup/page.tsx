"use client";

import { useState } from "react";

export default function MechanicSignupPage() {
  const [form, setForm] = useState({
    shopName: "",
    contactName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/mechanic/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      setMessage(data.message || "Done.");

      if (res.ok) {
        setForm({
          shopName: "",
          contactName: "",
          email: "",
          phone: "",
          password: "",
        });
      }
    } catch {
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">Mechanic Signup</h1>
      <p className="mb-6 text-sm text-gray-600">
        Create your trade account. After admin approval, you can log in and use mechanic features.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border p-6 shadow-sm">
        <input
          className="w-full rounded-xl border px-4 py-3"
          placeholder="Shop Name"
          value={form.shopName}
          onChange={(e) => setForm({ ...form, shopName: e.target.value })}
        />
        <input
          className="w-full rounded-xl border px-4 py-3"
          placeholder="Contact Name"
          value={form.contactName}
          onChange={(e) => setForm({ ...form, contactName: e.target.value })}
        />
        <input
          className="w-full rounded-xl border px-4 py-3"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className="w-full rounded-xl border px-4 py-3"
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <input
          className="w-full rounded-xl border px-4 py-3"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-black px-5 py-3 text-white"
        >
          {loading ? "Submitting..." : "Create Mechanic Account"}
        </button>

        {message ? <p className="text-sm">{message}</p> : null}
      </form>
    </div>
  );
}