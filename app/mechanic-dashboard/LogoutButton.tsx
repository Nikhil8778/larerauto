"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/mechanic/logout", {
      method: "POST",
    });

    router.push("/mechanic-login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-xl border px-4 py-2"
    >
      Logout
    </button>
  );
}