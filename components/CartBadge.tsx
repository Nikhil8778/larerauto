"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCart } from "@/lib/cart";

function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

type CartBadgeProps = {
  compact?: boolean;
};

export default function CartBadge({ compact = false }: CartBadgeProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const refresh = () => setCount(getCartCount());

    refresh();

    window.addEventListener("storage", refresh);
    window.addEventListener("cart-updated", refresh as EventListener);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("cart-updated", refresh as EventListener);
    };
  }, []);

  if (compact) {
    return (
      <Link
        href="/cart"
        className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-medium text-white/95 transition hover:bg-white/15"
        aria-label="Open cart"
      >
        <span>🛒</span>
        <span>Open Cart</span>
        {count > 0 ? (
          <span className="inline-flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-extrabold text-white">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </Link>
    );
  }

  return (
    <Link
      href="/cart"
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:bg-white/10"
      aria-label="Open cart"
    >
      <span className="text-lg">🛒</span>

      {count > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-extrabold text-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}