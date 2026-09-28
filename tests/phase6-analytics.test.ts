import { describe, expect, it } from "vitest";

import {
  addCalendarDays,
  clampRangeToToday,
  enumerateDates,
  formatInstantInTimeZone,
  formatMinutes,
  formatRangeLabel,
  isDateInRange,
  resolveAnalyticsPeriod,
  startOfIsoWeek,
  startOfMonth,
} from "@/services/analytics/analytics-period";
import {
  aggregateAnalytics,
  prayerNameLabel,
} from "@/services/analytics/analytics-aggregator";
import {
  generatePersonalInsights,
  INSIGHT_FORBIDDEN_PHRASES,
} from "@/services/analytics/analytics-insights-service";
import {
  buildCsvFiles,
  buildJsonExport,
  buildPdfReport,
  csvEscape,
  exportFileName,
  toCsv,
} from "@/services/analytics/analytics-export-service";
import { analyticsQueryUsesUserScopedClient } from "@/services/analytics/analytics-query-service";
import type { AnalyticsSnapshot } from "@/services/analytics/analytics-types";

function createMockSnapshot(overrides?: Partial<AnalyticsSnapshot>): AnalyticsSnapshot {
  return {
    userId: "test-user-123",
    timezone: "UTC",
    generatedAt: "2026-09-24T12:00:00.000Z",
    prayerLogs: [
      { prayer: "fajr", date: "2026-09-24", status: "completed" },
      { prayer: "dhuhr", date: "2026-09-24", status: "completed" },
      { prayer: "asr", date: "2026-09-24", status: "completed" },
      { prayer: "maghrib", date: "2026-09-24", status: "completed" },
      { prayer: "isha", date: "2026-09-24", status: "late" },
      { prayer: "fajr", date: "2026-09-23", status: "completed" },
      { prayer: "dhuhr", date: "2026-09-23", status: "missed" },
    ],
    habits: [
      { id: "h1", name: "Morning Qur'an", isActive: true, frequency: "daily", startDate: "2026-09-01" },
      { id: "h2", name: "Exercise", isActive: true, frequency: "daily", startDate: "2026-09-01" },
    ],
    habitLogs: [
      { habitId: "h1", date: "2026-09-24", completed: true },
      { habitId: "h1", date: "2026-09-23", completed: true },
      { habitId: "h2", date: "2026-09-24", completed: true },
    ],
    tasks: [
      { id: "t1", title: "Complete ML project", status: "COMPLETED", createdAt: "2026-09-20T10:00:00Z", completedAt: "2026-09-24T11:00:00Z", dueDate: "2026-09-25" },
      { id: "t2", title: "Review notes", status: "PENDING", createdAt: "2026-09-21T10:00:00Z", dueDate: "2026-09-22" },
      { id: "t3", title: "Archived task", status: "CANCELLED", createdAt: "2026-09-21T10:00:00Z" },
    ],
    subjects: [
      { id: "s1", name: "Machine Learning", color: "#10b981", weeklyTargetMinutes: 300, isArchived: false },
      { id: "s2", name: "Algorithms", color: "#3b82f6", weeklyTargetMinutes: 180, isArchived: false },
    ],
    focusSessions: [
      { id: "f1", startedAt: "2026-09-24T09:00:00Z", actualMinutes: 60, plannedMinutes: 60, status: "COMPLETED", subjectId: "s1", subjectName: "Machine Learning" },
      { id: "f2", startedAt: "2026-09-24T14:00:00Z", actualMinutes: 45, plannedMinutes: 50, status: "COMPLETED", subjectId: "s2", subjectName: "Algorithms" },
      { id: "f3", startedAt: "2026-09-23T15:00:00Z", actualMinutes: 10, plannedMinutes: 30, status: "INTERRUPTED", subjectId: "s1" },
      { id: "f4", startedAt: "2026-09-23T16:00:00Z", actualMinutes: 0, plannedMinutes: 30, status: "CANCELLED", subjectId: "s1" },
    ],
    quranSessions: [
      { surahNumber: 2, startAyah: 1, endAyah: 20, minutesRead: 25, readingDate: "2026-09-24" },
      { surahNumber: 2, startAyah: 21, endAyah: 40, minutesRead: 30, readingDate: "2026-09-23" },
    ],
    quranPosition: { surahNumber: 2, ayahNumber: 40, surahName: "Al-Baqarah" },
    quranGoal: { targetType: "minutes", targetValue: 20, isEnabled: true },
    dhikrSessions: [
      { dhikrId: "d1", completedCount: 33, targetCount: 33, startedAt: "2026-09-24T06:00:00Z", status: "COMPLETED" },
      { dhikrId: "d2", completedCount: 100, targetCount: 100, startedAt: "2026-09-24T18:00:00Z", status: "COMPLETED" },
      { dhikrId: "d3", completedCount: 0, targetCount: 33, startedAt: "2026-09-24T19:00:00Z", status: "CANCELLED" },
    ],
    dhikrCatalog: [
      { id: "d1", category: "morning" },
      { id: "d2", category: "evening" },
      { id: "d3", category: "general" },
    ],
    productivityGoals: [
      { id: "g1", title: "Ship v1 MVP", category: "weekly", targetValue: 1, currentValue: 1, isCompleted: true, deadline: "2026-09-25" },
      { id: "g2", title: "Write documentation", category: "weekly", targetValue: 5, currentValue: 2, isCompleted: false, deadline: "2026-09-20" },
    ],
    spiritualGoals: [
      { id: "sg1", title: "Complete Surah Al-Kahf", type: "surah", targetValue: 1, currentValue: 1, isCompleted: true, deadline: "2026-09-26" },
      { id: "sg2", title: "Daily Morning Adhkar", type: "adhkar", targetValue: 7, currentValue: 4, isCompleted: false, deadline: "2026-09-28" },
    ],
    reflections: [
      {
        reflectionDate: "2026-09-24",
        mood: "Grateful",
        tomorrowPriority: "Complete thesis draft",
        achievements: "Consistent prayers",
        improvements: "Sleep earlier",
      },
    ],
    ...overrides,
  };
}

describe("Phase 6 — Analytics Period & Timezones", () => {
  const fixedNow = new Date("2026-09-24T14:30:00.000Z"); // Thursday

  it("resolves 'today' preset correctly", () => {
    const period = resolveAnalyticsPeriod({
      preset: "today",
      timezone: "UTC",
      now: fixedNow,
    });
    expect(period.startDate).toBe("2026-09-24");
    expect(period.endDate).toBe("2026-09-24");
    expect(period.dayCount).toBe(1);
  });

  it("resolves 'yesterday' preset correctly", () => {
    const period = resolveAnalyticsPeriod({
      preset: "yesterday",
      timezone: "UTC",
      now: fixedNow,
    });
    expect(period.startDate).toBe("2026-09-23");
    expect(period.endDate).toBe("2026-09-23");
    expect(period.dayCount).toBe(1);
  });

  it("resolves 'this_week' preset with ISO Monday start", () => {
    const period = resolveAnalyticsPeriod({
      preset: "this_week",
      timezone: "UTC",
      now: fixedNow,
    });
    expect(period.startDate).toBe("2026-09-21"); // Monday
    expect(period.endDate).toBe("2026-09-24"); // Thursday (clamped to today)
    expect(period.dayCount).toBe(4);
  });

  it("resolves 'this_month' preset", () => {
    const period = resolveAnalyticsPeriod({
      preset: "this_month",
      timezone: "UTC",
      now: fixedNow,
    });
    expect(period.startDate).toBe("2026-09-01");
    expect(period.endDate).toBe("2026-09-24");
    expect(period.dayCount).toBe(24);
  });

  it("handles different timezones properly across midnight", () => {
    // 2026-09-24 22:30:00 UTC is 2026-09-25 04:30:00 in Asia/Dhaka (+6)
    const lateUtc = new Date("2026-09-24T22:30:00.000Z");
    const dhakaToday = formatInstantInTimeZone(lateUtc, "Asia/Dhaka");
    const utcToday = formatInstantInTimeZone(lateUtc, "UTC");

    expect(dhakaToday).toBe("2026-09-25");
    expect(utcToday).toBe("2026-09-24");
  });

  it("never includes future dates in range calculations", () => {
    const clamped = clampRangeToToday("2026-09-20", "2026-09-30", "2026-09-24");
    expect(clamped.startDate).toBe("2026-09-20");
    expect(clamped.endDate).toBe("2026-09-24");
  });

  it("enumerates dates inclusively", () => {
    const dates = enumerateDates("2026-09-21", "2026-09-24");
    expect(dates).toEqual(["2026-09-21", "2026-09-22", "2026-09-23", "2026-09-24"]);
  });
});

describe("Phase 6 — Analytics Aggregation", () => {
  const fixedNow = new Date("2026-09-24T14:30:00.000Z");
  const snapshot = createMockSnapshot();
  const range = resolveAnalyticsPeriod({
    preset: "this_week",
    timezone: "UTC",
    now: fixedNow,
  });
  const summary = aggregateAnalytics(snapshot, range);

  it("aggregates Salah completion without religious score labeling", () => {
    expect(summary.prayer.completed).toBe(6); // 5 on 09-24 (late counts as completed) + 1 on 09-23
    expect(summary.prayer.possible).toBe(range.dayCount * 5); // 4 days * 5 = 20
    expect(summary.prayer.completionRate).toBe(Math.round((6 / 20) * 100));

    // Per prayer breakdown
    const fajr = summary.prayer.perPrayer.find((p) => p.prayer === "fajr");
    expect(fajr?.completed).toBe(2);
    expect(fajr?.possible).toBe(4);
    expect(prayerNameLabel("fajr")).toBe("Fajr");
  });

  it("aggregates Habit consistency and streaks", () => {
    expect(summary.habits.completedLogs).toBe(3);
    expect(summary.habits.habits.length).toBe(2);
    const quranHabit = summary.habits.habits.find((h) => h.name === "Morning Qur'an");
    expect(quranHabit?.completedDays).toBe(2);
  });

  it("aggregates Qur'an reading minutes, ayahs, and streaks", () => {
    expect(summary.quran.minutesRead).toBe(55); // 25 + 30
    expect(summary.quran.ayahsRead).toBe(40); // 20 + 20
    expect(summary.quran.readingDays).toBe(2);
    expect(summary.quran.currentPosition?.surahNumber).toBe(2);
    expect(summary.quran.currentPosition?.ayahNumber).toBe(40);
  });

  it("aggregates Dhikr sessions and counts correctly, excluding cancelled sessions", () => {
    expect(summary.dhikr.sessions).toBe(2); // 2 non-cancelled
    expect(summary.dhikr.completedSessions).toBe(2);
    expect(summary.dhikr.cancelledSessions).toBe(1);
    expect(summary.dhikr.totalCounts).toBe(133); // 33 + 100
    expect(summary.dhikr.morningSessions).toBe(1);
    expect(summary.dhikr.eveningSessions).toBe(1);
  });

  it("aggregates Tasks with completed and overdue tracking", () => {
    expect(summary.tasks.created).toBe(2); // t2 and t3 created on 09-21 (within 09-21..09-24)
    expect(summary.tasks.completed).toBe(1);
    expect(summary.tasks.overdue).toBe(1); // t2 due on 09-22 < 09-24 and pending
    expect(summary.tasks.cancelled).toBe(1);
  });

  it("aggregates Focus minutes and subject distribution accurately", () => {
    expect(summary.focus.totalMinutes).toBe(105); // 60 + 45
    expect(summary.focus.completedSessions).toBe(2);
    expect(summary.focus.interruptedSessions).toBe(1);
    expect(summary.focus.cancelledSessions).toBe(1);
    expect(summary.focus.bySubject.length).toBe(2);
    expect(summary.focus.bySubject[0].name).toBe("Machine Learning");
    expect(summary.focus.bySubject[0].minutes).toBe(60);
    expect(formatMinutes(105)).toBe("1h 45m");
  });

  it("keeps Spiritual Goals and Productivity Goals completely separate", () => {
    expect(summary.goals.spiritualActive).toBe(1);
    expect(summary.goals.spiritualCompleted).toBe(1);
    expect(summary.goals.productivityActive).toBe(1);
    expect(summary.goals.productivityCompleted).toBe(1);
    expect(summary.goals.overdue).toBe(1); // g2 due 09-20 < 09-24
  });

  it("aggregates personal reflections while keeping texts confidential", () => {
    expect(summary.reflections.reflectionDays).toBe(1);
    expect(summary.reflections.recentThemes).toContain("Complete thesis draft");
  });

  it("generates 12-month activity heatmap data for all filters", () => {
    expect(summary.heatmap.all.length).toBe(365);
    expect(summary.heatmap.quran.length).toBe(365);
    expect(summary.heatmap.habits.length).toBe(365);
    expect(summary.heatmap.focus.length).toBe(365);
    expect(summary.heatmap.reflections.length).toBe(365);
  });

  it("builds Weekly Review and Monthly Review summaries strictly from data", () => {
    expect(summary.weeklyReview.tasksCompleted).toBe(1);
    expect(summary.weeklyReview.focusSessions).toBe(2);
    expect(summary.monthlyReview.narrative).toContain("Qur'an reading totaled");
  });
});

describe("Phase 6 — Deterministic Rule-Based Personal Insights", () => {
  const fixedNow = new Date("2026-09-24T14:30:00.000Z");
  const snapshot = createMockSnapshot();
  const range = resolveAnalyticsPeriod({ preset: "this_week", timezone: "UTC", now: fixedNow });
  const summary = aggregateAnalytics(snapshot, range);
  const insights = generatePersonalInsights(summary);

  it("produces factual and descriptive insights", () => {
    expect(insights.length).toBeGreaterThan(0);
    const texts = insights.map((i) => i.text).join(" ");
    expect(texts).toContain("focus session");
    expect(texts).toContain("Qur'an");
  });

  it("never includes judgmental, spiritual-worth, or forbidden phrasing", () => {
    const allInsightText = insights.map((i) => i.text.toLowerCase()).join(" ");
    for (const phrase of INSIGHT_FORBIDDEN_PHRASES) {
      expect(allInsightText).not.toContain(phrase);
    }
    expect(allInsightText).not.toContain("bad muslim");
    expect(allInsightText).not.toContain("lazy");
    expect(allInsightText).not.toContain("failed");
    expect(allInsightText).not.toContain("worship score");
  });
});

describe("Phase 6 — Advanced Export System", () => {
  const fixedNow = new Date("2026-09-24T14:30:00.000Z");
  const snapshot = createMockSnapshot();
  const range = resolveAnalyticsPeriod({ preset: "this_week", timezone: "UTC", now: fixedNow });
  const summary = aggregateAnalytics(snapshot, range);

  it("exports valid structured JSON with Istiqamah branding and metadata", () => {
    const { filename, body, document } = buildJsonExport(snapshot, summary, {
      categories: ["prayer", "habits", "focus", "quran"],
      range,
    });

    expect(filename).toBe(exportFileName("analytics", "2026-09-24", "json"));
    expect(document.metadata.product).toBe("Istiqamah");
    expect(document.metadata.tagline).toBe("Balance your Deen. Organize your life.");
    expect(document.metadata.privacyNotice).toContain("private activity data");

    const parsed = JSON.parse(body);
    expect(parsed.records.prayerLogs.length).toBeGreaterThan(0);
    expect(parsed.records.focusSessions.length).toBeGreaterThan(0);
  });

  it("escapes CSV values with commas, quotes, and newlines properly", () => {
    expect(csvEscape("Simple")).toBe("Simple");
    expect(csvEscape('Value with "quotes"')).toBe('"Value with ""quotes"""');
    expect(csvEscape("Value, with comma")).toBe('"Value, with comma"');
    expect(csvEscape("Line 1\nLine 2")).toBe('"Line 1\nLine 2"');
  });

  it("includes UTF-8 BOM in CSV exports for proper Bengali and Unicode rendering", () => {
    const csv = toCsv(["name", "note"], [["রহমান", "রমাদান প্রস্তুতি"]]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("রহমান");
  });

  it("builds separate CSV datasets for selected categories", () => {
    const files = buildCsvFiles(snapshot, {
      categories: ["prayer", "habits", "quran"],
      range,
    });

    expect(files.some((f) => f.category === "prayer")).toBe(true);
    expect(files.some((f) => f.category === "habits")).toBe(true);
    expect(files.some((f) => f.category === "quran")).toBe(true);
    expect(files.some((f) => f.category === "focus")).toBe(false);
  });

  it("builds clean PDF report binary with correct PDF specification structure", () => {
    const { filename, body } = buildPdfReport(summary);
    expect(filename).toBe("istiqamah-weekly-report-2026-09-24.pdf");
    expect(body).toBeInstanceOf(Uint8Array);

    const pdfString = new TextDecoder().decode(body);
    expect(pdfString.startsWith("%PDF-1.4")).toBe(true);
    expect(pdfString).toContain("ISTIQAMAH");
    expect(pdfString).toContain("%%EOF");
  });
});

describe("Phase 6 — Supabase Security & RLS Compliance", () => {
  it("enforces user-scoped client queries without service role bypass", () => {
    expect(analyticsQueryUsesUserScopedClient()).toBe(true);
  });
});
