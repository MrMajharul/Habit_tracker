import { Suspense } from "react";
import type { Metadata } from "next";

import { AnalyticsPageClient } from "@/components/analytics/analytics-page-client";

export const metadata: Metadata = {
  title: "Analytics — Istiqamaah",
  description: "Private personal progress and insights across your Deen and life.",
};

export default function AnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <AnalyticsPageClient />
    </Suspense>
  );
}
