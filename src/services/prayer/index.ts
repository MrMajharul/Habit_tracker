import { AdhanPrayerProvider } from "./adhan-prayer-provider";
import { MockPrayerProvider } from "./mock-prayer-provider";
import type { PrayerTimeProvider } from "./prayer-service.interface";
import type { PrayerDaySummary, PrayerName, PrayerSettings } from "./types";

let provider: PrayerTimeProvider = new AdhanPrayerProvider();

export function setPrayerProvider(nextProvider: PrayerTimeProvider) {
  provider = nextProvider;
}

export async function getPrayerDaySummary(
  settings?: Partial<PrayerSettings>,
  date?: Date,
  completedPrayers?: PrayerName[],
): Promise<PrayerDaySummary> {
  const resolvedSettings: PrayerSettings = {
    latitude: 23.8103,
    longitude: 90.4125,
    timezone: "Asia/Dhaka",
    calculationMethod: "karachi",
    asrMadhhab: "standard",
    manualOffsetMinutes: 0,
    city: "Dhaka",
    country: "Bangladesh",
    ...settings,
  };

  try {
    return await provider.getPrayerTimes(resolvedSettings, date, completedPrayers);
  } catch (error) {
    console.warn("Prayer provider calculation failed, falling back to mock provider:", error);
    const mock = new MockPrayerProvider();
    return mock.getPrayerTimes(resolvedSettings, date, completedPrayers);
  }
}

export { AdhanPrayerProvider, MockPrayerProvider };
export type { PrayerDaySummary, PrayerName, PrayerSettings, PrayerTime } from "./types";
