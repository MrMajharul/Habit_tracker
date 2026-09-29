"use client";

/**
 * Purges all cached user-specific data from localStorage upon sign-out
 * or when switching between accounts, ensuring complete account isolation.
 */
export function clearUserLocalData(): void {
  if (typeof window === "undefined") return;

  try {
    const knownKeys = [
      "istiqamaah_subjects_data",
      "istiqamaah_tasks_data",
      "istiqamaah_focus_sessions",
      "istiqamaah_habits_data",
      "istiqamaah_habit_logs",
      "legacy_istiqamah_habit_logs",
      "istiqamaah_user_goals",
      "noorpath_user_goals",
      "istiqamaah_dhikr_favorites",
      "istiqamaah_dhikr_sessions",
      "istiqamaah_ramadan_settings",
      "istiqamaah_ramadan_daily_logs",
      "istiqamaah_ramadan_goals",
      "istiqamaah_quran_sessions",
      "istiqamaah_quran_reading_position",
      "istiqamaah_quran_bookmarks",
      "istiqamaah_quran_goal_settings",
      "istiqamaah_spiritual_goals",
      "istiqamaah_prayer_settings",
      "noorpath_prayer_settings",
      "istiqamaah_daily_reflection",
      "noorpath_daily_reflection",
      "istiqamaah_analytics_snapshot_cache",
    ];

    for (const key of knownKeys) {
      localStorage.removeItem(key);
    }

    // Dynamic prefix sweep
    const allKeys = Object.keys(localStorage);
    for (const key of allKeys) {
      if (
        key !== "istiqamaah_active_user_id" &&
        (key.startsWith("istiqamaah_") ||
          key.startsWith("noorpath_") ||
          key.startsWith("prayer_"))
      ) {
        localStorage.removeItem(key);
      }
    }
  } catch (err) {
    console.warn("Failed to clear local user cache:", err);
  }
}

const ACTIVE_USER_KEY = "istiqamaah_active_user_id";

/**
 * Ensures that if the logged-in user changes (e.g. User A signs out and User B signs in,
 * or guest signs into a new account), all stale data from the previous account is purged.
 */
export function syncActiveUser(currentUserId: string | null): void {
  if (typeof window === "undefined") return;
  try {
    const previousUserId = localStorage.getItem(ACTIVE_USER_KEY);
    if (currentUserId) {
      if (previousUserId !== currentUserId) {
        clearUserLocalData();
        localStorage.setItem(ACTIVE_USER_KEY, currentUserId);
      }
    } else if (previousUserId) {
      clearUserLocalData();
      localStorage.removeItem(ACTIVE_USER_KEY);
    }
  } catch (err) {
    console.warn("Failed to sync active user:", err);
  }
}
