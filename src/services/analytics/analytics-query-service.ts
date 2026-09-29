import { isDevAuthBypass, isSupabaseConfigured } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { getAllDhikr, getDhikrSessions } from "@/services/dhikr/dhikr-service";
import { getLocalHabitLogs, getLocalHabits } from "@/services/habits/habit-service";
import { getLocalPrayerLogs } from "@/services/prayer/prayer-log-service";
import { quranGoalService } from "@/services/quran/quran-goal-service";
import { SURAH_DATA } from "@/services/quran/quran-provider";
import { quranService } from "@/services/quran/quran-service";
import { focusService } from "@/services/study/focus-service";
import { subjectService } from "@/services/study/subject-service";
import { taskService } from "@/services/study/task-service";

import { addCalendarDays, enumerateDates, formatInstantInTimeZone } from "./analytics-period";
import type {
  AnalyticsHabitLog,
  AnalyticsPrayerLog,
  AnalyticsReflection,
  AnalyticsSnapshot,
  PrayerName,
} from "./analytics-types";
import { PRAYER_NAMES } from "./analytics-types";

const GOALS_STORAGE_KEY = "istiqamaah_user_goals";
const LEGACY_GOALS_STORAGE_KEY = "noorpath_user_goals";
const REFLECTION_KEY = "istiqamaah_daily_reflection";
const LEGACY_REFLECTION_KEY = "noorpath_daily_reflection";
const CACHE_KEY = "istiqamaah_analytics_snapshot_cache";

export interface CachedSnapshot {
  snapshot: AnalyticsSnapshot;
  savedAt: string;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function collectLocalPrayerLogs(startDate: string, endDate: string, userId?: string): AnalyticsPrayerLog[] {
  const logs: AnalyticsPrayerLog[] = [];
  for (const date of enumerateDates(startDate, endDate)) {
    const day = getLocalPrayerLogs(date, userId);
    for (const prayer of PRAYER_NAMES) {
      if (day[prayer]) {
        logs.push({ prayer, date, status: "completed" });
      }
    }
  }
  return logs;
}

function collectLocalHabitLogs(userId?: string): AnalyticsHabitLog[] {
  const map = getLocalHabitLogs(userId);
  const logs: AnalyticsHabitLog[] = [];
  for (const [habitId, dates] of Object.entries(map)) {
    for (const date of dates) {
      logs.push({ habitId, date, completed: true });
    }
  }
  return logs;
}

function collectLocalReflections(today: string): AnalyticsReflection[] {
  const raw =
    (typeof window !== "undefined" &&
      (localStorage.getItem(REFLECTION_KEY) ?? localStorage.getItem(LEGACY_REFLECTION_KEY))) ||
    null;
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as {
      mood?: string;
      achievements?: string;
      improvements?: string;
      priority?: string;
      updatedAt?: string;
      reflectionDate?: string;
    };
    return [
      {
        reflectionDate: data.reflectionDate ?? today,
        mood: data.mood ?? null,
        tomorrowPriority: data.priority ?? null,
        achievements: data.achievements ?? null,
        improvements: data.improvements ?? null,
      },
    ];
  } catch {
    return [];
  }
}

function collectLocalGoals(): AnalyticsSnapshot["productivityGoals"] {
  const raw =
    typeof window === "undefined"
      ? null
      : localStorage.getItem(GOALS_STORAGE_KEY) ?? localStorage.getItem(LEGACY_GOALS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const goals = JSON.parse(raw) as Array<{
      id: string;
      title: string;
      category?: string;
      targetValue: number;
      currentValue: number;
      isCompleted: boolean;
      deadline?: string;
    }>;
    return goals.map((goal) => ({
      id: goal.id,
      title: goal.title,
      category: goal.category,
      targetValue: goal.targetValue,
      currentValue: goal.currentValue,
      isCompleted: goal.isCompleted,
      deadline: goal.deadline,
    }));
  } catch {
    return [];
  }
}

export function loadLocalSnapshot(options: {
  userId?: string;
  timezone: string;
  now?: Date;
}): AnalyticsSnapshot {
  const now = options.now ?? new Date();
  const today = formatInstantInTimeZone(now, options.timezone);
  const startDate = addCalendarDays(today, -365);
  const position = quranService.getReadingPosition();
  const quranGoal = quranGoalService.getGoalSettings();
  const userId = options.userId ?? "local-user";

  return {
    userId,
    timezone: options.timezone,
    generatedAt: now.toISOString(),
    prayerLogs: collectLocalPrayerLogs(startDate, today, options.userId),
    habits: getLocalHabits(options.userId).map((habit) => ({
      id: habit.id,
      name: habit.name,
      isActive: habit.isActive,
      startDate: habit.startDate,
      frequency: habit.frequency,
    })),
    habitLogs: collectLocalHabitLogs(options.userId),
    tasks: [],
    subjects: [],
    focusSessions: [],
    quranSessions: quranService.getReadingSessions().map((session) => ({
      surahNumber: session.surahNumber,
      startAyah: session.startAyah,
      endAyah: session.endAyah,
      minutesRead: session.minutesRead,
      readingDate: session.readingDate,
    })),
    quranPosition: position
      ? {
          surahNumber: position.surahNumber,
          ayahNumber: position.ayahNumber,
          surahName: SURAH_DATA[position.surahNumber - 1]?.name,
        }
      : undefined,
    quranGoal: quranGoal
      ? {
          targetType: quranGoal.targetType,
          targetValue: quranGoal.targetValue,
          isEnabled: quranGoal.isEnabled,
        }
      : undefined,
    dhikrSessions: getDhikrSessions(userId).map((session) => ({
      dhikrId: session.dhikrId,
      completedCount: session.completedCount,
      targetCount: session.targetCount,
      startedAt: session.startedAt,
      status: session.status,
    })),
    dhikrCatalog: getAllDhikr().map((item) => ({ id: item.id, category: item.category })),
    productivityGoals: collectLocalGoals(),
    spiritualGoals: quranGoalService.getSpiritualGoals().map((goal) => ({
      id: goal.id,
      title: goal.title,
      type: goal.type,
      targetValue: goal.targetValue,
      currentValue: goal.currentValue,
      isCompleted: goal.isCompleted,
      deadline: goal.targetDate,
    })),
    reflections: collectLocalReflections(today),
  };
}

export async function hydrateLocalStudyData(snapshot: AnalyticsSnapshot): Promise<AnalyticsSnapshot> {
  const [tasks, subjects, focusSessions] = await Promise.all([
    taskService.getTasks(),
    subjectService.getSubjects(),
    focusService.getSessions(),
  ]);

  return {
    ...snapshot,
    tasks: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      subjectId: task.subjectId,
      dueDate: task.dueDate,
      completedAt: task.completedAt,
      createdAt: task.createdAt,
      estimatedMinutes: task.estimatedMinutes,
    })),
    subjects: subjects.map((subject) => ({
      id: subject.id,
      name: subject.name,
      color: subject.color,
      weeklyTargetMinutes: subject.weeklyTargetMinutes,
      isArchived: subject.isArchived,
    })),
    focusSessions: focusSessions.map((session) => ({
      id: session.id,
      startedAt: session.startedAt,
      actualMinutes: session.actualMinutes,
      plannedMinutes: session.plannedMinutes,
      status: session.status,
      subjectId: session.subjectId,
      subjectName: session.subjectName,
    })),
  };
}

export function saveSnapshotCache(snapshot: AnalyticsSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    const payload: CachedSnapshot = { snapshot, savedAt: snapshot.generatedAt };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota
  }
}

export function readSnapshotCache(): CachedSnapshot | null {
  if (typeof window === "undefined") return null;
  return readJson<CachedSnapshot | null>(CACHE_KEY, null);
}

export function analyticsQueryUsesUserScopedClient(): boolean {
  return true;
}

export async function fetchRemoteSnapshot(options: {
  userId: string;
  timezone: string;
  startDate: string;
  endDate: string;
}): Promise<Partial<AnalyticsSnapshot> | null> {
  if (!isSupabaseConfigured || isDevAuthBypass || typeof window === "undefined") {
    return null;
  }
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return null;
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.id !== options.userId) return null;

    const userId = user.id;

    const [
      prayerRes,
      habitRes,
      habitLogRes,
      taskRes,
      subjectRes,
      focusRes,
      quranRes,
      dhikrRes,
      goalRes,
      spiritualRes,
      reflectionRes,
    ] = await Promise.all([
      supabase.from("prayer_logs").select("prayer,date,status").eq("user_id", userId).gte("date", options.startDate).lte("date", options.endDate),
      supabase.from("habits").select("id,name,is_active,start_date,frequency").eq("user_id", userId),
      supabase.from("habit_logs").select("habit_id,date,completed").eq("user_id", userId).gte("date", options.startDate).lte("date", options.endDate),
      supabase.from("tasks").select("id,title,status,subject_id,due_date,completed_at,created_at,estimated_minutes").eq("user_id", userId),
      supabase.from("subjects").select("id,name,color,weekly_target_minutes,is_archived").eq("user_id", userId),
      supabase.from("focus_sessions").select("id,started_at,actual_minutes,planned_minutes,status,subject_id").eq("user_id", userId).gte("started_at", `${options.startDate}T00:00:00`),
      supabase.from("quran_reading_sessions").select("surah_number,start_ayah,end_ayah,minutes_read,reading_date").eq("user_id", userId).gte("reading_date", options.startDate).lte("reading_date", options.endDate),
      supabase.from("dhikr_sessions").select("dhikr_id,completed_count,target_count,started_at,status").eq("user_id", userId),
      supabase.from("goals").select("id,title,category,target_value,current_value,is_completed,deadline").eq("user_id", userId),
      supabase.from("spiritual_goals").select("id,title,type,target_value,current_value,is_completed,target_date").eq("user_id", userId),
      supabase.from("daily_reflections").select("reflection_date,mood_rating,achievements,improvements,tomorrow_priority").eq("user_id", userId).gte("reflection_date", options.startDate).lte("reflection_date", options.endDate),
    ]);

    return {
      prayerLogs: (prayerRes.data ?? []).map((row) => ({
        prayer: row.prayer as PrayerName,
        date: row.date,
        status: row.status as AnalyticsPrayerLog["status"],
      })),
      habits: (habitRes.data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        isActive: row.is_active,
        startDate: row.start_date ?? undefined,
        frequency: row.frequency,
      })),
      habitLogs: (habitLogRes.data ?? []).map((row) => ({
        habitId: row.habit_id,
        date: row.date,
        completed: row.completed,
      })),
      tasks: (taskRes.data ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        status: row.status,
        subjectId: row.subject_id,
        dueDate: row.due_date,
        completedAt: row.completed_at,
        createdAt: row.created_at,
        estimatedMinutes: row.estimated_minutes,
      })),
      subjects: (subjectRes.data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        color: row.color,
        weeklyTargetMinutes: row.weekly_target_minutes,
        isArchived: row.is_archived,
      })),
      focusSessions: (focusRes.data ?? []).map((row) => ({
        id: row.id,
        startedAt: row.started_at,
        actualMinutes: row.actual_minutes,
        plannedMinutes: row.planned_minutes,
        status: row.status,
        subjectId: row.subject_id,
      })),
      quranSessions: (quranRes.data ?? []).map((row) => ({
        surahNumber: row.surah_number,
        startAyah: row.start_ayah,
        endAyah: row.end_ayah,
        minutesRead: row.minutes_read,
        readingDate: row.reading_date,
      })),
      dhikrSessions: (dhikrRes.data ?? []).map((row) => ({
        dhikrId: row.dhikr_id,
        completedCount: row.completed_count,
        targetCount: row.target_count,
        startedAt: row.started_at,
        status: row.status,
      })),
      productivityGoals: (goalRes.data ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        category: row.category,
        targetValue: row.target_value,
        currentValue: row.current_value,
        isCompleted: row.is_completed,
        deadline: row.deadline,
      })),
      spiritualGoals: (spiritualRes.data ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        type: row.type,
        targetValue: row.target_value,
        currentValue: row.current_value,
        isCompleted: row.is_completed,
        deadline: row.target_date,
      })),
      reflections: (reflectionRes.data ?? []).map((row) => ({
        reflectionDate: row.reflection_date,
        moodRating: row.mood_rating,
        achievements: row.achievements,
        improvements: row.improvements,
        tomorrowPriority: row.tomorrow_priority,
      })),
    };
  } catch {
    return null;
  }
}

export function mergeSnapshots(base: AnalyticsSnapshot, remote: Partial<AnalyticsSnapshot> | null): AnalyticsSnapshot {
  if (!remote) return base;
  return {
    ...base,
    prayerLogs: remote.prayerLogs !== undefined ? remote.prayerLogs : base.prayerLogs,
    habits: remote.habits !== undefined ? remote.habits : base.habits,
    habitLogs: remote.habitLogs !== undefined ? remote.habitLogs : base.habitLogs,
    tasks: remote.tasks !== undefined ? remote.tasks : base.tasks,
    subjects: remote.subjects !== undefined ? remote.subjects : base.subjects,
    focusSessions: remote.focusSessions !== undefined ? remote.focusSessions : base.focusSessions,
    quranSessions: remote.quranSessions !== undefined ? remote.quranSessions : base.quranSessions,
    dhikrSessions: remote.dhikrSessions !== undefined ? remote.dhikrSessions : base.dhikrSessions,
    productivityGoals: remote.productivityGoals !== undefined ? remote.productivityGoals : base.productivityGoals,
    spiritualGoals: remote.spiritualGoals !== undefined ? remote.spiritualGoals : base.spiritualGoals,
    reflections: remote.reflections !== undefined ? remote.reflections : base.reflections,
  };
}
