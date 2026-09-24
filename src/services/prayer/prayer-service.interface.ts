import type { PrayerDaySummary, PrayerName, PrayerSettings } from "./types";

export interface PrayerTimeProvider {
  getPrayerTimes(
    settings: PrayerSettings,
    date?: Date,
    completedPrayers?: PrayerName[],
  ): Promise<PrayerDaySummary>;
}
