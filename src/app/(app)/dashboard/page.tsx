import { Suspense } from "react";

import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { GreetingSection } from "@/components/dashboard/greeting-section";
import { HadithOfTheDay } from "@/components/dashboard/hadith-of-the-day";
import { PrayerTimesCard } from "@/components/dashboard/prayer-times-card";
import { ProgressOverview } from "@/components/dashboard/progress-overview";
import { TodaysHabits } from "@/components/dashboard/todays-habits";
import { TodaysTasks } from "@/components/dashboard/todays-tasks";
import { getDashboardData } from "@/services/dashboard/dashboard-service";
import { hadithService } from "@/services/hadith/hadith-service";
import { getPrayerDaySummary } from "@/services/prayer";

export const metadata = {
  title: "Dashboard",
};

async function DashboardContent() {
  const [dashboard, prayerSummary, hadith] = await Promise.all([
    getDashboardData(),
    getPrayerDaySummary({ timezone: "Asia/Dhaka" }),
    hadithService.getHadithOfTheDay(),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        <div className="space-y-6 lg:col-span-2">
          <GreetingSection profile={dashboard.profile} />
          <div className="lg:hidden">
            <HadithOfTheDay hadith={hadith} compact />
          </div>
          <PrayerTimesCard summary={prayerSummary} />
        </div>

        <div className="hidden lg:block">
          <HadithOfTheDay hadith={hadith} />
        </div>
      </div>

      <ProgressOverview progress={dashboard.progress} />

      <div className="grid gap-6 md:grid-cols-2">
        <TodaysHabits habits={dashboard.habits} isMockData={dashboard.isMockData} />
        <TodaysTasks tasks={dashboard.tasks} isMockData={dashboard.isMockData} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
