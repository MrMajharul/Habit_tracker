import type { PrayerDaySummary, PrayerSettings } from "./types";

export interface PrayerTimeProvider {
  getPrayerTimes(settings: PrayerSettings, date?: Date): Promise<PrayerDaySummary>;
}
