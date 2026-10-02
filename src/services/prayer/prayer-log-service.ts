import { format, parse } from "date-fns";

import { isDevAuthBypass, isSupabaseConfigured } from "@/lib/constants";
import { enqueueOfflineAction } from "@/lib/offline/offline-sync-queue";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import type { PrayerName } from "./types";
import { AdhanPrayerProvider } from "./adhan-prayer-provider";
import { getLocalPrayerSettings } from "./prayer-settings-service";

const PRAYER_LOGS_PREFIX = "istiqamaah_prayer_logs_";
const LEGACY_PRAYER_LOGS_PREFIX = "noorpath_prayer_logs_";

export function getTodayDateString(d = new Date()): string {
  return format(d, "yyyy-MM-dd");
}

export function getLocalPrayerLogs(
  dateStr = getTodayDateString(),
  userId?: string,
): Record<PrayerName, boolean> {
  const fallback: Record<PrayerName, boolean> = {
    fajr: false,
    dhuhr: false,
    asr: false,
    maghrib: false,
    isha: false,
  };

  if (typeof window === "undefined") return fallback;

  try {
    const key = userId
      ? `${PRAYER_LOGS_PREFIX}${userId}_${dateStr}`
      : `${PRAYER_LOGS_PREFIX}${dateStr}`;
    const raw =
      localStorage.getItem(key) ??
      (!userId ? localStorage.getItem(`${LEGACY_PRAYER_LOGS_PREFIX}${dateStr}`) : null);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

export function setLocalPrayerLogs(
  dateStr: string,
  logs: Record<PrayerName, boolean>,
  userId?: string,
): void {
  if (typeof window === "undefined") return;
  try {
    const key = userId
      ? `${PRAYER_LOGS_PREFIX}${userId}_${dateStr}`
      : `${PRAYER_LOGS_PREFIX}${dateStr}`;
    localStorage.setItem(key, JSON.stringify(logs));
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

    if (error || !data) return getLocalPrayerLogs(dateStr, user.id);

    const remoteLogs: Record<PrayerName, boolean> = {
      fajr: false,
      dhuhr: false,
      asr: false,
      maghrib: false,
      isha: false,
    };
    for (const row of data) {
      const p = row.prayer as PrayerName;
      if (p in remoteLogs) {
        remoteLogs[p] = row.status === "completed";
      }
    }

    setLocalPrayerLogs(dateStr, remoteLogs, user.id);
    return remoteLogs;
  } catch {
    return local;
  }
}

// ─── Prayer Timing Validation ───────────────────────────────────────────────
// Validates that a prayer can only be marked completed at or after its
// calculated start time. Uses the same prayer calculation engine (adhan)
// and user settings as the rest of the app.

export interface PrayerValidationResult {
  valid: boolean;
  reason?: string;
  prayerStartTime?: Date;
}

/**
 * Validates whether a prayer can be marked as completed at the given time.
 * Returns { valid: true } if the prayer's start time has arrived,
 * or { valid: false, reason: "..." } if it hasn't.
 *
 * Uncompleting (unmarking) a prayer is always allowed.
 */
export async function validatePrayerCompletion(
  prayer: PrayerName,
  completed: boolean,
  dateStr: string,
  now: Date = new Date(),
): Promise<PrayerValidationResult> {
  // Uncompleting is always allowed
  if (!completed) {
    return { valid: true };
  }

  try {
    const settings = getLocalPrayerSettings();
    const provider = new AdhanPrayerProvider();

    // Parse the date string to get the correct calendar day
    const targetDate = parse(dateStr, "yyyy-MM-dd", new Date());

    const summary = await provider.getPrayerTimes(settings, targetDate);
    const prayerData = summary.prayers.find((p) => p.name === prayer);

    if (!prayerData) {
      return { valid: false, reason: `Unknown prayer: ${prayer}` };
    }

    const prayerTime = prayerData.time instanceof Date
      ? prayerData.time
      : new Date(prayerData.time);

    if (now.getTime() < prayerTime.getTime()) {
      return {
        valid: false,
        reason: `${prayer} has not started yet. It begins at ${format(prayerTime, "HH:mm")}.`,
        prayerStartTime: prayerTime,
      };
    }

    return { valid: true, prayerStartTime: prayerTime };
  } catch (err) {
    // If prayer calculation fails entirely, log but allow the action
    // to avoid blocking the user due to a calculation error.
    // The UI-level check is the primary guard; this is the secondary guard.
    console.warn("Prayer time validation failed, allowing action:", err);
    return { valid: true };
  }
}

export async function togglePrayerCompletion(
  prayer: PrayerName,
  completed: boolean,
  dateStr = getTodayDateString(),
): Promise<void> {
  // ── Service-layer timing validation ──────────────────────────────────
  // Prevents marking a prayer complete before its calculated start time,
  // even if the UI check was bypassed.
  if (completed) {
    const validation = await validatePrayerCompletion(prayer, completed, dateStr);
    if (!validation.valid) {
      console.warn(`Prayer completion rejected: ${validation.reason}`);
      throw new Error(validation.reason || "Prayer time has not started yet.");
    }
  }

  let userId: string | undefined;
  if (isSupabaseConfigured && !isDevAuthBypass && typeof window !== "undefined") {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) userId = user.id;
    } catch {
      // Ignore
    }
  }

  // 1. Optimistic Local Save
  const current = getLocalPrayerLogs(dateStr, userId);
  current[prayer] = completed;
  setLocalPrayerLogs(dateStr, current, userId);

  // 2. Offline check
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    enqueueOfflineAction({
      type: "LOG_PRAYER",
      payload: { prayer, completed, dateStr, queuedAt: Date.now() },
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
      payload: { prayer, completed, dateStr, queuedAt: Date.now() },
    });
  }
}

