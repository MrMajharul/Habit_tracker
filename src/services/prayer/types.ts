export type PrayerName = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

export interface PrayerTime {
  name: PrayerName;
  label: string;
  time: Date;
  completed: boolean;
  notificationsEnabled: boolean;
}

export interface PrayerDaySummary {
  date: Date;
  prayers: PrayerTime[];
  nextPrayer: PrayerTime | null;
  location: {
    city: string;
    country: string;
  };
  /** Indicates data is from a mock provider, not live calculation */
  isMockData: boolean;
}

export interface PrayerSettings {
  latitude: number;
  longitude: number;
  timezone: string;
  calculationMethod: string;
  asrMadhhab: "standard" | "hanafi";
  manualOffsetMinutes: number;
}
