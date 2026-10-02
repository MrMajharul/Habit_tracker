import { describe, expect, it } from "vitest";

import {
  generatePersonalInsights,
  INSIGHT_FORBIDDEN_PHRASES,
} from "@/services/analytics/analytics-insights-service";
import type { AnalyticsSummary } from "@/services/analytics/analytics-types";

function createEmptySummary(): AnalyticsSummary {
  return {
    range: {
      startDate: "2026-10-01",
      endDate: "2026-10-07",
      preset: "this_week",
      timezone: "UTC",
      today: "2026-10-07",
      dayCount: 7,
    },
    generatedAt: "2026-10-07T12:00:00Z",
    isStale: false,
    lastUpdatedAt: "2026-10-07T12:00:00Z",
    overview: {
      salahCompleted: 0,
      salahPossible: 35,
      habitsCompleted: 0,
      habitsPossible: 0,
      quranMinutes: 0,
      dhikrSessions: 0,
      tasksCompleted: 0,
      focusMinutes: 0,
      activeGoals: 0,
      habitCompletionRate: 0,
    },
    prayer: {
      completed: 0,
      possible: 35,
      completionRate: 0,
      dailyCompletion: [],
      weeklyTrend: [],
      perPrayer: [],
    },
    habits: {
      completionRate: 0,
      currentStreak: 0,
      longestStreak: 0,
      weeklyCompletionRate: 0,
      monthlyCompletionRate: 0,
      completedLogs: 0,
      habits: [],
      weeklyTrend: [],
    },
    quran: {
      minutesRead: 0,
      ayahsRead: 0,
      sessionsCount: 0,
      readingDays: 0,
      possibleDays: 7,
      currentStreak: 0,
      longestStreak: 0,
      weeklyTrend: [],
    },
    dhikr: {
      sessions: 0,
      completedSessions: 0,
      interruptedSessions: 0,
      cancelledSessions: 0,
      totalCounts: 0,
      morningSessions: 0,
      eveningSessions: 0,
      postSalahSessions: 0,
      weeklyTrend: [],
    },
    tasks: {
      created: 0,
      completed: 0,
      completionRate: 0,
      overdue: 0,
      cancelled: 0,
      weeklyTrend: [],
    },
    focus: {
      totalMinutes: 0,
      completedSessions: 0,
      interruptedSessions: 0,
      cancelledSessions: 0,
      averageSessionMinutes: 0,
      longestSessionMinutes: 0,
      bySubject: [],
      byDay: [],
      weeklyTrend: [],
    },
    goals: {
      spiritualActive: 0,
      spiritualCompleted: 0,
      productivityActive: 0,
      productivityCompleted: 0,
      overdue: 0,
      items: [],
    },
    reflections: {
      reflectionDays: 0,
      possibleDays: 7,
      moodDistribution: [],
      recentThemes: [],
    },
    trends: {
      dailyActivity: [],
      focus: [],
      quran: [],
      habits: [],
      tasks: [],
      prayer: [],
      dhikr: [],
    },
    heatmap: {
      all: [],
      quran: [],
      habits: [],
      focus: [],
      reflections: [],
    },
    weeklyReview: {
      periodLabel: "Week of Oct 1",
      focusSessions: 0,
      quranReadingDays: 0,
      tasksCompleted: 0,
      habitCompletionRate: 0,
      quranMinutes: 0,
      reflectionPrompt: "Reflect on your time.",
    },
    monthlyReview: {
      periodLabel: "October 2026",
      narrative: "",
      focusMinutes: 0,
      tasksCompleted: 0,
      habitCompletionRate: 0,
      quranMinutes: 0,
      dhikrSessions: 0,
      goalsCompleted: 0,
    },
    insights: [],
  };
}

describe("Deterministic Analytics Insights", () => {
  it("provides clean empty state when no activity is recorded", () => {
    const summary = createEmptySummary();
    const insights = generatePersonalInsights(summary);

    expect(insights.length).toBeGreaterThan(0);
    expect(insights.some((i) => i.id === "empty")).toBe(true);
  });

  it("generates deterministic focus, quran, habit, and task insights from data", () => {
    const summary = createEmptySummary();
    summary.focus.completedSessions = 6;
    summary.focus.totalMinutes = 150;
    summary.focus.byDay = [
      { date: "2026-10-02", label: "Fri", value: 60 },
      { date: "2026-10-03", label: "Sat", value: 90 },
    ];
    summary.focus.bySubject = [
      {
        subjectId: "s1",
        name: "Arabic Studies",
        minutes: 120,
        color: "#10b981",
        weeklyTargetMinutes: 180,
      },
    ];
    summary.quran.readingDays = 5;
    summary.quran.possibleDays = 7;
    summary.quran.minutesRead = 75;
    summary.quran.ayahsRead = 40;
    summary.habits.completionRate = 85;
    summary.habits.habits = [
      {
        habitId: "h1",
        name: "Morning Adhkar",
        completedDays: 6,
        possibleDays: 7,
        completionRate: 90,
        currentStreak: 6,
        longestStreak: 6,
        weeklyCompletionRate: 90,
        monthlyCompletionRate: 90,
        isActive: true,
      },
    ];
    summary.tasks.created = 10;
    summary.tasks.completed = 8;
    summary.tasks.overdue = 1;

    const insights = generatePersonalInsights(summary);

    expect(insights.some((i) => i.id === "focus-sessions")).toBe(true);
    expect(insights.some((i) => i.id === "focus-days")).toBe(true);
    expect(insights.some((i) => i.id === "focus-subject")).toBe(true);
    expect(insights.some((i) => i.id === "quran-days")).toBe(true);
    expect(insights.some((i) => i.id === "habit-rate")).toBe(true);
    expect(insights.some((i) => i.id === "habit-top")).toBe(true);
    expect(insights.some((i) => i.id === "tasks-completed")).toBe(true);
    expect(insights.some((i) => i.id === "tasks-overdue")).toBe(true);
  });

  it("strictly enforces prohibition on religious scoring and judgmental ranking", () => {
    const summary = createEmptySummary();
    summary.prayer.completed = 25;
    summary.prayer.possible = 35;

    const insights = generatePersonalInsights(summary);

    for (const item of insights) {
      const lower = item.text.toLowerCase();
      for (const forbidden of INSIGHT_FORBIDDEN_PHRASES) {
        expect(lower).not.toContain(forbidden);
      }
    }
  });
});
