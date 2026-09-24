import { addDays, setHours, setMinutes, setSeconds, startOfDay } from "date-fns";

import type { PrayerTimeProvider } from "./prayer-service.interface";
import type {
  PrayerDaySummary,
  PrayerName,
  PrayerSettings,
  PrayerTime,
} from "./types";

const PRAYER_LABELS: Record<PrayerName, string> = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

/** Mock schedule — replace with live API provider in Phase 2 */
const MOCK_SCHEDULE: Record<PrayerName, { hour: number; minute: number }> = {
  fajr: { hour: 5, minute: 15 },
  dhuhr: { hour: 12, minute: 30 },
  asr: { hour: 16, minute: 45 },
  maghrib: { hour: 18, minute: 20 },
  isha: { hour: 19, minute: 45 },
};

const MOCK_COMPLETED: PrayerName[] = ["fajr", "dhuhr"];

function buildPrayerTime(
  name: PrayerName,
  baseDate: Date,
  offsetMinutes: number,
): PrayerTime {
  const schedule = MOCK_SCHEDULE[name];
  let time = startOfDay(baseDate);
  time = setHours(time, schedule.hour);
  time = setMinutes(time, schedule.minute);
  time = setSeconds(time, 0);
  time = new Date(time.getTime() + offsetMinutes * 60_000);

  return {
    name,
    label: PRAYER_LABELS[name],
    time,
    completed: MOCK_COMPLETED.includes(name),
    notificationsEnabled: true,
  };
}

function resolveNextPrayer(prayers: PrayerTime[], now: Date): PrayerTime | null {
  const upcoming = prayers.find((prayer) => prayer.time > now);
  if (upcoming) return upcoming;

  return prayers[0] ?? null;
}

export class MockPrayerProvider implements PrayerTimeProvider {
  async getPrayerTimes(
    settings: PrayerSettings,
    date = new Date(),
  ): Promise<PrayerDaySummary> {
    const names = Object.keys(MOCK_SCHEDULE) as PrayerName[];
    const prayers = names.map((name) =>
      buildPrayerTime(name, date, settings.manualOffsetMinutes),
    );

    const now = new Date();
    let nextPrayer = resolveNextPrayer(prayers, now);

    if (nextPrayer && nextPrayer.time <= now) {
      const tomorrow = addDays(date, 1);
      const tomorrowFajr = buildPrayerTime(
        "fajr",
        tomorrow,
        settings.manualOffsetMinutes,
      );
      nextPrayer = tomorrowFajr;
    }

    return {
      date,
      prayers,
      nextPrayer,
      location: {
        city: settings.timezone.includes("Dhaka") ? "Dhaka" : "Your City",
        country: "Bangladesh",
      },
      isMockData: true,
    };
  }
}
