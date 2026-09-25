import { format, subDays } from "date-fns";

import { isDevAuthBypass, isSupabaseConfigured } from "@/lib/constants";
import { enqueueOfflineAction } from "@/lib/offline/offline-sync-queue";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import type { DashboardHabit, Habit, HabitCategory, PrayerAnchor } from "@/types";
import { calculateHabitStreak, type StreakStats } from "./streak-calculator";

const HABITS_STORE_KEY = "istiqamah_habits_data";
const LEGACY_HABITS_STORE_KEY = "noorpath_habits_data";
const HABIT_LOGS_STORE_KEY = "istiqamah_habit_logs_data";
const LEGACY_HABIT_LOGS_STORE_KEY = "noorpath_habit_logs_data";

export function getTodayDateString(d = new Date()): string {
  return format(d, "yyyy-MM-dd");
}

function generateInitialSeedLogs(): Record<string, string[]> {
  const today = new Date();
  const logs: Record<string, string[]> = {
    "habit-1": [], // 7 day streak
    "habit-2": [], // 12 day streak
    "habit-3": [], // 3 day streak
    "habit-4": [], // 5 day streak
    "habit-5": [], // 1 day streak
  };

  // Habit 1: 7-day streak including today
  for (let i = 0; i < 7; i++) {
    logs["habit-1"].push(format(subDays(today, i), "yyyy-MM-dd"));
  }
  // Habit 2: 12-day streak including today
  for (let i = 0; i < 12; i++) {
    logs["habit-2"].push(format(subDays(today, i), "yyyy-MM-dd"));
  }
  // Habit 3: 3 days, but yesterday was completed and today is not yet completed
  for (let i = 1; i <= 3; i++) {
    logs["habit-3"].push(format(subDays(today, i), "yyyy-MM-dd"));
  }
  // Habit 4: 5 days including today
  for (let i = 0; i < 5; i++) {
    logs["habit-4"].push(format(subDays(today, i), "yyyy-MM-dd"));
  }
  // Habit 5: not completed today, was completed 2 days ago
  logs["habit-5"].push(format(subDays(today, 2), "yyyy-MM-dd"));

  return logs;
}

export const INITIAL_HABITS: Habit[] = [
  {
    id: "habit-1",
    userId: "dev-user",
    name: "Read Qur'an",
    description: "Daily recitation after Fajr",
    icon: "book-open",
    category: "islamic",
    frequency: "daily",
    targetValue: 5,
    targetUnit: "pages",
    reminderEnabled: true,
    prayerAnchor: "fajr",
    startDate: "2026-09-01",
    isActive: true,
    streak: 7,
    completedToday: true,
  },
  {
    id: "habit-2",
    userId: "dev-user",
    name: "Morning Dhikr",
    description: "Recite morning adhkar & tasbeeh",
    icon: "heart-handshake",
    category: "islamic",
    frequency: "daily",
    targetValue: 1,
    targetUnit: "session",
    reminderEnabled: true,
    prayerAnchor: "fajr",
    startDate: "2026-09-01",
    isActive: true,
    streak: 12,
    completedToday: true,
  },
  {
    id: "habit-3",
    userId: "dev-user",
    name: "Exercise",
    description: "Cardio or stretching before Asr",
    icon: "dumbbell",
    category: "health",
    frequency: "daily",
    targetValue: 30,
    targetUnit: "min",
    reminderEnabled: false,
    prayerAnchor: "asr",
    startDate: "2026-09-05",
    isActive: true,
    streak: 3,
    completedToday: false,
  },
  {
    id: "habit-4",
    userId: "dev-user",
    name: "Study 2 hours",
    description: "Focus on primary university or work subject",
    icon: "graduation-cap",
    category: "study",
    frequency: "daily",
    targetValue: 2,
    targetUnit: "hours",
    reminderEnabled: true,
    prayerAnchor: "dhuhr",
    startDate: "2026-09-10",
    isActive: true,
    streak: 5,
    completedToday: true,
  },
  {
    id: "habit-5",
    userId: "dev-user",
    name: "Read 10 pages",
    description: "Islamic history or productive book",
    icon: "book-marked",
    category: "personal",
    frequency: "daily",
    targetValue: 10,
    targetUnit: "pages",
    reminderEnabled: false,
    prayerAnchor: "isha",
    startDate: "2026-09-15",
    isActive: true,
    streak: 1,
    completedToday: false,
  },
];

export function getLocalHabits(): Habit[] {
  if (typeof window === "undefined") return INITIAL_HABITS;
  try {
    const raw =
      localStorage.getItem(HABITS_STORE_KEY) ??
      localStorage.getItem(LEGACY_HABITS_STORE_KEY);
    if (!raw) {
      localStorage.setItem(HABITS_STORE_KEY, JSON.stringify(INITIAL_HABITS));
      return INITIAL_HABITS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_HABITS;
  }
}

export function saveLocalHabits(habits: Habit[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(HABITS_STORE_KEY, JSON.stringify(habits));
  } catch {
    // Ignore quota errors
  }
}

export function getLocalHabitLogs(): Record<string, string[]> {
  if (typeof window === "undefined") {
    return generateInitialSeedLogs();
  }
  try {
    const raw =
      localStorage.getItem(HABIT_LOGS_STORE_KEY) ??
      localStorage.getItem(LEGACY_HABIT_LOGS_STORE_KEY);
    if (!raw) {
      const initial = generateInitialSeedLogs();
      localStorage.setItem(HABIT_LOGS_STORE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return generateInitialSeedLogs();
  }
}

export function saveLocalHabitLogs(logs: Record<string, string[]>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(HABIT_LOGS_STORE_KEY, JSON.stringify(logs));
  } catch {
    // Ignore quota errors
  }
}

export async function fetchHabitsWithStatus(
  dateStr = getTodayDateString(),
): Promise<Habit[]> {
  const localHabits = getLocalHabits();
  const localLogs = getLocalHabitLogs();

  if (!isSupabaseConfigured || isDevAuthBypass) {
    return localHabits
      .filter((h) => h.isActive)
      .map((h) => {
        const dates = localLogs[h.id] || [];
        const isDone = dates.includes(dateStr);
        const stats = calculateHabitStreak(dates);
        return {
          ...h,
          completedToday: isDone,
          streak: stats.currentStreak,
        };
      });
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return localHabits.filter((h) => h.isActive);
    }

    const { data: dbHabits, error: habitsError } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (habitsError || !dbHabits || dbHabits.length === 0) {
      return localHabits.filter((h) => h.isActive);
    }

    // Fetch all logs for this user to compute streaks
    const { data: dbLogs } = await supabase
      .from("habit_logs")
      .select("habit_id, date, completed")
      .eq("user_id", user.id)
      .eq("completed", true);

    const logsMap: Record<string, string[]> = {};
    if (dbLogs) {
      for (const log of dbLogs) {
        if (!logsMap[log.habit_id]) logsMap[log.habit_id] = [];
        logsMap[log.habit_id].push(log.date);
      }
    }

    const mapped: Habit[] = dbHabits.map((row) => {
      const dates = logsMap[row.id] || [];
      const stats = calculateHabitStreak(dates);
      return {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        description: row.description || undefined,
        icon: row.icon,
        category: (row.category as HabitCategory) || "personal",
        frequency: (row.frequency as "daily" | "weekly") || "daily",
        targetValue: row.target_value ?? undefined,
        targetUnit: row.target_unit ?? undefined,
        reminderEnabled: row.reminder_enabled ?? false,
        reminderTime: row.reminder_time || undefined,
        prayerAnchor: (row.prayer_anchor as PrayerAnchor) || "none",
        startDate: row.start_date,
        isActive: row.is_active,
        streak: stats.currentStreak,
        completedToday: dates.includes(dateStr),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    saveLocalHabits(mapped);
    saveLocalHabitLogs(logsMap);
    return mapped;
  } catch (err) {
    console.warn("Failed to fetch habits from Supabase, returning local:", err);
    return localHabits.filter((h) => h.isActive);
  }
}

export async function toggleHabit(
  habitId: string,
  completed: boolean,
  dateStr = getTodayDateString(),
): Promise<StreakStats> {
  // 1. Optimistic update in localStorage
  const logs = getLocalHabitLogs();
  const habitDates = logs[habitId] ? [...logs[habitId]] : [];

  if (completed) {
    if (!habitDates.includes(dateStr)) {
      habitDates.push(dateStr);
    }
  } else {
    const idx = habitDates.indexOf(dateStr);
    if (idx !== -1) {
      habitDates.splice(idx, 1);
    }
  }

  logs[habitId] = habitDates;
  saveLocalHabitLogs(logs);

  // Update habit's completedToday flag in local habits list
  const habits = getLocalHabits();
  const streakStats = calculateHabitStreak(habitDates);
  const updatedHabits = habits.map((h) =>
    h.id === habitId
      ? { ...h, completedToday: completed, streak: streakStats.currentStreak }
      : h,
  );
  saveLocalHabits(updatedHabits);

  // 2. Offline check
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    enqueueOfflineAction({
      type: "LOG_HABIT",
      payload: { habitId, date: dateStr, completed, value: 1 },
    });
    return streakStats;
  }

  // 3. Supabase Sync
  if (!isSupabaseConfigured || isDevAuthBypass) {
    return streakStats;
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return streakStats;

    await supabase.from("habit_logs").upsert(
      {
        habit_id: habitId,
        user_id: user.id,
        date: dateStr,
        completed,
        value: 1,
        completed_at: completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "habit_id,date" },
    );
  } catch (err) {
    console.warn("Habit sync error, enqueued offline:", err);
    enqueueOfflineAction({
      type: "LOG_HABIT",
      payload: { habitId, date: dateStr, completed, value: 1 },
    });
  }

  return streakStats;
}

export async function createHabit(
  input: Omit<Habit, "id" | "userId" | "createdAt" | "updatedAt">,
): Promise<Habit> {
  const newId = `habit_${Date.now()}`;
  const habit: Habit = {
    ...input,
    id: newId,
    userId: "dev-user",
    isActive: true,
    streak: 0,
    completedToday: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Local save
  const current = getLocalHabits();
  current.push(habit);
  saveLocalHabits(current);

  if (!isSupabaseConfigured || isDevAuthBypass) {
    return habit;
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const row: Database["public"]["Tables"]["habits"]["Insert"] = {
        user_id: user.id,
        name: habit.name,
        description: habit.description || null,
        icon: habit.icon,
        category: habit.category,
        frequency: habit.frequency,
        target_value: habit.targetValue ?? 1,
        target_unit: habit.targetUnit || null,
        reminder_enabled: habit.reminderEnabled ?? false,
        reminder_time: habit.reminderTime || null,
        prayer_anchor: habit.prayerAnchor || "none",
        start_date: habit.startDate || getTodayDateString(),
        is_active: true,
      };

      const { data, error } = await supabase
        .from("habits")
        .insert(row)
        .select()
        .single();

      if (!error && data) {
        habit.id = data.id;
        habit.userId = data.user_id;
        saveLocalHabits(current.map((h) => (h.id === newId ? habit : h)));
      }
    }
  } catch (err) {
    console.warn("Failed to create habit in Supabase:", err);
  }

  return habit;
}

export async function updateHabit(
  habitId: string,
  updates: Partial<Habit>,
): Promise<Habit | null> {
  const current = getLocalHabits();
  const idx = current.findIndex((h) => h.id === habitId);
  if (idx === -1) return null;

  const updated: Habit = {
    ...current[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  current[idx] = updated;
  saveLocalHabits(current);

  if (isSupabaseConfigured && !isDevAuthBypass) {
    try {
      const supabase = createClient();
      await supabase
        .from("habits")
        .update({
          name: updated.name,
          description: updated.description || null,
          icon: updated.icon,
          category: updated.category,
          frequency: updated.frequency,
          target_value: updated.targetValue ?? 1,
          target_unit: updated.targetUnit || null,
          reminder_enabled: updated.reminderEnabled ?? false,
          prayer_anchor: updated.prayerAnchor || "none",
          is_active: updated.isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", habitId);
    } catch (err) {
      console.warn("Failed to update habit in Supabase:", err);
    }
  }

  return updated;
}

export async function archiveHabit(habitId: string): Promise<void> {
  await updateHabit(habitId, { isActive: false });
}

export async function deleteHabit(habitId: string): Promise<void> {
  const current = getLocalHabits().filter((h) => h.id !== habitId);
  saveLocalHabits(current);

  if (isSupabaseConfigured && !isDevAuthBypass) {
    try {
      const supabase = createClient();
      await supabase.from("habits").delete().eq("id", habitId);
    } catch (err) {
      console.warn("Failed to delete habit from Supabase:", err);
    }
  }
}

export function toDashboardHabit(habit: Habit): DashboardHabit {
  return {
    id: habit.id,
    name: habit.name,
    icon: habit.icon,
    category: habit.category,
    completed: Boolean(habit.completedToday),
    target: habit.targetValue
      ? `${habit.targetValue} ${habit.targetUnit || ""}`.trim()
      : undefined,
    streak: habit.streak,
    prayerAnchor: habit.prayerAnchor,
  };
}
