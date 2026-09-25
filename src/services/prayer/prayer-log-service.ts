import { format } from "date-fns";

import { isDevAuthBypass, isSupabaseConfigured } from "@/lib/constants";
import { enqueueOfflineAction } from "@/lib/offline/offline-sync-queue";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import type { PrayerName } from "./types";

const PRAYER_LOGS_PREFIX = "istiqamaah_prayer_logs_";
const LEGACY_PRAYER_LOGS_PREFIX = "noorpath_prayer_logs_";

export function getTodayDateString(d = new Date()): string {
  return format(d, "yyyy-MM-dd");
}

export function getLocalPrayerLogs(dateStr = getTodayDateString()): Record<PrayerName, boolean> {
  const fallback: Record<PrayerName, boolean> = {
    fajr: false,
    dhuhr: false,
    asr: false,
    maghrib: false,
    isha: false,
  };

  if (typeof window === "undefined") return fallback;

  try {
    const raw =
      localStorage.getItem(`${PRAYER_LOGS_PREFIX}${dateStr}`) ??
      localStorage.getItem(`${LEGACY_PRAYER_LOGS_PREFIX}${dateStr}`);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

export function setLocalPrayerLogs(
  dateStr: string,
  logs: Record<PrayerName, boolean>,
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${PRAYER_LOGS_PREFIX}${dateStr}`, JSON.stringify(logs));
  } catch {
    // Ignore storage quota
  }
}

export async function fetchPrayerLogs(
  dateStr = getTodayDateString(),
): Promise<Record<PrayerName, boolean>> {
  const local = getLocalPrayerLogs(dateStr);

  if (!isSupabaseConfigured || isDevAuthBypass) {
    return local;
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return local;

    const { data, error } = await supabase
      .from("prayer_logs")
      .select("prayer, status")
      .eq("user_id", user.id)
      .eq("date", dateStr);

    if (error || !data) return local;

    const remoteLogs = { ...local };
    for (const row of data) {
      const p = row.prayer as PrayerName;
      remoteLogs[p] = row.status === "completed";
    }

    setLocalPrayerLogs(dateStr, remoteLogs);
    return remoteLogs;
  } catch {
    return local;
  }
}

export async function togglePrayerCompletion(
  prayer: PrayerName,
  completed: boolean,
  dateStr = getTodayDateString(),
): Promise<void> {
  // 1. Optimistic Local Save
  const current = getLocalPrayerLogs(dateStr);
  current[prayer] = completed;
  setLocalPrayerLogs(dateStr, current);

  // 2. Offline check
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    enqueueOfflineAction({
      type: "LOG_PRAYER",
      payload: { prayer, completed, dateStr },
    });
    return;
  }

  if (!isSupabaseConfigured || isDevAuthBypass) {
    return;
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    if (completed) {
      const row: Database["public"]["Tables"]["prayer_logs"]["Insert"] = {
        user_id: user.id,
        prayer,
        date: dateStr,
        status: "completed",
        completed_at: new Date().toISOString(),
      };

      await supabase
        .from("prayer_logs")
        .upsert(row, { onConflict: "user_id,prayer,date" });
    } else {
      await supabase
        .from("prayer_logs")
        .delete()
        .eq("user_id", user.id)
        .eq("prayer", prayer)
        .eq("date", dateStr);
    }
  } catch (err) {
    console.warn("Failed to sync prayer log to Supabase, queuing offline:", err);
    enqueueOfflineAction({
      type: "LOG_PRAYER",
      payload: { prayer, completed, dateStr },
    });
  }
}
