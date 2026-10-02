import { isDevAuthBypass, isSupabaseConfigured } from "@/lib/constants";
import { enqueueOfflineAction } from "@/lib/offline/offline-sync-queue";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

export type ReminderType =
  | "salah"
  | "quran"
  | "dhikr"
  | "habit"
  | "study"
  | "custom";

export type RepeatType = "once" | "daily" | "weekdays" | "custom_days";

export interface UserReminder {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  reminderType: ReminderType;
  time: string; // "HH:mm" in 24h
  repeatType: RepeatType;
  daysOfWeek: number[]; // 0 = Sun, 6 = Sat
  isEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  targetUrl: string;
  createdAt: string;
  updatedAt: string;
}

const LOCAL_STORAGE_PREFIX = "istiqamaah_reminders_";

export const DEFAULT_PRESET_REMINDERS: Omit<
  UserReminder,
  "id" | "userId" | "createdAt" | "updatedAt"
>[] = [
  {
    title: "Morning Adhkar",
    description: "Start the day with remembrance of Allah",
    reminderType: "dhikr",
    time: "06:30",
    repeatType: "daily",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    isEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    targetUrl: "/dhikr",
  },
  {
    title: "Daily Qur'an Reading",
    description: "Dedicate 15 minutes to reflect on the verses",
    reminderType: "quran",
    time: "17:00",
    repeatType: "daily",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    isEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    targetUrl: "/quran",
  },
  {
    title: "Evening Adhkar",
    description: "Protection and gratitude before Maghrib",
    reminderType: "dhikr",
    time: "18:00",
    repeatType: "daily",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    isEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    targetUrl: "/dhikr",
  },
  {
    title: "Habit & Night Reflection",
    description: "Review your habits and daily goals",
    reminderType: "habit",
    time: "21:30",
    repeatType: "daily",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    isEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    targetUrl: "/habits",
  },
];

function getStorageKey(userId: string): string {
  return `${LOCAL_STORAGE_PREFIX}${userId}`;
}

function getLocalReminders(userId: string): UserReminder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalReminders(userId: string, reminders: UserReminder[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(reminders));
  } catch {
    // Ignore storage quota
  }
}

/**
 * Checks if a reminder should trigger today based on its repeat type and days of week
 */
export function isReminderActiveForDate(
  reminder: UserReminder,
  date = new Date(),
): boolean {
  if (!reminder.isEnabled) return false;

  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

  switch (reminder.repeatType) {
    case "once":
      return true;
    case "daily":
      return true;
    case "weekdays":
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case "custom_days":
      return reminder.daysOfWeek.includes(dayOfWeek);
    default:
      return false;
  }
}

/**
 * Verifies whether quiet hours should suppress this reminder
 */
export function isSuppressedByQuietHours(
  reminderTime: string,
  quietHours: { enabled: boolean; start: string; end: string },
): boolean {
  if (!quietHours.enabled) return false;

  const [remH, remM] = reminderTime.split(":").map(Number);
  const [startH, startM] = quietHours.start.split(":").map(Number);
  const [endH, endM] = quietHours.end.split(":").map(Number);

  const remMinutes = remH * 60 + remM;
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes > endMinutes) {
    // Overnight quiet hours, e.g. 23:00 to 05:00
    return remMinutes >= startMinutes || remMinutes <= endMinutes;
  }
  return remMinutes >= startMinutes && remMinutes <= endMinutes;
}

export class ReminderService {
  /**
   * Fetches all user reminders with offline caching
   */
  async getReminders(userId?: string): Promise<UserReminder[]> {
    const targetUserId = userId || "dev-user-local";

    if (!isSupabaseConfigured || isDevAuthBypass) {
      const local = getLocalReminders(targetUserId);
      if (local.length > 0) return local;

      // Initialize with default presets on first run
      const defaults: UserReminder[] = DEFAULT_PRESET_REMINDERS.map(
        (p, idx) => ({
          ...p,
          id: `preset-${idx + 1}`,
          userId: targetUserId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      );
      saveLocalReminders(targetUserId, defaults);
      return defaults;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("user_reminders")
        .select("*")
        .order("time", { ascending: true });

      if (error || !data) {
        return getLocalReminders(targetUserId);
      }

      const reminders: UserReminder[] = data.map((row) => ({
        id: row.id,
        userId: row.user_id,
        title: row.title,
        description: row.description,
        reminderType: row.reminder_type as ReminderType,
        time: row.time,
        repeatType: row.repeat_type as RepeatType,
        daysOfWeek: row.days_of_week || [0, 1, 2, 3, 4, 5, 6],
        isEnabled: row.is_enabled,
        soundEnabled: row.sound_enabled,
        vibrationEnabled: row.vibration_enabled,
        targetUrl: row.target_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      saveLocalReminders(targetUserId, reminders);
      return reminders;
    } catch {
      return getLocalReminders(targetUserId);
    }
  }

  /**
   * Creates a new user reminder
   */
  async createReminder(
    reminderInput: Omit<UserReminder, "id" | "createdAt" | "updatedAt">,
  ): Promise<UserReminder> {
    const newReminder: UserReminder = {
      ...reminderInput,
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `rem-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update local cache optimistically
    const existing = getLocalReminders(newReminder.userId);
    const updated = [...existing, newReminder];
    saveLocalReminders(newReminder.userId, updated);

    if (isSupabaseConfigured && !isDevAuthBypass) {
      try {
        const supabase = createClient();
        const insertPayload: Database["public"]["Tables"]["user_reminders"]["Insert"] = {
          id: newReminder.id,
          user_id: newReminder.userId,
          title: newReminder.title,
          description: newReminder.description,
          reminder_type: newReminder.reminderType,
          time: newReminder.time,
          repeat_type: newReminder.repeatType,
          days_of_week: newReminder.daysOfWeek,
          is_enabled: newReminder.isEnabled,
          sound_enabled: newReminder.soundEnabled,
          vibration_enabled: newReminder.vibrationEnabled,
          target_url: newReminder.targetUrl,
        };
        await supabase.from("user_reminders").insert(insertPayload);
      } catch {
        // Enqueue offline action if network error
        enqueueOfflineAction({
          type: "create_reminder",
          payload: newReminder,
        });
      }
    }

    return newReminder;
  }

  /**
   * Updates an existing reminder
   */
  async updateReminder(
    id: string,
    updates: Partial<UserReminder>,
    userId = "dev-user-local",
  ): Promise<UserReminder> {
    const existing = getLocalReminders(userId);
    const index = existing.findIndex((r) => r.id === id);

    if (index === -1) {
      throw new Error(`Reminder ${id} not found.`);
    }

    const updatedItem: UserReminder = {
      ...existing[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    existing[index] = updatedItem;
    saveLocalReminders(userId, existing);

    if (isSupabaseConfigured && !isDevAuthBypass) {
      try {
        const supabase = createClient();
        const payload: Database["public"]["Tables"]["user_reminders"]["Update"] = {
          updated_at: updatedItem.updatedAt,
        };
        if (updates.title !== undefined) payload.title = updates.title;
        if (updates.description !== undefined) payload.description = updates.description;
        if (updates.reminderType !== undefined) payload.reminder_type = updates.reminderType;
        if (updates.time !== undefined) payload.time = updates.time;
        if (updates.repeatType !== undefined) payload.repeat_type = updates.repeatType;
        if (updates.daysOfWeek !== undefined) payload.days_of_week = updates.daysOfWeek;
        if (updates.isEnabled !== undefined) payload.is_enabled = updates.isEnabled;
        if (updates.soundEnabled !== undefined) payload.sound_enabled = updates.soundEnabled;
        if (updates.vibrationEnabled !== undefined) payload.vibration_enabled = updates.vibrationEnabled;
        if (updates.targetUrl !== undefined) payload.target_url = updates.targetUrl;

        await supabase.from("user_reminders").update(payload).eq("id", id);
      } catch {
        enqueueOfflineAction({
          type: "update_reminder",
          payload: { id, updates },
        });
      }
    }

    return updatedItem;
  }

  /**
   * Deletes a reminder
   */
  async deleteReminder(id: string, userId = "dev-user-local"): Promise<boolean> {
    const existing = getLocalReminders(userId);
    const filtered = existing.filter((r) => r.id !== id);
    saveLocalReminders(userId, filtered);

    if (isSupabaseConfigured && !isDevAuthBypass) {
      try {
        const supabase = createClient();
        await supabase.from("user_reminders").delete().eq("id", id);
      } catch {
        enqueueOfflineAction({
          type: "delete_reminder",
          payload: { id },
        });
      }
    }

    return true;
  }

  /**
   * Helper to toggle reminder on/off
   */
  async toggleReminder(
    id: string,
    isEnabled: boolean,
    userId = "dev-user-local",
  ): Promise<UserReminder> {
    return this.updateReminder(id, { isEnabled }, userId);
  }
}

export const reminderService = new ReminderService();
