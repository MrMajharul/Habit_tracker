import { isDevAuthBypass, isSupabaseConfigured } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import {
  INITIAL_HABITS,
  toDashboardHabit,
} from "@/services/habits/habit-service";
import type { Database } from "@/types/database";
import type {
  DashboardHabit,
  DashboardTask,
  ProgressOverview,
  UserProfile,
} from "@/types";

import {
  MOCK_PROFILE,
  MOCK_TASKS,
} from "./mock-dashboard-data";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export interface DashboardData {
  profile: UserProfile;
  habits: DashboardHabit[];
  tasks: DashboardTask[];
  progress: ProgressOverview;
  isMockData: boolean;
}

export async function getDashboardData(): Promise<DashboardData> {
  const initialDashboardHabits = INITIAL_HABITS.map(toDashboardHabit);
  const completedHabits = initialDashboardHabits.filter((h) => h.completed).length;

  const defaultProgress: ProgressOverview = {
    habitsCompleted: completedHabits,
    habitsTotal: initialDashboardHabits.length,
    tasksCompleted: MOCK_TASKS.filter((t) => t.status === "completed").length,
    tasksTotal: MOCK_TASKS.length,
    prayersCompleted: 2,
    prayersTotal: 5,
    focusMinutesToday: 75,
  };

  if (!isSupabaseConfigured || isDevAuthBypass) {
    return {
      profile: MOCK_PROFILE,
      habits: initialDashboardHabits,
      tasks: MOCK_TASKS,
      progress: defaultProgress,
      isMockData: false,
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        profile: {
          id: "anonymous",
          name: "Muslim",
          email: "",
          country: undefined,
          city: undefined,
          timezone: "Asia/Dhaka",
          preferredLanguage: "en",
        },
        habits: [],
        tasks: [],
        progress: {
          habitsCompleted: 0,
          habitsTotal: 0,
          tasksCompleted: 0,
          tasksTotal: 0,
          prayersCompleted: 0,
          prayersTotal: 5,
          focusMinutesToday: 0,
        },
        isMockData: false,
      };
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // Parallelize all 6 independent queries with specific column selection
    const [
      { data: profileData },
      { data: dbHabits },
      { data: todayHabitLogs },
      { data: dbTasks },
      { data: prayerLogs },
      { data: todayFocus },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, name, country, city, timezone, preferred_language")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("habits")
        .select("id, name, icon, category, target_value, target_unit, prayer_anchor")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true }),
      supabase
        .from("habit_logs")
        .select("habit_id")
        .eq("user_id", user.id)
        .eq("date", todayStr)
        .eq("completed", true),
      supabase
        .from("tasks")
        .select("id, title, subject_id, status, due_date, estimated_minutes, priority")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("prayer_logs")
        .select("prayer")
        .eq("user_id", user.id)
        .eq("date", todayStr)
        .eq("status", "completed"),
      supabase
        .from("focus_sessions")
        .select("actual_minutes")
        .eq("user_id", user.id)
        .eq("status", "COMPLETED")
        .gte("started_at", `${todayStr}T00:00:00.000Z`),
    ]);

    const profile = profileData as ProfileRow | null;

    const completedHabitIds = new Set((todayHabitLogs || []).map((l) => l.habit_id));

    const userHabits: DashboardHabit[] =
      dbHabits && dbHabits.length > 0
        ? dbHabits.map((h) => ({
            id: h.id,
            name: h.name,
            icon: h.icon,
            category: (h.category as DashboardHabit["category"]) || "personal",
            completed: completedHabitIds.has(h.id),
            target: h.target_value ? `${h.target_value} ${h.target_unit || ""}`.trim() : undefined,
            prayerAnchor: (h.prayer_anchor as DashboardHabit["prayerAnchor"]) || "none",
          }))
        : [];

    const userTasks: DashboardTask[] =
      dbTasks && dbTasks.length > 0
        ? dbTasks.map((t) => ({
            id: t.id,
            title: t.title,
            subject: t.subject_id || undefined,
            status: (t.status?.toLowerCase() === "completed" ? "completed" : "todo") as DashboardTask["status"],
            dueDate: t.due_date || undefined,
            estimatedMinutes: t.estimated_minutes ?? undefined,
            priority: (t.priority?.toLowerCase() as DashboardTask["priority"]) || "medium",
          }))
        : [];

    const prayersCompleted = (prayerLogs || []).length;

    const focusMinutesToday = (todayFocus || []).reduce(
      (sum, s) => sum + (s.actual_minutes || 0),
      0,
    );

    return {
      profile: {
        id: user.id,
        name:
          profile?.name ||
          (user.user_metadata?.name as string) ||
          (user.user_metadata?.full_name as string) ||
          user.email?.split("@")[0] ||
          "Muslim",
        email: user.email ?? "",
        country: profile?.country ?? undefined,
        city: profile?.city ?? undefined,
        timezone: profile?.timezone ?? "Asia/Dhaka",
        preferredLanguage: (profile?.preferred_language as "en" | "bn") ?? "en",
      },
      habits: userHabits,
      tasks: userTasks,
      progress: {
        habitsTotal: userHabits.length,
        habitsCompleted: userHabits.filter((h) => h.completed).length,
        tasksTotal: userTasks.length,
        tasksCompleted: userTasks.filter((t) => t.status === "completed").length,
        prayersTotal: 5,
        prayersCompleted,
        focusMinutesToday,
      },
      isMockData: false,
    };
  } catch (err) {
    console.warn("Failed to load server dashboard data, returning offline state:", err);
    return {
      profile: {
        id: "offline",
        name: "Muslim",
        email: "",
        country: undefined,
        city: undefined,
        timezone: "Asia/Dhaka",
        preferredLanguage: "en",
      },
      habits: [],
      tasks: [],
      progress: {
        habitsCompleted: 0,
        habitsTotal: 0,
        tasksCompleted: 0,
        tasksTotal: 0,
        prayersCompleted: 0,
        prayersTotal: 5,
        focusMinutesToday: 0,
      },
      isMockData: false,
    };
  }
}
