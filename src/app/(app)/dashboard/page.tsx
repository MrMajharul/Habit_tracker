import { Suspense } from "react";

import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { GreetingSection } from "@/components/dashboard/greeting-section";
import { HadithOfTheDay } from "@/components/dashboard/hadith-of-the-day";
import { PrayerTimesCard } from "@/components/dashboard/prayer-times-card";
import { ProgressOverview } from "@/components/dashboard/progress-overview";
import { SmartSuggestionsCard } from "@/components/dashboard/smart-suggestions-card";
import { TodaysHabits } from "@/components/dashboard/todays-habits";
import { TodaysTasks } from "@/components/dashboard/todays-tasks";
import { getDashboardData } from "@/services/dashboard/dashboard-service";
import { hadithService } from "@/services/hadith/hadith-service";
import { getPrayerDaySummary } from "@/services/prayer";
import { suggestionEngine } from "@/services/suggestions/suggestion-engine";

export const metadata = {
  title: "Dashboard — NoorPath",
  description: "Plan your day around Salah, build better habits, and make time for what matters.",
};

async function DashboardContent() {
  const [dashboard, prayerSummary, hadith] = await Promise.all([
    getDashboardData(),
    getPrayerDaySummary({ timezone: "Asia/Dhaka" }),
    hadithService.getHadithOfTheDay(),
  ]);

  const suggestions = await suggestionEngine.generateSuggestions({
    nextPrayerName: prayerSummary.nextPrayer?.name ?? "Asr",
    nextPrayerTime: prayerSummary.nextPrayer?.time,
    userHabits: dashboard.habits.map((h) => ({
      name: h.name,
      prayerAnchor: h.prayerAnchor,
      completed: h.completed,
      icon: h.icon,
    })),
    pendingTasks: dashboard.tasks.map((t) => ({
      title: t.title,
      subject: t.subject,
      estimatedMinutes: t.estimatedMinutes,
    })),
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        <div className="space-y-6 lg:col-span-2">
          <GreetingSection profile={dashboard.profile} />
          <div className="lg:hidden">
            <HadithOfTheDay hadith={hadith} compact />
          </div>
          <PrayerTimesCard summary={prayerSummary} />
          <SmartSuggestionsCard suggestion={suggestions} />
        </div>

        <div className="hidden lg:block lg:sticky lg:top-6">
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
