import { isDevAuthBypass, isSupabaseConfigured } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type {
  DashboardHabit,
  DashboardTask,
  ProgressOverview,
  UserProfile,
} from "@/types";

import {
  MOCK_HABITS,
  MOCK_PROFILE,
  MOCK_PROGRESS,
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
  if (!isSupabaseConfigured || isDevAuthBypass) {
    return {
      profile: MOCK_PROFILE,
      habits: MOCK_HABITS,
      tasks: MOCK_TASKS,
      progress: MOCK_PROGRESS,
      isMockData: true,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      profile: MOCK_PROFILE,
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

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = data as ProfileRow | null;

  return {
    profile: {
      id: user.id,
      name: profile?.name ?? user.email?.split("@")[0] ?? "Muslim",
      email: user.email ?? "",
      country: profile?.country ?? undefined,
      city: profile?.city ?? undefined,
      timezone: profile?.timezone ?? "UTC",
      preferredLanguage: (profile?.preferred_language as "en" | "bn") ?? "en",
    },
    habits: MOCK_HABITS,
    tasks: MOCK_TASKS,
    progress: MOCK_PROGRESS,
    isMockData: true,
  };
}
