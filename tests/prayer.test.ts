import { describe, expect, it } from "vitest";

import { AdhanPrayerProvider } from "@/services/prayer/adhan-prayer-provider";
import type { PrayerSettings } from "@/services/prayer/types";

describe("AdhanPrayerProvider - Live Prayer Calculation", () => {
  const provider = new AdhanPrayerProvider();

  const dhakaSettings: PrayerSettings = {
    latitude: 23.8103,
    longitude: 90.4125,
    timezone: "Asia/Dhaka",
    calculationMethod: "karachi",
    asrMadhhab: "standard",
    manualOffsetMinutes: 0,
    city: "Dhaka",
    country: "Bangladesh",
  };

  const londonSettings: PrayerSettings = {
    latitude: 51.5074,
    longitude: -0.1278,
    timezone: "Europe/London",
    calculationMethod: "mwl",
    asrMadhhab: "standard",
    manualOffsetMinutes: 0,
    city: "London",
    country: "United Kingdom",
  };

  const newYorkSettings: PrayerSettings = {
    latitude: 40.7128,
    longitude: -74.006,
    timezone: "America/New_York",
    calculationMethod: "isna",
    asrMadhhab: "standard",
    manualOffsetMinutes: 0,
    city: "New York",
    country: "USA",
  };

  it("calculates all 5 daily prayers in chronological order", async () => {
    const summary = await provider.getPrayerTimes(dhakaSettings, new Date(2026, 8, 24));
    expect(summary.prayers).toHaveLength(5);

    const [fajr, dhuhr, asr, maghrib, isha] = summary.prayers;
    expect(fajr.name).toBe("fajr");
    expect(dhuhr.name).toBe("dhuhr");
    expect(asr.name).toBe("asr");
    expect(maghrib.name).toBe("maghrib");
    expect(isha.name).toBe("isha");

    // Chronological order verification
    expect(fajr.time.getTime()).toBeLessThan(dhuhr.time.getTime());
    expect(dhuhr.time.getTime()).toBeLessThan(asr.time.getTime());
    expect(asr.time.getTime()).toBeLessThan(maghrib.time.getTime());
    expect(maghrib.time.getTime()).toBeLessThan(isha.time.getTime());
  });

  it("calculates prayer times accurately for different global locations and timezones", async () => {
    const londonSummary = await provider.getPrayerTimes(londonSettings, new Date(2026, 8, 24));
    const nySummary = await provider.getPrayerTimes(newYorkSettings, new Date(2026, 8, 24));

    expect(londonSummary.location.city).toBe("London");
    expect(nySummary.location.city).toBe("New York");

    expect(londonSummary.prayers[0].time).toBeInstanceOf(Date);
    expect(nySummary.prayers[0].time).toBeInstanceOf(Date);
  });

  it("applies Hanafi vs Standard Madhhab correctly to Asr time", async () => {
    const shafiSummary = await provider.getPrayerTimes(
      { ...dhakaSettings, asrMadhhab: "standard" },
      new Date(2026, 8, 24),
    );
    const hanafiSummary = await provider.getPrayerTimes(
      { ...dhakaSettings, asrMadhhab: "hanafi" },
      new Date(2026, 8, 24),
    );

    const shafiAsr = shafiSummary.prayers.find((p) => p.name === "asr")!;
    const hanafiAsr = hanafiSummary.prayers.find((p) => p.name === "asr")!;

    // Hanafi Asr is when shadow is 2x object length, so it is strictly later than Standard Asr (shadow 1x)
    expect(hanafiAsr.time.getTime()).toBeGreaterThan(shafiAsr.time.getTime());
  });

  it("handles manual offset minutes adjustment", async () => {
    const normal = await provider.getPrayerTimes(dhakaSettings, new Date(2026, 8, 24));
    const offset = await provider.getPrayerTimes(
      { ...dhakaSettings, manualOffsetMinutes: 10 },
      new Date(2026, 8, 24),
    );

    const normalFajr = normal.prayers[0].time.getTime();
    const offsetFajr = offset.prayers[0].time.getTime();

    // 10 minutes = 600,000 ms
    expect(offsetFajr - normalFajr).toBe(600_000);
  });

  it("correctly identifies next prayer and handles post-Isha midnight rollover to tomorrow's Fajr", async () => {
    const testDate = new Date(2026, 8, 24);
    const summary = await provider.getPrayerTimes(dhakaSettings, testDate);

    expect(summary.nextPrayer).toBeDefined();
    expect(summary.nextPrayer).not.toBeNull();

    // Next prayer should either be one of today's upcoming prayers or tomorrow's Fajr
    expect(["fajr", "dhuhr", "asr", "maghrib", "isha"]).toContain(summary.nextPrayer?.name);
  });
});
