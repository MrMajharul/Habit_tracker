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
        profile: MOCK_PROFILE,
        habits: initialDashboardHabits,
        tasks: MOCK_TASKS,
        progress: defaultProgress,
        isMockData: false,
      };
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const profile = data as ProfileRow | null;

    // Fetch user's active habits
    const { data: dbHabits } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true);

    const userHabits: DashboardHabit[] =
      dbHabits && dbHabits.length > 0
        ? dbHabits.map((h) => ({
            id: h.id,
            name: h.name,
            icon: h.icon,
            category: (h.category as DashboardHabit["category"]) || "personal",
            completed: false,
            target: h.target_value ? `${h.target_value} ${h.target_unit || ""}`.trim() : undefined,
            prayerAnchor: (h.prayer_anchor as DashboardHabit["prayerAnchor"]) || "none",
          }))
        : initialDashboardHabits;

    return {
      profile: {
        id: user.id,
        name: profile?.name ?? user.email?.split("@")[0] ?? "Muslim",
        email: user.email ?? "",
        country: profile?.country ?? undefined,
        city: profile?.city ?? undefined,
        timezone: profile?.timezone ?? "Asia/Dhaka",
        preferredLanguage: (profile?.preferred_language as "en" | "bn") ?? "en",
      },
      habits: userHabits,
      tasks: MOCK_TASKS,
      progress: {
        ...defaultProgress,
        habitsTotal: userHabits.length,
        habitsCompleted: userHabits.filter((h) => h.completed).length,
      },
      isMockData: false,
    };
  } catch (err) {
    console.warn("Failed to load server dashboard data, returning offline state:", err);
    return {
      profile: MOCK_PROFILE,
      habits: initialDashboardHabits,
      tasks: MOCK_TASKS,
      progress: defaultProgress,
      isMockData: false,
    };
  }
}
