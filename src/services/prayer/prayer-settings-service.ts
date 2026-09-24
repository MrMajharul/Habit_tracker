import { isDevAuthBypass, isSupabaseConfigured } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import type { PrayerSettings } from "./types";

export const PRAYER_SETTINGS_STORAGE_KEY = "noorpath_prayer_settings";

export const DEFAULT_PRAYER_SETTINGS: PrayerSettings = {
  latitude: 23.8103,
  longitude: 90.4125,
  city: "Dhaka",
  country: "Bangladesh",
  timezone: "Asia/Dhaka",
  calculationMethod: "karachi",
  asrMadhhab: "standard",
  manualOffsetMinutes: 0,
  fajrAdjustment: 0,
  sunriseAdjustment: 0,
  dhuhrAdjustment: 0,
  asrAdjustment: 0,
  maghribAdjustment: 0,
  ishaAdjustment: 0,
};

export function getLocalPrayerSettings(): PrayerSettings {
  if (typeof window === "undefined") return DEFAULT_PRAYER_SETTINGS;

  try {
    const raw = localStorage.getItem(PRAYER_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_PRAYER_SETTINGS;
    return { ...DEFAULT_PRAYER_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PRAYER_SETTINGS;
  }
}

export function saveLocalPrayerSettings(settings: PrayerSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PRAYER_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota errors
  }
}

export async function fetchUserPrayerSettings(): Promise<PrayerSettings> {
  const local = getLocalPrayerSettings();

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
      .from("prayer_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data) {
      return local;
    }

    const merged: PrayerSettings = {
      latitude: data.latitude,
      longitude: data.longitude,
      city: data.city,
      country: data.country,
      timezone: data.timezone,
      calculationMethod: data.calculation_method,
      asrMadhhab: (data.madhhab as "standard" | "hanafi") || "standard",
      manualOffsetMinutes: data.manual_offset_minutes,
      fajrAdjustment: data.fajr_adjustment,
      sunriseAdjustment: data.sunrise_adjustment,
      dhuhrAdjustment: data.dhuhr_adjustment,
      asrAdjustment: data.asr_adjustment,
      maghribAdjustment: data.maghrib_adjustment,
      ishaAdjustment: data.isha_adjustment,
    };

    saveLocalPrayerSettings(merged);
    return merged;
  } catch {
    return local;
  }
}

export async function saveUserPrayerSettings(
  settings: PrayerSettings,
): Promise<void> {
  // Always persist locally first
  saveLocalPrayerSettings(settings);

  if (!isSupabaseConfigured || isDevAuthBypass) {
    return;
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const row: Database["public"]["Tables"]["prayer_settings"]["Insert"] = {
      user_id: user.id,
      latitude: settings.latitude,
      longitude: settings.longitude,
      city: settings.city || "Current Location",
      country: settings.country || "Global",
      timezone: settings.timezone || "UTC",
      calculation_method: settings.calculationMethod,
      madhhab: settings.asrMadhhab,
      manual_offset_minutes: settings.manualOffsetMinutes,
      fajr_adjustment: settings.fajrAdjustment || 0,
      sunrise_adjustment: settings.sunriseAdjustment || 0,
      dhuhr_adjustment: settings.dhuhrAdjustment || 0,
      asr_adjustment: settings.asrAdjustment || 0,
      maghrib_adjustment: settings.maghribAdjustment || 0,
      isha_adjustment: settings.ishaAdjustment || 0,
      updated_at: new Date().toISOString(),
    };

    await supabase
      .from("prayer_settings")
      .upsert(row, { onConflict: "user_id" });
  } catch (err) {
    console.warn("Failed to sync prayer settings to Supabase:", err);
  }
}

export async function requestBrowserGeolocation(): Promise<{
  latitude: number;
  longitude: number;
  timezone: string;
} | null> {
  if (typeof window === "undefined" || !("geolocation" in navigator)) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: Number(pos.coords.latitude.toFixed(4)),
          longitude: Number(pos.coords.longitude.toFixed(4)),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        });
      },
      () => {
        // Geolocation denied or unavailable
        resolve(null);
      },
      { timeout: 8000, maximumAge: 3600000 },
    );
  });
}
