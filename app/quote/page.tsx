"use client";

import { Suspense } from "react";
import QuoteClient from "./QuoteClient";

export default function QuotePage() {
  return (
    <Suspense fallback={<div className="p-6">Loading quote...</div>}>
      <QuoteClient />
    </Suspense>
  );
}