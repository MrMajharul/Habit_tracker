import {
  differenceInCalendarDays,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";

import type {
  QuranDailyProgress,
  QuranWeeklyProgress,
  QuranStreakInfo,
  QuranProgressSummary,
  QuranReadingSession,
} from "./quran-types";
import { quranService } from "./quran-service";
import { quranGoalService } from "./quran-goal-service";
import { SURAH_DATA } from "./quran-provider";

// ─── Helpers ────────────────────────────────────────────────────────────────

function todayStr(now = new Date()): string {
  return format(now, "yyyy-MM-dd");
}

function getWeekStartStr(now = new Date()): string {
  return format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
}

function getMonthStartStr(now = new Date()): string {
  return format(startOfMonth(now), "yyyy-MM-dd");
}

function countAyahs(session: QuranReadingSession): number {
  return Math.max(0, session.endAyah - session.startAyah + 1);
}

// ─── Daily Progress ─────────────────────────────────────────────────────────

export function getDailyProgress(date?: string): QuranDailyProgress {
  const d = date ?? todayStr();
  const sessions = quranService.getSessionsByDate(d);
  const goalSettings = quranGoalService.getGoalSettings();

  const minutesRead = sessions.reduce((sum, s) => sum + s.minutesRead, 0);
  const ayahsRead = sessions.reduce((sum, s) => sum + countAyahs(s), 0);

  let targetMet = false;
  if (goalSettings?.isEnabled) {
    if (goalSettings.targetType === "minutes") {
      targetMet = minutesRead >= goalSettings.targetValue;
    } else {
      targetMet = ayahsRead >= goalSettings.targetValue;
    }
  }

  return {
    minutesRead,
    ayahsRead,
    sessionsCount: sessions.length,
    targetMet,
  };
}

// ─── Weekly Progress ────────────────────────────────────────────────────────

export function getWeeklyProgress(): QuranWeeklyProgress {
  const start = getWeekStartStr();
  const end = todayStr();
  const sessions = quranService.getSessionsInRange(start, end);

  const uniqueDays = new Set(sessions.map((s) => s.readingDate));

  return {
    minutesRead: sessions.reduce((sum, s) => sum + s.minutesRead, 0),
    ayahsRead: sessions.reduce((sum, s) => sum + countAyahs(s), 0),
    sessionsCount: sessions.length,
    daysRead: uniqueDays.size,
  };
}

// ─── Streak Calculation ─────────────────────────────────────────────────────

export function getStreakInfo(): QuranStreakInfo {
  const allSessions = quranService.getReadingSessions();
  if (allSessions.length === 0) {
    return { currentStreak: 0, longestStreak: 0, daysReadThisWeek: 0, daysReadThisMonth: 0 };
  }

  // Unique reading dates, sorted descending
  const uniqueDates = [...new Set(allSessions.map((s) => s.readingDate))]
    .filter((d) => d <= todayStr()) // Never count future dates
    .sort((a, b) => b.localeCompare(a));

  if (uniqueDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, daysReadThisWeek: 0, daysReadThisMonth: 0 };
  }

  // Current streak: consecutive days ending today or yesterday
  let currentStreak = 0;
  const today = startOfDay(new Date());

  // Check if the most recent reading was today or yesterday
  const lastRead = startOfDay(parseISO(uniqueDates[0]));
  const daysDiff = differenceInCalendarDays(today, lastRead);

  if (daysDiff <= 1) {
    // Start counting from the most recent day
    currentStreak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const prev = startOfDay(parseISO(uniqueDates[i - 1]));
      const curr = startOfDay(parseISO(uniqueDates[i]));
      const diff = differenceInCalendarDays(prev, curr);
      if (diff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Longest streak
  let longestStreak = 1;
  let tempStreak = 1;
  const sortedAsc = [...uniqueDates].sort();

  for (let i = 1; i < sortedAsc.length; i++) {
    const prev = startOfDay(parseISO(sortedAsc[i - 1]));
    const curr = startOfDay(parseISO(sortedAsc[i]));
    const diff = differenceInCalendarDays(curr, prev);
    if (diff === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else if (diff > 1) {
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  // Days read this week/month
  const weekStart = getWeekStartStr();
  const monthStart = getMonthStartStr();
  const daysReadThisWeek = uniqueDates.filter((d) => d >= weekStart).length;
  const daysReadThisMonth = uniqueDates.filter((d) => d >= monthStart).length;

  return { currentStreak, longestStreak, daysReadThisWeek, daysReadThisMonth };
}

// ─── Full Summary ───────────────────────────────────────────────────────────

export function getProgressSummary(): QuranProgressSummary {
  const allSessions = quranService.getReadingSessions();
  const position = quranService.getReadingPosition();

  const positionWithName = position
    ? {
        ...position,
        surahName: SURAH_DATA[position.surahNumber - 1]?.name,
      }
    : undefined;

  return {
    daily: getDailyProgress(),
    weekly: getWeeklyProgress(),
    streak: getStreakInfo(),
    totalSessions: allSessions.length,
    totalMinutes: allSessions.reduce((sum, s) => sum + s.minutesRead, 0),
    totalAyahsRead: allSessions.reduce((sum, s) => sum + countAyahs(s), 0),
    lastPosition: positionWithName,
  };
}

export const quranProgressService = {
  getDailyProgress,
  getWeeklyProgress,
  getStreakInfo,
  getProgressSummary,
};
