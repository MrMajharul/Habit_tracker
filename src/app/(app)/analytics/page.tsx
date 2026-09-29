import { Suspense } from "react";
import type { Metadata } from "next";

import { AnalyticsPageClient } from "@/components/analytics/analytics-page-client";

import AnalyticsLoading from "./loading";

export const metadata: Metadata = {
  title: "Analytics — Istiqamaah",
  description: "Private personal progress and insights across your Deen and life.",
};

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsLoading />}>
      <AnalyticsPageClient />
    </Suspense>
  );
}
