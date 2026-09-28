import { Suspense } from "react";
import type { Metadata } from "next";

import { AnalyticsExportClient } from "@/components/analytics/analytics-export-client";

export const metadata: Metadata = {
  title: "Export Analytics — Istiqamah",
  description: "Export your personal progress, prayer logs, habits, and focus sessions.",
};

export default function AnalyticsExportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <AnalyticsExportClient />
    </Suspense>
  );
}
