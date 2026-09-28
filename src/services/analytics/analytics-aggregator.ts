import { calculateHabitStreak } from "@/services/habits/streak-calculator";
import { countAyahsInSession } from "@/services/quran/quran-progress-service";

import {
  calendarDateFromInstant,
  enumerateDates,
  formatMinutes,
  formatRangeLabel,
  heatmapRange,
  isDateInRange,
  startOfIsoWeek,
  weekdayLabel,
} from "./analytics-period";
import type {
  AnalyticsDateRange,
  AnalyticsSnapshot,
  AnalyticsSummary,
  DhikrAnalytics,
  FocusAnalytics,
  GoalAnalytics,
  GoalItemAnalytics,
  HabitAnalytics,
  HeatmapCell,
  HeatmapFilter,
  MonthlyReview,
  PrayerAnalytics,
  PrayerName,
  QuranAnalytics,
  ReflectionAnalytics,
  TaskAnalytics,
  TrendPoint,
  WeeklyReview,
} from "./analytics-types";
import { PRAYER_NAMES } from "./analytics-types";
import { generatePersonalInsights } from "./analytics-insights-service";

function rate(completed: number, possible: number): number {
  if (possible <= 0) return 0;
  return Math.round((completed / possible) * 100);
}

function parseLocalNoon(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function filterFuture(date: string, today: string): boolean {
  return date <= today;
}

function dailyTrend(
  dates: string[],
  valueForDate: (date: string) => number,
): TrendPoint[] {
  return dates.map((date) => ({
    date,
    label: weekdayLabel(date),
    value: valueForDate(date),
  }));
}

function isCompletedPrayer(status: string): boolean {
  return status === "completed" || status === "late";
}

function isCompletedTask(status: string): boolean {
  const normalized = status.toUpperCase();
  return normalized === "COMPLETED";
}

function isCancelledTask(status: string): boolean {
  return status.toUpperCase() === "CANCELLED";
}

function isCompletedFocus(status: string): boolean {
  return status.toUpperCase() === "COMPLETED";
}

function aggregatePrayer(
  snapshot: AnalyticsSnapshot,
  range: AnalyticsDateRange,
  dates: string[],
): PrayerAnalytics {
  const logs = snapshot.prayerLogs.filter(
    (log) => isDateInRange(log.date, range.startDate, range.endDate) && filterFuture(log.date, range.today),
  );
  const possible = dates.length * PRAYER_NAMES.length;
  const completed = logs.filter((log) => isCompletedPrayer(log.status)).length;

  const perPrayer = PRAYER_NAMES.map((prayer) => ({
    prayer,
    completed: logs.filter((log) => log.prayer === prayer && isCompletedPrayer(log.status)).length,
    possible: dates.length,
  }));

  const dailyCompletion = dailyTrend(dates, (date) =>
    logs.filter((log) => log.date === date && isCompletedPrayer(log.status)).length,
  );

  return {
    completed,
    possible,
    completionRate: rate(completed, possible),
    dailyCompletion,
    weeklyTrend: dailyCompletion,
    perPrayer,
  };
}

function aggregateHabits(
  snapshot: AnalyticsSnapshot,
  range: AnalyticsDateRange,
  dates: string[],
): HabitAnalytics {
  const logs = snapshot.habitLogs.filter(
    (log) =>
      log.completed &&
      isDateInRange(log.date, range.startDate, range.endDate) &&
      filterFuture(log.date, range.today),
  );

  const habits = snapshot.habits.map((habit) => {
    const allCompleted = snapshot.habitLogs
      .filter((log) => log.habitId === habit.id && log.completed && filterFuture(log.date, range.today))
      .map((log) => log.date);
    const streak = calculateHabitStreak(allCompleted, parseLocalNoon(range.today));
    const start = habit.startDate && habit.startDate > range.startDate ? habit.startDate : range.startDate;
    const possibleDays = enumerateDates(start, range.endDate).filter((d) => d >= (habit.startDate ?? start)).length;
    const completedDays = logs.filter((log) => log.habitId === habit.id).length;

    return {
      habitId: habit.id,
      name: habit.name,
      completedDays,
      possibleDays,
      completionRate: rate(completedDays, possibleDays),
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      weeklyCompletionRate: streak.weeklyCompletionRate,
      monthlyCompletionRate: streak.monthlyCompletionRate,
      isActive: habit.isActive,
    };
  });

  const activeHabits = habits.filter((h) => h.isActive);
  const expected = activeHabits.reduce((sum, h) => sum + h.possibleDays, 0);
  const completed = activeHabits.reduce((sum, h) => sum + h.completedDays, 0);
  const weeklyTrend = dailyTrend(dates, (date) => {
    const expectedThatDay = snapshot.habits.filter((h) => h.isActive && (!h.startDate || h.startDate <= date)).length;
    if (expectedThatDay === 0) return 0;
    const done = logs.filter((log) => log.date === date && snapshot.habits.some((h) => h.id === log.habitId && h.isActive)).length;
    return rate(done, expectedThatDay);
  });

  const bestCurrent = activeHabits.reduce((max, h) => Math.max(max, h.currentStreak), 0);
  const bestLongest = habits.reduce((max, h) => Math.max(max, h.longestStreak), 0);

  return {
    completionRate: rate(completed, expected),
    currentStreak: bestCurrent,
    longestStreak: bestLongest,
    weeklyCompletionRate: activeHabits.length
      ? Math.round(activeHabits.reduce((sum, h) => sum + h.weeklyCompletionRate, 0) / activeHabits.length)
      : 0,
    monthlyCompletionRate: activeHabits.length
      ? Math.round(activeHabits.reduce((sum, h) => sum + h.monthlyCompletionRate, 0) / activeHabits.length)
      : 0,
    completedLogs: logs.length,
    habits,
    weeklyTrend,
  };
}

function aggregateQuran(
  snapshot: AnalyticsSnapshot,
  range: AnalyticsDateRange,
  dates: string[],
): QuranAnalytics {
  const sessions = snapshot.quranSessions.filter(
    (session) =>
      isDateInRange(session.readingDate, range.startDate, range.endDate) &&
      filterFuture(session.readingDate, range.today),
  );
  const minutesRead = sessions.reduce((sum, s) => sum + s.minutesRead, 0);
  const ayahsRead = sessions.reduce((sum, s) => sum + countAyahsInSession(s), 0);
  const readingDays = new Set(sessions.map((s) => s.readingDate)).size;

  const allDates = snapshot.quranSessions
    .filter((s) => filterFuture(s.readingDate, range.today))
    .map((s) => s.readingDate);
  const streak = calculateHabitStreak(allDates, parseLocalNoon(range.today));

  let goalProgressPercent: number | undefined;
  if (snapshot.quranGoal?.isEnabled) {
    const target = snapshot.quranGoal.targetValue * dates.length;
    const current =
      snapshot.quranGoal.targetType === "minutes" ? minutesRead : ayahsRead;
    goalProgressPercent = rate(current, target);
  }

  return {
    minutesRead,
    ayahsRead,
    sessionsCount: sessions.length,
    readingDays,
    possibleDays: dates.length,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    currentPosition: snapshot.quranPosition,
    weeklyTrend: dailyTrend(dates, (date) =>
      sessions.filter((s) => s.readingDate === date).reduce((sum, s) => sum + s.minutesRead, 0),
    ),
    goalProgressPercent,
  };
}

function aggregateDhikr(
  snapshot: AnalyticsSnapshot,
  range: AnalyticsDateRange,
  dates: string[],
): DhikrAnalytics {
  const catalog = new Map(snapshot.dhikrCatalog.map((item) => [item.id, item.category]));
  const sessions = snapshot.dhikrSessions.filter((session) => {
    const date = calendarDateFromInstant(session.startedAt, range.timezone);
    return isDateInRange(date, range.startDate, range.endDate) && filterFuture(date, range.today);
  });

  const dated = sessions.map((session) => ({
    ...session,
    date: calendarDateFromInstant(session.startedAt, range.timezone),
    category: catalog.get(session.dhikrId) ?? "general",
  }));

  const completed = dated.filter((s) => s.status === "COMPLETED");
  const categoryCount = (category: string) =>
    dated.filter((s) => s.status !== "CANCELLED" && s.category === category).length;

  return {
    sessions: dated.filter((s) => s.status !== "CANCELLED").length,
    completedSessions: completed.length,
    interruptedSessions: dated.filter((s) => s.status === "INTERRUPTED").length,
    cancelledSessions: dated.filter((s) => s.status === "CANCELLED").length,
    totalCounts: completed.reduce((sum, s) => sum + s.completedCount, 0),
    morningSessions: categoryCount("morning"),
    eveningSessions: categoryCount("evening"),
    postSalahSessions: categoryCount("after_salah") + categoryCount("after_prayer"),
    weeklyTrend: dailyTrend(dates, (date) =>
      dated.filter((s) => s.date === date && s.status !== "CANCELLED").length,
    ),
  };
}

function aggregateTasks(
  snapshot: AnalyticsSnapshot,
  range: AnalyticsDateRange,
  dates: string[],
): TaskAnalytics {
  const created = snapshot.tasks.filter((task) => {
    const date = calendarDateFromInstant(task.createdAt, range.timezone);
    return isDateInRange(date, range.startDate, range.endDate) && filterFuture(date, range.today);
  });
  const completed = snapshot.tasks.filter((task) => {
    if (!isCompletedTask(task.status) || !task.completedAt) return false;
    const date = calendarDateFromInstant(task.completedAt, range.timezone);
    return isDateInRange(date, range.startDate, range.endDate) && filterFuture(date, range.today);
  });
  const cancelled = snapshot.tasks.filter((task) => isCancelledTask(task.status)).length;
  const considered = snapshot.tasks.filter((task) => !isCancelledTask(task.status));
  const overdue = considered.filter((task) => {
    if (isCompletedTask(task.status) || !task.dueDate) return false;
    const due = task.dueDate.slice(0, 10);
    return due < range.today;
  }).length;

  return {
    created: created.length,
    completed: completed.length,
    completionRate: rate(
      considered.filter((t) => isCompletedTask(t.status)).length,
      considered.length,
    ),
    overdue,
    cancelled,
    weeklyTrend: dailyTrend(dates, (date) =>
      completed.filter((task) => calendarDateFromInstant(task.completedAt ?? "", range.timezone) === date).length,
    ),
  };
}

function aggregateFocus(
  snapshot: AnalyticsSnapshot,
  range: AnalyticsDateRange,
  dates: string[],
): FocusAnalytics {
  const sessions = snapshot.focusSessions.filter((session) => {
    const date = calendarDateFromInstant(session.startedAt, range.timezone);
    return isDateInRange(date, range.startDate, range.endDate) && filterFuture(date, range.today);
  });
  const completed = sessions.filter((s) => isCompletedFocus(s.status));
  const interrupted = sessions.filter((s) => s.status.toUpperCase() === "INTERRUPTED");
  const cancelled = sessions.filter((s) => s.status.toUpperCase() === "CANCELLED");
  const totalMinutes = completed.reduce((sum, s) => sum + s.actualMinutes, 0);

  const bySubjectMap = new Map<string, { name: string; minutes: number; color: string; weeklyTargetMinutes: number; subjectId: string }>();
  for (const session of completed) {
    const subject = snapshot.subjects.find((s) => s.id === session.subjectId);
    const key = session.subjectId ?? "none";
    const existing = bySubjectMap.get(key) ?? {
      subjectId: key,
      name: subject?.name ?? session.subjectName ?? "Unassigned",
      minutes: 0,
      color: subject?.color ?? "#64748b",
      weeklyTargetMinutes: subject?.weeklyTargetMinutes ?? 0,
    };
    existing.minutes += session.actualMinutes;
    bySubjectMap.set(key, existing);
  }

  return {
    totalMinutes,
    completedSessions: completed.length,
    interruptedSessions: interrupted.length,
    cancelledSessions: cancelled.length,
    averageSessionMinutes: completed.length ? Math.round(totalMinutes / completed.length) : 0,
    longestSessionMinutes: completed.reduce((max, s) => Math.max(max, s.actualMinutes), 0),
    bySubject: [...bySubjectMap.values()].sort((a, b) => b.minutes - a.minutes),
    byDay: dailyTrend(dates, (date) =>
      completed
        .filter((s) => calendarDateFromInstant(s.startedAt, range.timezone) === date)
        .reduce((sum, s) => sum + s.actualMinutes, 0),
    ),
    weeklyTrend: dailyTrend(dates, (date) =>
      completed
        .filter((s) => calendarDateFromInstant(s.startedAt, range.timezone) === date)
        .reduce((sum, s) => sum + s.actualMinutes, 0),
    ),
  };
}

function toGoalItem(
  goal: AnalyticsSnapshot["productivityGoals"][number],
  kind: "spiritual" | "productivity",
  today: string,
): GoalItemAnalytics {
  const deadline = goal.deadline?.slice(0, 10);
  return {
    id: goal.id,
    title: goal.title,
    kind,
    progressPercent: rate(goal.currentValue, goal.targetValue),
    isCompleted: goal.isCompleted,
    isOverdue: Boolean(deadline && deadline < today && !goal.isCompleted),
  };
}

function aggregateGoals(snapshot: AnalyticsSnapshot, range: AnalyticsDateRange): GoalAnalytics {
  const spiritual = snapshot.spiritualGoals.map((g) => toGoalItem(g, "spiritual", range.today));
  const productivity = snapshot.productivityGoals.map((g) => toGoalItem(g, "productivity", range.today));
  const items = [...spiritual, ...productivity];
  return {
    spiritualActive: spiritual.filter((g) => !g.isCompleted).length,
    spiritualCompleted: spiritual.filter((g) => g.isCompleted).length,
    productivityActive: productivity.filter((g) => !g.isCompleted).length,
    productivityCompleted: productivity.filter((g) => g.isCompleted).length,
    overdue: items.filter((g) => g.isOverdue).length,
    items,
  };
}

function aggregateReflections(
  snapshot: AnalyticsSnapshot,
  range: AnalyticsDateRange,
  dates: string[],
): ReflectionAnalytics {
  const reflections = snapshot.reflections.filter(
    (item) =>
      isDateInRange(item.reflectionDate, range.startDate, range.endDate) &&
      filterFuture(item.reflectionDate, range.today),
  );
  const moodCounts = new Map<string, number>();
  for (const item of reflections) {
    const mood = item.mood?.trim();
    if (!mood) continue;
    moodCounts.set(mood, (moodCounts.get(mood) ?? 0) + 1);
  }
  const themes = reflections
    .map((item) => item.tomorrowPriority?.trim())
    .filter((theme): theme is string => Boolean(theme))
    .slice(0, 5);

  return {
    reflectionDays: new Set(reflections.map((item) => item.reflectionDate)).size,
    possibleDays: dates.length,
    moodDistribution: [...moodCounts.entries()].map(([mood, count]) => ({ mood, count })),
    recentThemes: themes,
  };
}

function heatmapCells(
  snapshot: AnalyticsSnapshot,
  today: string,
  timezone: string,
  filter: HeatmapFilter,
): HeatmapCell[] {
  const { startDate, endDate } = heatmapRange(today);
  const dates = enumerateDates(startDate, endDate);
  return dates.map((date) => {
    let value = 0;
    if (filter === "all" || filter === "quran") {
      value += snapshot.quranSessions.filter((s) => s.readingDate === date).length;
    }
    if (filter === "all" || filter === "habits") {
      value += snapshot.habitLogs.filter((l) => l.date === date && l.completed).length;
    }
    if (filter === "all" || filter === "focus") {
      value += snapshot.focusSessions.filter(
        (s) =>
          calendarDateFromInstant(s.startedAt, timezone) === date &&
          isCompletedFocus(s.status),
      ).length;
    }
    if (filter === "all" || filter === "reflections") {
      value += snapshot.reflections.filter((r) => r.reflectionDate === date).length;
    }
    if (filter === "all") {
      value += snapshot.prayerLogs.filter((l) => l.date === date && isCompletedPrayer(l.status)).length;
      value += snapshot.dhikrSessions.filter(
        (s) =>
          calendarDateFromInstant(s.startedAt, timezone) === date &&
          s.status !== "CANCELLED",
      ).length;
    }
    return { date, value };
  });
}

function buildWeeklyReview(
  range: AnalyticsDateRange,
  focus: FocusAnalytics,
  quran: QuranAnalytics,
  tasks: TaskAnalytics,
  habits: HabitAnalytics,
): WeeklyReview {
  const weekStart = startOfIsoWeek(range.today);
  const weekEnd = range.today;
  return {
    periodLabel: formatRangeLabel(weekStart, weekEnd),
    focusSessions: focus.completedSessions,
    quranReadingDays: quran.readingDays,
    tasksCompleted: tasks.completed,
    habitCompletionRate: habits.completionRate,
    topFocusSubject: focus.bySubject[0]
      ? { name: focus.bySubject[0].name, minutes: focus.bySubject[0].minutes }
      : undefined,
    quranMinutes: quran.minutesRead,
    reflectionPrompt: "What would you like to carry into next week?",
  };
}

function buildMonthlyReview(
  range: AnalyticsDateRange,
  prayer: PrayerAnalytics,
  habits: HabitAnalytics,
  quran: QuranAnalytics,
  dhikr: DhikrAnalytics,
  tasks: TaskAnalytics,
  focus: FocusAnalytics,
  goals: GoalAnalytics,
): MonthlyReview {
  const parts: string[] = [];
  parts.push(`During ${formatRangeLabel(range.startDate, range.endDate)}, prayer activity was logged ${prayer.completed} time${prayer.completed === 1 ? "" : "s"}.`);
  parts.push(`Habit completion was ${habits.completionRate}%.`);
  parts.push(`Qur'an reading totaled ${formatMinutes(quran.minutesRead)} across ${quran.readingDays} day${quran.readingDays === 1 ? "" : "s"}.`);
  parts.push(`There were ${dhikr.completedSessions} completed dhikr session${dhikr.completedSessions === 1 ? "" : "s"} and ${formatMinutes(focus.totalMinutes)} of completed focus time.`);
  parts.push(`${tasks.completed} task${tasks.completed === 1 ? "" : "s"} were completed.`);
  parts.push(`${goals.spiritualCompleted + goals.productivityCompleted} goal${goals.spiritualCompleted + goals.productivityCompleted === 1 ? "" : "s"} reached completion.`);

  return {
    periodLabel: formatRangeLabel(range.startDate, range.endDate),
    narrative: parts.join(" "),
    focusMinutes: focus.totalMinutes,
    tasksCompleted: tasks.completed,
    habitCompletionRate: habits.completionRate,
    quranMinutes: quran.minutesRead,
    dhikrSessions: dhikr.completedSessions,
    goalsCompleted: goals.spiritualCompleted + goals.productivityCompleted,
  };
}

export function aggregateAnalytics(
  snapshot: AnalyticsSnapshot,
  range: AnalyticsDateRange,
  options?: { isStale?: boolean; lastUpdatedAt?: string },
): AnalyticsSummary {
  const dates = enumerateDates(range.startDate, range.endDate).filter((date) => date <= range.today);
  const prayer = aggregatePrayer(snapshot, range, dates);
  const habits = aggregateHabits(snapshot, range, dates);
  const quran = aggregateQuran(snapshot, range, dates);
  const dhikr = aggregateDhikr(snapshot, range, dates);
  const tasks = aggregateTasks(snapshot, range, dates);
  const focus = aggregateFocus(snapshot, range, dates);
  const goals = aggregateGoals(snapshot, range);
  const reflections = aggregateReflections(snapshot, range, dates);

  const todayDates = dates.filter((d) => d === range.today);
  const todayPrayer = todayDates.length ? aggregatePrayer(snapshot, { ...range, startDate: range.today, endDate: range.today, dayCount: 1 }, [range.today]) : prayer;
  const todayHabits = todayDates.length ? aggregateHabits(snapshot, { ...range, startDate: range.today, endDate: range.today, dayCount: 1 }, [range.today]) : habits;
  const todayQuran = todayDates.length ? aggregateQuran(snapshot, { ...range, startDate: range.today, endDate: range.today, dayCount: 1 }, [range.today]) : quran;
  const todayDhikr = todayDates.length ? aggregateDhikr(snapshot, { ...range, startDate: range.today, endDate: range.today, dayCount: 1 }, [range.today]) : dhikr;
  const todayTasks = todayDates.length ? aggregateTasks(snapshot, { ...range, startDate: range.today, endDate: range.today, dayCount: 1 }, [range.today]) : tasks;
  const todayFocus = todayDates.length ? aggregateFocus(snapshot, { ...range, startDate: range.today, endDate: range.today, dayCount: 1 }, [range.today]) : focus;

  const dailyActivity = dailyTrend(dates, (date) => {
    const prayers = snapshot.prayerLogs.filter((l) => l.date === date && isCompletedPrayer(l.status)).length;
    const habitDone = snapshot.habitLogs.filter((l) => l.date === date && l.completed).length;
    const quranDone = snapshot.quranSessions.filter((s) => s.readingDate === date).length;
    const focusDone = snapshot.focusSessions.filter(
      (s) => calendarDateFromInstant(s.startedAt, range.timezone) === date && isCompletedFocus(s.status),
    ).length;
    return prayers + habitDone + quranDone + focusDone;
  });

  const weeklyReview = buildWeeklyReview(
    range,
    range.preset === "this_week" ? focus : aggregateFocus(snapshot, { ...range, startDate: startOfIsoWeek(range.today), endDate: range.today, preset: "this_week", dayCount: enumerateDates(startOfIsoWeek(range.today), range.today).length }, enumerateDates(startOfIsoWeek(range.today), range.today)),
    range.preset === "this_week" ? quran : aggregateQuran(snapshot, { ...range, startDate: startOfIsoWeek(range.today), endDate: range.today, preset: "this_week", dayCount: enumerateDates(startOfIsoWeek(range.today), range.today).length }, enumerateDates(startOfIsoWeek(range.today), range.today)),
    range.preset === "this_week" ? tasks : aggregateTasks(snapshot, { ...range, startDate: startOfIsoWeek(range.today), endDate: range.today, preset: "this_week", dayCount: enumerateDates(startOfIsoWeek(range.today), range.today).length }, enumerateDates(startOfIsoWeek(range.today), range.today)),
    range.preset === "this_week" ? habits : aggregateHabits(snapshot, { ...range, startDate: startOfIsoWeek(range.today), endDate: range.today, preset: "this_week", dayCount: enumerateDates(startOfIsoWeek(range.today), range.today).length }, enumerateDates(startOfIsoWeek(range.today), range.today)),
  );

  const monthStart = `${range.today.slice(0, 7)}-01`;
  const monthDates = enumerateDates(monthStart, range.today);
  const monthRange: AnalyticsDateRange = {
    ...range,
    startDate: monthStart,
    endDate: range.today,
    preset: "this_month",
    dayCount: monthDates.length,
  };
  const monthlyReview = buildMonthlyReview(
    monthRange,
    aggregatePrayer(snapshot, monthRange, monthDates),
    aggregateHabits(snapshot, monthRange, monthDates),
    aggregateQuran(snapshot, monthRange, monthDates),
    aggregateDhikr(snapshot, monthRange, monthDates),
    aggregateTasks(snapshot, monthRange, monthDates),
    aggregateFocus(snapshot, monthRange, monthDates),
    goals,
  );

  const summary: AnalyticsSummary = {
    range,
    generatedAt: snapshot.generatedAt,
    isStale: options?.isStale ?? false,
    lastUpdatedAt: options?.lastUpdatedAt ?? snapshot.generatedAt,
    overview: {
      salahCompleted: todayPrayer.completed,
      salahPossible: todayPrayer.possible,
      habitsCompleted: todayHabits.completedLogs,
      habitsPossible: snapshot.habits.filter((h) => h.isActive).length,
      quranMinutes: todayQuran.minutesRead,
      dhikrSessions: todayDhikr.sessions,
      tasksCompleted: todayTasks.completed,
      focusMinutes: todayFocus.totalMinutes,
      activeGoals: goals.spiritualActive + goals.productivityActive,
      habitCompletionRate: habits.completionRate,
    },
    prayer,
    habits,
    quran,
    dhikr,
    tasks,
    focus,
    goals,
    reflections,
    trends: {
      dailyActivity,
      focus: focus.byDay,
      quran: quran.weeklyTrend,
      habits: habits.weeklyTrend,
      tasks: tasks.weeklyTrend,
      prayer: prayer.dailyCompletion,
      dhikr: dhikr.weeklyTrend,
    },
    heatmap: {
      all: heatmapCells(snapshot, range.today, range.timezone, "all"),
      quran: heatmapCells(snapshot, range.today, range.timezone, "quran"),
      habits: heatmapCells(snapshot, range.today, range.timezone, "habits"),
      focus: heatmapCells(snapshot, range.today, range.timezone, "focus"),
      reflections: heatmapCells(snapshot, range.today, range.timezone, "reflections"),
    },
    weeklyReview,
    monthlyReview,
    insights: [],
  };

  summary.insights = generatePersonalInsights(summary);
  return summary;
}

export function prayerNameLabel(name: PrayerName): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export { formatMinutes };
