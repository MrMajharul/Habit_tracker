import { Suspense } from "react";

import { PrayerPageClient } from "@/components/prayer/prayer-page-client";
import { Skeleton } from "@/components/ui/skeleton";
import { getPrayerDaySummary } from "@/services/prayer";

export const metadata = { title: "Prayer" };

function PrayerSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-xl" />
      ))}
    </div>
  );
}

async function PrayerContent() {
  const summary = await getPrayerDaySummary({ timezone: "Asia/Dhaka" });
  return <PrayerPageClient summary={summary} />;
}

export default function PrayerPage() {
  return (
    <Suspense fallback={<PrayerSkeleton />}>
      <PrayerContent />
    </Suspense>
  );
}
