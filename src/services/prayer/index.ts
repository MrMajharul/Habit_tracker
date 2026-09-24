import { MockPrayerProvider } from "./mock-prayer-provider";
import type { PrayerTimeProvider } from "./prayer-service.interface";
import type { PrayerDaySummary, PrayerSettings } from "./types";

let provider: PrayerTimeProvider = new MockPrayerProvider();

export function setPrayerProvider(nextProvider: PrayerTimeProvider) {
  provider = nextProvider;
}

export async function getPrayerDaySummary(
  settings?: Partial<PrayerSettings>,
  date?: Date,
): Promise<PrayerDaySummary> {
  const resolvedSettings: PrayerSettings = {
    latitude: 23.8103,
    longitude: 90.4125,
    timezone: "Asia/Dhaka",
    calculationMethod: "karachi",
    asrMadhhab: "standard",
    manualOffsetMinutes: 0,
    ...settings,
  };

  return provider.getPrayerTimes(resolvedSettings, date);
}

export type { PrayerDaySummary, PrayerName, PrayerSettings, PrayerTime } from "./types";
