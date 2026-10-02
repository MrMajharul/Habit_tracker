import { Suspense } from "react";

import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { GreetingSection } from "@/components/dashboard/greeting-section";
import { HadithOfTheDay } from "@/components/dashboard/hadith-of-the-day";
import { PrayerTimesCard } from "@/components/dashboard/prayer-times-card";
import { ProgressOverview } from "@/components/dashboard/progress-overview";
import { QuranDashboardCard } from "@/components/dashboard/quran-dashboard-card";
import { SmartSuggestionsCard } from "@/components/dashboard/smart-suggestions-card";
import { TodaysHabits } from "@/components/dashboard/todays-habits";
import { TodaysTasks } from "@/components/dashboard/todays-tasks";
import { YourProgressCard } from "@/components/dashboard/your-progress-card";
import { getDashboardData } from "@/services/dashboard/dashboard-service";
import { hadithService } from "@/services/hadith/hadith-service";
import { getPrayerDaySummary } from "@/services/prayer";
import { suggestionEngine } from "@/services/suggestions/suggestion-engine";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard — Istiqamaah",
  description: "Plan your day around Salah, build better habits, and make time for what matters.",
};

// ─── Critical Content: Greeting + Prayer + Progress ─────────────────────────
// This renders first — the user sees the greeting, prayer times, and progress
// without waiting for hadith, suggestions, or secondary content.
async function CriticalContent() {
  const [dashboard, prayerSummary] = await Promise.all([
    getDashboardData(),
    getPrayerDaySummary({ timezone: "Asia/Dhaka" }),
  ]);

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        <div className="space-y-6 lg:col-span-2">
          <GreetingSection profile={dashboard.profile} />
          <div className="lg:hidden">
            <Suspense fallback={<HadithSkeleton />}>
              <HadithSection compact />
            </Suspense>
          </div>
          <PrayerTimesCard summary={prayerSummary} />
          <Suspense fallback={<SuggestionsSkeleton />}>
            <SuggestionsSection
              prayerSummary={prayerSummary}
              habits={dashboard.habits}
              tasks={dashboard.tasks}
            />
          </Suspense>
        </div>

        <div className="hidden lg:block lg:sticky lg:top-6">
          <Suspense fallback={<HadithSkeleton />}>
            <HadithSection />
          </Suspense>
        </div>
      </div>

      <ProgressOverview progress={dashboard.progress} />

      <YourProgressCard />

      <QuranDashboardCard />

      <div className="grid gap-6 md:grid-cols-2">
        <TodaysHabits habits={dashboard.habits} isMockData={dashboard.isMockData} />
        <TodaysTasks
          tasks={dashboard.tasks}
          isMockData={dashboard.isMockData}
          focusMinutesToday={dashboard.progress.focusMinutesToday}
          completedSessionsToday={Math.floor(dashboard.progress.focusMinutesToday / 25)}
        />
      </div>
    </>
  );
}

// ─── Deferred: Hadith of the Day (loaded progressively) ─────────────────────
async function HadithSection({ compact }: { compact?: boolean }) {
  const hadith = await hadithService.getHadithOfTheDay();
  return <HadithOfTheDay hadith={hadith} compact={compact} />;
}

// ─── Deferred: Smart Suggestions (depends on prayer + dashboard data) ────────
async function SuggestionsSection({
  prayerSummary,
  habits,
  tasks,
}: {
  prayerSummary: Awaited<ReturnType<typeof getPrayerDaySummary>>;
  habits: Awaited<ReturnType<typeof getDashboardData>>["habits"];
  tasks: Awaited<ReturnType<typeof getDashboardData>>["tasks"];
}) {
  const suggestions = await suggestionEngine.generateSuggestions({
    nextPrayerName: prayerSummary.nextPrayer?.name ?? "Asr",
    nextPrayerTime: prayerSummary.nextPrayer?.time,
    userHabits: habits.map((h) => ({
      name: h.name,
      prayerAnchor: h.prayerAnchor,
      completed: h.completed,
      icon: h.icon,
    })),
    pendingTasks: tasks.map((t) => ({
      title: t.title,
      subject: t.subject,
      estimatedMinutes: t.estimatedMinutes,
    })),
  });

  return <SmartSuggestionsCard suggestion={suggestions} />;
}

// ─── Mini Skeletons for deferred sections ───────────────────────────────────
function HadithSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
    </Card>
  );
}

function SuggestionsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-44" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<DashboardSkeleton />}>
        <CriticalContent />
      </Suspense>
    </div>
  );
}
