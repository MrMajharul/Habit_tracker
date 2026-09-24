import {
  differenceInCalendarDays,
  format,
  isAfter,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  weeklyCompletionRate: number; // 0 to 100
  monthlyCompletionRate: number; // 0 to 100
  totalCompletedDays: number;
}

export function calculateHabitStreak(
  completedDateStrings: string[],
  referenceDate = new Date(),
): StreakStats {
  const refStart = startOfDay(referenceDate);

  // Normalize, deduplicate, filter future dates
  const uniqueDates = Array.from(new Set(completedDateStrings))
    .filter((d) => Boolean(d) && !isNaN(Date.parse(d)))
    .map((d) => startOfDay(parseISO(d)))
    .filter((d) => !isAfter(d, refStart))
    .sort((a, b) => b.getTime() - a.getTime()); // Descending (newest first)

  if (uniqueDates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      weeklyCompletionRate: 0,
      monthlyCompletionRate: 0,
      totalCompletedDays: 0,
    };
  }

  // 1. Current Streak
  const todayStr = format(refStart, "yyyy-MM-dd");
  const yesterdayStr = format(subDays(refStart, 1), "yyyy-MM-dd");

  const dateSet = new Set(uniqueDates.map((d) => format(d, "yyyy-MM-dd")));

  let currentStreak = 0;
  const isCompletedToday = dateSet.has(todayStr);
  const isCompletedYesterday = dateSet.has(yesterdayStr);

  if (isCompletedToday || isCompletedYesterday) {
    let checkDate = isCompletedToday ? refStart : subDays(refStart, 1);
    while (dateSet.has(format(checkDate, "yyyy-MM-dd"))) {
      currentStreak++;
      checkDate = subDays(checkDate, 1);
    }
  }

  // 2. Longest Streak
  // Sort ascending for longest streak detection
  const ascendingDates = [...uniqueDates].sort((a, b) => a.getTime() - b.getTime());
  let longestStreak = 0;
  let runningStreak = 0;
  let prevDate: Date | null = null;

  for (const d of ascendingDates) {
    if (!prevDate) {
      runningStreak = 1;
    } else {
      const diff = differenceInCalendarDays(d, prevDate);
      if (diff === 1) {
        runningStreak++;
      } else if (diff > 1) {
        runningStreak = 1;
      }
      // diff === 0 handled by deduplication
    }
    prevDate = d;
    if (runningStreak > longestStreak) {
      longestStreak = runningStreak;
    }
  }

  // 3. Weekly Completion Rate (Last 7 days including today)
  let last7Count = 0;
  for (let i = 0; i < 7; i++) {
    const dStr = format(subDays(refStart, i), "yyyy-MM-dd");
    if (dateSet.has(dStr)) {
      last7Count++;
    }
  }
  const weeklyCompletionRate = Math.round((last7Count / 7) * 100);

  // 4. Monthly Completion Rate (Last 30 days including today)
  let last30Count = 0;
  for (let i = 0; i < 30; i++) {
    const dStr = format(subDays(refStart, i), "yyyy-MM-dd");
    if (dateSet.has(dStr)) {
      last30Count++;
    }
  }
  const monthlyCompletionRate = Math.round((last30Count / 30) * 100);

  return {
    currentStreak,
    longestStreak,
    weeklyCompletionRate,
    monthlyCompletionRate,
    totalCompletedDays: uniqueDates.length,
  };
}
