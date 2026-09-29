"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Clock,
  Compass,
  Download,
  Flame,
  Heart,
  Layers,
  Lightbulb,
  Moon,
  RotateCcw,
  Shield,
  Sparkles,
  Target,
  WifiOff,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import dynamic from "next/dynamic";
import { PeriodSelector } from "./period-selector";
import { ActivityHeatmap } from "./activity-heatmap";

const TrendChart = dynamic(
  () => import("./charts/trend-chart").then((m) => m.TrendChart),
  {
    loading: () => <div className="h-52 w-full animate-pulse rounded-xl bg-muted/30" />,
  },
);

const AnalyticsAreaChart = dynamic(
  () => import("./charts/area-chart").then((m) => m.AnalyticsAreaChart),
  {
    loading: () => <div className="h-52 w-full animate-pulse rounded-xl bg-muted/30" />,
  },
);

const SubjectDistributionChart = dynamic(
  () => import("./charts/subject-distribution-chart").then((m) => m.SubjectDistributionChart),
  {
    loading: () => <div className="h-52 w-full animate-pulse rounded-xl bg-muted/30" />,
  },
);
import {
  analyticsService,
  clearAnalyticsMemo,
} from "@/services/analytics/analytics-service";
import type {
  AnalyticsPeriodPreset,
  AnalyticsSummary,
} from "@/services/analytics/analytics-types";
import { formatMinutes, formatRangeLabel } from "@/services/analytics/analytics-period";
import { prayerNameLabel } from "@/services/analytics/analytics-aggregator";
import { cn } from "@/lib/utils";

type ActiveTab =
  | "overview"
  | "salah"
  | "habits"
  | "quran"
  | "dhikr"
  | "study"
  | "focus"
  | "goals"
  | "reflections"
  | "heatmap"
  | "reviews";

const TABS: Array<{ id: ActiveTab; label: string; icon: typeof BarChart3 }> = [
  { id: "overview", label: "Overview", icon: Sparkles },
  { id: "salah", label: "Salah", icon: Compass },
  { id: "habits", label: "Habits", icon: CheckSquare },
  { id: "quran", label: "Qur'an", icon: BookOpen },
  { id: "dhikr", label: "Dhikr", icon: Moon },
  { id: "study", label: "Study & Work", icon: Layers },
  { id: "focus", label: "Focus", icon: Clock },
  { id: "goals", label: "Goals", icon: Target },
  { id: "reflections", label: "Reflections", icon: Heart },
  { id: "heatmap", label: "Heatmap", icon: Calendar },
  { id: "reviews", label: "Reviews", icon: BarChart3 },
];

export function AnalyticsPageClient({ initialTimezone = "UTC" }: { initialTimezone?: string }) {
  const [preset, setPreset] = useState<AnalyticsPeriodPreset>("this_week");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const timezone = useMemo(() => {
    if (typeof window !== "undefined") {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || initialTimezone;
      } catch {
        return initialTimezone;
      }
    }
    return initialTimezone;
  }, [initialTimezone]);

  useEffect(() => {
    let ignore = false;
    async function fetchSummary() {
      try {
        const res = await analyticsService.loadAnalyticsSummary({
          timezone,
          preset,
          customStart: preset === "custom" ? customStart : undefined,
          customEnd: preset === "custom" ? customEnd : undefined,
        });
        if (!ignore) {
          setSummary(res.summary);
          setIsStale(res.fromCache || res.summary.isStale);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Failed to load analytics summary:", err);
          setLoading(false);
        }
      }
    }

    fetchSummary();
    return () => {
      ignore = true;
    };
  }, [preset, customStart, customEnd, timezone, refreshTrigger]);

  const handleRefresh = () => {
    clearAnalyticsMemo();
    setLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handlePresetChange = (newPreset: AnalyticsPeriodPreset) => {
    setLoading(true);
    setPreset(newPreset);
  };

  const handleCustomChange = (start: string, end: string) => {
    setLoading(true);
    setCustomStart(start);
    setCustomEnd(end);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Analytics</h1>
            <Badge variant="outline" className="text-xs font-normal">
              Private
            </Badge>
            {isStale && (
              <Badge variant="secondary" className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <WifiOff className="size-3" />
                Cached
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Personal progress, habit trends, and activity insights — completely private.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="gap-1.5"
            aria-label="Refresh analytics data"
          >
            <RotateCcw className={cn("size-3.5", loading && "animate-spin")} />
            <span className="hidden xs:inline">Refresh</span>
          </Button>

          <Link href="/analytics/export" className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}>
            <Download className="size-3.5" />
            <span>Export</span>
          </Link>
        </div>
      </div>

      {/* Date Period Selector */}
      <Card className="border-border/70">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">Date Period</span>
              {summary && (
                <span className="text-xs font-medium text-foreground/80">
                  {formatRangeLabel(summary.range.startDate, summary.range.endDate)}
                </span>
              )}
            </div>
            <PeriodSelector
              preset={preset}
              customStart={customStart}
              customEnd={customEnd}
              onPresetChange={handlePresetChange}
              onCustomChange={handleCustomChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section Navigation Tabs */}
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Analytics sections">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all sm:text-sm",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {loading && !summary && (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/80 p-8 text-center">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Calculating your personal analytics...</p>
        </div>
      )}

      {summary && (
        <div className="space-y-6">
          {/* TAB: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Salah Activity</p>
                      <Compass className="size-4 text-emerald" />
                    </div>
                    <p className="mt-2 text-2xl font-bold tracking-tight">
                      {summary.prayer.completed}
                      <span className="text-sm font-normal text-muted-foreground">
                        /{summary.prayer.possible}
                      </span>
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {summary.prayer.completionRate}% completion in range
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Habit Targets</p>
                      <CheckSquare className="size-4 text-primary" />
                    </div>
                    <p className="mt-2 text-2xl font-bold tracking-tight">
                      {summary.habits.completionRate}%
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {summary.habits.currentStreak}d best active streak
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Qur&apos;an Reading</p>
                      <BookOpen className="size-4 text-gold" />
                    </div>
                    <p className="mt-2 text-2xl font-bold tracking-tight">
                      {formatMinutes(summary.quran.minutesRead)}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {summary.quran.readingDays} of {summary.quran.possibleDays} days read
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Dhikr Activity</p>
                      <Moon className="size-4 text-purple-500" />
                    </div>
                    <p className="mt-2 text-2xl font-bold tracking-tight">
                      {summary.dhikr.completedSessions}
                      <span className="text-sm font-normal text-muted-foreground"> sessions</span>
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {summary.dhikr.totalCounts} counted repetitions
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Focus Time</p>
                      <Clock className="size-4 text-blue-500" />
                    </div>
                    <p className="mt-2 text-2xl font-bold tracking-tight">
                      {formatMinutes(summary.focus.totalMinutes)}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {summary.focus.completedSessions} completed sessions
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Tasks Done</p>
                      <CheckCircle2 className="size-4 text-emerald" />
                    </div>
                    <p className="mt-2 text-2xl font-bold tracking-tight">
                      {summary.tasks.completed}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {summary.tasks.completionRate}% completion rate
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Active Goals</p>
                      <Target className="size-4 text-amber-500" />
                    </div>
                    <p className="mt-2 text-2xl font-bold tracking-tight">
                      {summary.goals.spiritualActive + summary.goals.productivityActive}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {summary.goals.spiritualCompleted + summary.goals.productivityCompleted} completed
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Reflections</p>
                      <Heart className="size-4 text-rose-500" />
                    </div>
                    <p className="mt-2 text-2xl font-bold tracking-tight">
                      {summary.reflections.reflectionDays}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      days with journal entries
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Personal Insights */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Lightbulb className="size-4 text-gold" />
                    Personal Insights
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Objective observations generated privately from your activity.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {summary.insights.map((insight) => (
                    <div
                      key={insight.id}
                      className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-3 text-sm"
                    >
                      <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                      <p className="leading-snug text-foreground/90">{insight.text}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Daily Activity Trend Chart */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Daily Activity Trend</CardTitle>
                  <CardDescription className="text-xs">
                    Combined activity events across prayer, habits, Qur&apos;an, and focus.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TrendChart data={summary.trends.dailyActivity} label="Activity points per day" />
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB: SALAH */}
          {activeTab === "salah" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Compass className="size-4 text-emerald" />
                    Salah Activity &amp; Consistency
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Private records of prayer completion. This is a personal consistency log, never a worship score.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Per-Prayer Completion Breakdown */}
                  <div className="grid gap-3 sm:grid-cols-5">
                    {summary.prayer.perPrayer.map((item) => (
                      <div
                        key={item.prayer}
                        className="rounded-xl border border-border/70 bg-card p-3 text-center"
                      >
                        <p className="text-xs font-semibold capitalize text-muted-foreground">
                          {prayerNameLabel(item.prayer)}
                        </p>
                        <p className="mt-1 text-xl font-bold">
                          {item.completed}
                          <span className="text-xs font-normal text-muted-foreground">
                            /{item.possible}
                          </span>
                        </p>
                        <Progress
                          value={item.possible ? (item.completed / item.possible) * 100 : 0}
                          className="mt-2 h-1.5"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Prayer Trend Chart */}
                  <TrendChart
                    data={summary.prayer.dailyCompletion}
                    label="Prayers logged per day"
                    unit="/5"
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB: HABITS */}
          {activeTab === "habits" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CheckSquare className="size-4 text-primary" />
                    Habit Performance
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Consistent micro-actions lead to enduring change.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs text-muted-foreground">Completion Rate</p>
                      <p className="mt-1 text-2xl font-bold">{summary.habits.completionRate}%</p>
                    </div>
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs text-muted-foreground">Active Streak</p>
                      <p className="mt-1 flex items-center gap-1 text-2xl font-bold text-amber-500">
                        <Flame className="size-5" />
                        {summary.habits.currentStreak}d
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs text-muted-foreground">Longest Streak</p>
                      <p className="mt-1 text-2xl font-bold">{summary.habits.longestStreak}d</p>
                    </div>
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs text-muted-foreground">Completed Logs</p>
                      <p className="mt-1 text-2xl font-bold">{summary.habits.completedLogs}</p>
                    </div>
                  </div>

                  {/* Habit by habit list */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Habit Details</h3>
                    {summary.habits.habits.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No habits defined yet.</p>
                    ) : (
                      summary.habits.habits.map((habit) => (
                        <div key={habit.habitId} className="space-y-1.5 rounded-xl border border-border/60 p-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{habit.name}</span>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="flex items-center gap-1 font-semibold text-amber-500">
                                <Flame className="size-3" />
                                {habit.currentStreak}d
                              </span>
                              <span className="text-muted-foreground">
                                {habit.completedDays}/{habit.possibleDays} ({habit.completionRate}%)
                              </span>
                            </div>
                          </div>
                          <Progress value={habit.completionRate} className="h-1.5" />
                        </div>
                      ))
                    )}
                  </div>

                  <TrendChart
                    data={summary.habits.weeklyTrend}
                    label="Daily habit completion %"
                    unit="%"
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB: QUR'AN */}
          {activeTab === "quran" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BookOpen className="size-4 text-gold" />
                    Qur&apos;an Reading Analytics
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Your daily relationship with the Book of Allah.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs text-muted-foreground">Reading Time</p>
                      <p className="mt-1 text-2xl font-bold">{formatMinutes(summary.quran.minutesRead)}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs text-muted-foreground">Ayahs Read</p>
                      <p className="mt-1 text-2xl font-bold">{summary.quran.ayahsRead}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs text-muted-foreground">Reading Days</p>
                      <p className="mt-1 text-2xl font-bold">
                        {summary.quran.readingDays}
                        <span className="text-xs font-normal text-muted-foreground">
                          /{summary.quran.possibleDays}
                        </span>
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs text-muted-foreground">Reading Streak</p>
                      <p className="mt-1 flex items-center gap-1 text-2xl font-bold text-amber-500">
                        <Flame className="size-5" />
                        {summary.quran.currentStreak}d
                      </p>
                    </div>
                  </div>

                  {summary.quran.currentPosition && (
                    <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-sm">
                      <p className="text-xs font-medium text-muted-foreground">Last Bookmarked Reading Position</p>
                      <p className="mt-0.5 font-semibold text-foreground">
                        {summary.quran.currentPosition.surahName ?? `Surah ${summary.quran.currentPosition.surahNumber}`}, Ayah {summary.quran.currentPosition.ayahNumber}
                      </p>
                    </div>
                  )}

                  <AnalyticsAreaChart
                    data={summary.quran.weeklyTrend}
                    label="Reading minutes per day"
                    unit="min"
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB: DHIKR */}
          {activeTab === "dhikr" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Moon className="size-4 text-purple-500" />
                    Dhikr Activity
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Private count of remembrance sessions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs text-muted-foreground">Total Sessions</p>
                      <p className="mt-1 text-2xl font-bold">{summary.dhikr.sessions}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs text-muted-foreground">Completed</p>
                      <p className="mt-1 text-2xl font-bold text-emerald">{summary.dhikr.completedSessions}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs text-muted-foreground">Total Count</p>
                      <p className="mt-1 text-2xl font-bold">{summary.dhikr.totalCounts}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs text-muted-foreground">Post-Salah</p>
                      <p className="mt-1 text-2xl font-bold">{summary.dhikr.postSalahSessions}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-border/60 p-3">
                      <p className="text-xs text-muted-foreground">Morning Adhkar Sessions</p>
                      <p className="mt-1 text-lg font-semibold">{summary.dhikr.morningSessions}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 p-3">
                      <p className="text-xs text-muted-foreground">Evening Adhkar Sessions</p>
                      <p className="mt-1 text-lg font-semibold">{summary.dhikr.eveningSessions}</p>
                    </div>
                  </div>

                  <TrendChart
                    data={summary.dhikr.weeklyTrend}
                    label="Dhikr sessions per day"
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB: STUDY & WORK */}
          {activeTab === "study" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Layers className="size-4 text-blue-500" />
                    Task &amp; Work Productivity
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Tasks created, completed, and progress against deadlines.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs text-muted-foreground">Tasks Created</p>
                      <p className="mt-1 text-2xl font-bold">{summary.tasks.created}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs text-muted-foreground">Completed</p>
                      <p className="mt-1 text-2xl font-bold text-emerald">{summary.tasks.completed}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs text-muted-foreground">Completion Rate</p>
                      <p className="mt-1 text-2xl font-bold">{summary.tasks.completionRate}%</p>
                    </div>
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs text-muted-foreground">Overdue</p>
                      <p className={cn("mt-1 text-2xl font-bold", summary.tasks.overdue > 0 ? "text-amber-500" : "text-muted-foreground")}>
                        {summary.tasks.overdue}
                      </p>
                    </div>
                  </div>

                  <TrendChart
                    data={summary.tasks.weeklyTrend}
                    label="Completed tasks per day"
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB: FOCUS */}
          {activeTab === "focus" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="size-4 text-blue-500" />
                    Deep Focus Analytics
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Intentional, uninterrupted focus sessions by subject.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs text-muted-foreground">Total Focus</p>
                      <p className="mt-1 text-2xl font-bold">{formatMinutes(summary.focus.totalMinutes)}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs text-muted-foreground">Completed Sessions</p>
                      <p className="mt-1 text-2xl font-bold">{summary.focus.completedSessions}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs text-muted-foreground">Avg Session</p>
                      <p className="mt-1 text-2xl font-bold">{summary.focus.averageSessionMinutes}m</p>
                    </div>
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs text-muted-foreground">Longest Session</p>
                      <p className="mt-1 text-2xl font-bold">{summary.focus.longestSessionMinutes}m</p>
                    </div>
                  </div>

                  {/* Subject Donut */}
                  <SubjectDistributionChart data={summary.focus.bySubject} />

                  {/* Focus minutes per day */}
                  <AnalyticsAreaChart
                    data={summary.focus.byDay}
                    label="Focus minutes per day"
                    unit="min"
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB: GOALS */}
          {activeTab === "goals" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="size-4 text-amber-500" />
                    Goals Overview
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Separated into Spiritual and Productivity goals without conflating them into a single score.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Spiritual Goals */}
                    <div className="space-y-3 rounded-xl border border-border/70 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">Spiritual Goals</span>
                        <Badge variant="outline" className="text-emerald">
                          {summary.goals.spiritualActive} active, {summary.goals.spiritualCompleted} done
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {summary.goals.items
                          .filter((g) => g.kind === "spiritual")
                          .map((g) => (
                            <div key={g.id} className="space-y-1 text-xs">
                              <div className="flex justify-between font-medium">
                                <span className={cn(g.isCompleted && "line-through text-muted-foreground")}>
                                  {g.title}
                                </span>
                                <span>{g.progressPercent}%</span>
                              </div>
                              <Progress value={g.progressPercent} className="h-1.5" />
                            </div>
                          ))}
                        {summary.goals.items.filter((g) => g.kind === "spiritual").length === 0 && (
                          <p className="text-xs text-muted-foreground">No spiritual goals active.</p>
                        )}
                      </div>
                    </div>

                    {/* Productivity Goals */}
                    <div className="space-y-3 rounded-xl border border-border/70 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">Productivity Goals</span>
                        <Badge variant="outline" className="text-blue-500">
                          {summary.goals.productivityActive} active, {summary.goals.productivityCompleted} done
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {summary.goals.items
                          .filter((g) => g.kind === "productivity")
                          .map((g) => (
                            <div key={g.id} className="space-y-1 text-xs">
                              <div className="flex justify-between font-medium">
                                <span className={cn(g.isCompleted && "line-through text-muted-foreground")}>
                                  {g.title}
                                </span>
                                <span>{g.progressPercent}%</span>
                              </div>
                              <Progress value={g.progressPercent} className="h-1.5" />
                            </div>
                          ))}
                        {summary.goals.items.filter((g) => g.kind === "productivity").length === 0 && (
                          <p className="text-xs text-muted-foreground">No productivity goals active.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB: REFLECTIONS */}
          {activeTab === "reflections" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Heart className="size-4 text-rose-500" />
                    Personal Reflection Activity
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Confidential reflection records. We do not generate mental health diagnoses or moral assessments.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs text-muted-foreground">Reflection Days</p>
                      <p className="mt-1 text-2xl font-bold">{summary.reflections.reflectionDays}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs text-muted-foreground">Possible Days</p>
                      <p className="mt-1 text-2xl font-bold">{summary.reflections.possibleDays}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs text-muted-foreground">Themes Logged</p>
                      <p className="mt-1 text-2xl font-bold">{summary.reflections.recentThemes.length}</p>
                    </div>
                  </div>

                  {summary.reflections.recentThemes.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground">Recent Priorities Logged</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {summary.reflections.recentThemes.map((theme, i) => (
                          <Badge key={i} variant="secondary" className="text-xs font-normal">
                            {theme}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
                    <Shield className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>
                      Journal entries and reflection texts remain strictly confidential on your device and are never sent to external intelligence services.
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB: HEATMAP */}
          {activeTab === "heatmap" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="size-4 text-muted-foreground" />
                    12-Month Personal Activity Heatmap
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Filter by distinct dimensions of your life. Separate metrics preserve balance without creating a combined religious score.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ActivityHeatmap data={summary.heatmap} />
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB: REVIEWS */}
          {activeTab === "reviews" && (
            <div className="space-y-6">
              {/* Weekly Review */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Weekly Review</CardTitle>
                  <CardDescription className="text-xs">
                    {summary.weeklyReview.periodLabel}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground">What you completed</h4>
                    <ul className="list-inside list-disc space-y-1 text-sm text-foreground/90">
                      <li>{summary.weeklyReview.focusSessions} focus sessions</li>
                      <li>{summary.weeklyReview.quranReadingDays} Qur&apos;an reading days ({formatMinutes(summary.weeklyReview.quranMinutes)})</li>
                      <li>{summary.weeklyReview.tasksCompleted} tasks completed</li>
                      <li>{summary.weeklyReview.habitCompletionRate}% habit completion</li>
                    </ul>
                  </div>

                  {summary.weeklyReview.topFocusSubject && (
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-sm">
                      <span className="text-xs text-muted-foreground">Top Focus Subject</span>
                      <p className="mt-0.5 font-medium">
                        {summary.weeklyReview.topFocusSubject.name} — {formatMinutes(summary.weeklyReview.topFocusSubject.minutes)}
                      </p>
                    </div>
                  )}

                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
                    <p className="text-xs font-semibold text-primary">Suggested Personal Reflection</p>
                    <p className="mt-1 font-medium italic text-foreground">
                      &ldquo;{summary.weeklyReview.reflectionPrompt}&rdquo;
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Review */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Monthly Review</CardTitle>
                  <CardDescription className="text-xs">
                    {summary.monthlyReview.periodLabel}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {summary.monthlyReview.narrative}
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs text-muted-foreground">Focus</p>
                      <p className="mt-1 font-bold">{formatMinutes(summary.monthlyReview.focusMinutes)}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs text-muted-foreground">Tasks Done</p>
                      <p className="mt-1 font-bold">{summary.monthlyReview.tasksCompleted}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs text-muted-foreground">Qur&apos;an</p>
                      <p className="mt-1 font-bold">{formatMinutes(summary.monthlyReview.quranMinutes)}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs text-muted-foreground">Goals Reached</p>
                      <p className="mt-1 font-bold">{summary.monthlyReview.goalsCompleted}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
