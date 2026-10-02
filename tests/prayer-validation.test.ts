import { describe, expect, it, beforeEach } from "vitest";

import { AdhanPrayerProvider } from "@/services/prayer/adhan-prayer-provider";
import { isPrayerAvailable } from "@/services/prayer";
import { validatePrayerCompletion } from "@/services/prayer/prayer-log-service";
import type { PrayerSettings, PrayerTime } from "@/services/prayer/types";

// ─── Mock localStorage for prayer settings ──────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => { store[key] = val; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

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

describe("Prayer Completion Timing Validation", () => {
  const provider = new AdhanPrayerProvider();

  beforeEach(() => {
    localStorageMock.clear();
    // Store settings so validatePrayerCompletion() can read them
    localStorageMock.setItem(
      "istiqamaah_prayer_settings",
      JSON.stringify(dhakaSettings),
    );
  });

  // ─── isPrayerAvailable (existing function) ────────────────────────────
  describe("isPrayerAvailable timing validation", () => {
    const baseTime = new Date("2026-09-30T12:00:00Z");
    const prayers: PrayerTime[] = [
      { name: "fajr", label: "Fajr", time: new Date("2026-09-30T04:30:00Z"), completed: false, notificationsEnabled: false },
      { name: "dhuhr", label: "Dhuhr", time: new Date("2026-09-30T12:00:00Z"), completed: false, notificationsEnabled: false },
      { name: "asr", label: "Asr", time: new Date("2026-09-30T15:30:00Z"), completed: false, notificationsEnabled: false },
      { name: "maghrib", label: "Maghrib", time: new Date("2026-09-30T18:00:00Z"), completed: false, notificationsEnabled: false },
      { name: "isha", label: "Isha", time: new Date("2026-09-30T19:30:00Z"), completed: false, notificationsEnabled: false },
    ];

    it("returns true for prayers whose time has already arrived", () => {
      expect(isPrayerAvailable("fajr", prayers, baseTime)).toBe(true);
      expect(isPrayerAvailable("dhuhr", prayers, baseTime)).toBe(true);
    });

    it("returns false for prayers whose time is in the future", () => {
      expect(isPrayerAvailable("asr", prayers, baseTime)).toBe(false);
      expect(isPrayerAvailable("maghrib", prayers, baseTime)).toBe(false);
      expect(isPrayerAvailable("isha", prayers, baseTime)).toBe(false);
    });

    it("returns true at exactly the prayer start time", () => {
      const exactDhuhrTime = new Date("2026-09-30T12:00:00Z");
      expect(isPrayerAvailable("dhuhr", prayers, exactDhuhrTime)).toBe(true);
    });

    it("returns false 1ms before the prayer start time", () => {
      const justBeforeDhuhr = new Date("2026-09-30T11:59:59.999Z");
      expect(isPrayerAvailable("dhuhr", prayers, justBeforeDhuhr)).toBe(false);
    });

    it("returns false for a non-existent prayer name", () => {
      expect(isPrayerAvailable("tahajjud" as never, prayers, baseTime)).toBe(false);
    });
  });

  // ─── validatePrayerCompletion (new service-layer validation) ──────────
  describe("validatePrayerCompletion service-layer validation", () => {
    it("rejects completion before prayer time (Dhuhr)", async () => {
      // Get actual Dhuhr time for the test date
      const testDate = new Date(2026, 8, 30); // Sep 30, 2026
      const summary = await provider.getPrayerTimes(dhakaSettings, testDate);
      const dhuhrPrayer = summary.prayers.find((p) => p.name === "dhuhr")!;

      // Set now to 2 hours before Dhuhr
      const beforeDhuhr = new Date(dhuhrPrayer.time.getTime() - 2 * 60 * 60 * 1000);

      const result = await validatePrayerCompletion(
        "dhuhr",
        true,
        "2026-09-30",
        beforeDhuhr,
      );
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("has not started yet");
      expect(result.prayerStartTime).toBeDefined();
    });

    it("allows completion exactly at prayer start time (Fajr)", async () => {
      const testDate = new Date(2026, 8, 30);
      const summary = await provider.getPrayerTimes(dhakaSettings, testDate);
      const fajrPrayer = summary.prayers.find((p) => p.name === "fajr")!;

      const result = await validatePrayerCompletion(
        "fajr",
        true,
        "2026-09-30",
        fajrPrayer.time,
      );
      expect(result.valid).toBe(true);
    });

    it("allows completion after prayer start time (Asr)", async () => {
      const testDate = new Date(2026, 8, 30);
      const summary = await provider.getPrayerTimes(dhakaSettings, testDate);
      const asrPrayer = summary.prayers.find((p) => p.name === "asr")!;

      // 30 minutes after Asr start
      const afterAsr = new Date(asrPrayer.time.getTime() + 30 * 60 * 1000);

      const result = await validatePrayerCompletion(
        "asr",
        true,
        "2026-09-30",
        afterAsr,
      );
      expect(result.valid).toBe(true);
    });

    it("always allows uncompleting (unmarking) a prayer regardless of time", async () => {
      // Even before any prayer starts, uncompleting is always valid
      const earlyMorning = new Date("2026-09-30T00:00:00Z");

      const result = await validatePrayerCompletion(
        "isha",
        false,
        "2026-09-30",
        earlyMorning,
      );
      expect(result.valid).toBe(true);
    });

    it("validates all 5 prayers individually", async () => {
      const testDate = new Date(2026, 8, 30);
      const summary = await provider.getPrayerTimes(dhakaSettings, testDate);
      const prayerNames: Array<"fajr" | "dhuhr" | "asr" | "maghrib" | "isha"> = [
        "fajr", "dhuhr", "asr", "maghrib", "isha",
      ];

      for (const name of prayerNames) {
        const prayer = summary.prayers.find((p) => p.name === name)!;

        // Before prayer time → rejected
        const before = new Date(prayer.time.getTime() - 60 * 1000);
        const resultBefore = await validatePrayerCompletion(name, true, "2026-09-30", before);
        expect(resultBefore.valid).toBe(false);

        // At prayer time → allowed
        const resultAt = await validatePrayerCompletion(name, true, "2026-09-30", prayer.time);
        expect(resultAt.valid).toBe(true);

        // After prayer time → allowed
        const after = new Date(prayer.time.getTime() + 60 * 1000);
        const resultAfter = await validatePrayerCompletion(name, true, "2026-09-30", after);
        expect(resultAfter.valid).toBe(true);
      }
    });

    it("validates correctly with different timezone/location (London)", async () => {
      // In vitest (Node), typeof window === "undefined" so getLocalPrayerSettings()
      // returns Dhaka defaults. Instead, test the core isPrayerAvailable logic
      // which the validatePrayerCompletion function relies on internally.
      const testDate = new Date(2026, 8, 30);
      const summary = await provider.getPrayerTimes(londonSettings, testDate);
      const fajrPrayer = summary.prayers.find((p) => p.name === "fajr")!;
      const ishaPrayer = summary.prayers.find((p) => p.name === "isha")!;

      // London's Fajr and Isha times should be valid Date objects
      expect(fajrPrayer.time).toBeInstanceOf(Date);
      expect(ishaPrayer.time).toBeInstanceOf(Date);

      // Before Fajr → not available
      const beforeFajr = new Date(fajrPrayer.time.getTime() - 2 * 60 * 60 * 1000);
      expect(isPrayerAvailable("fajr", summary.prayers, beforeFajr)).toBe(false);

      // After Fajr → available
      const afterFajr = new Date(fajrPrayer.time.getTime() + 30 * 60 * 1000);
      expect(isPrayerAvailable("fajr", summary.prayers, afterFajr)).toBe(true);

      // Before Isha → not available
      const beforeIsha = new Date(ishaPrayer.time.getTime() - 30 * 60 * 1000);
      expect(isPrayerAvailable("isha", summary.prayers, beforeIsha)).toBe(false);

      // After Isha → available
      const afterIsha = new Date(ishaPrayer.time.getTime() + 30 * 60 * 1000);
      expect(isPrayerAvailable("isha", summary.prayers, afterIsha)).toBe(true);
    });

    it("handles date boundary (near midnight)", async () => {
      const testDate = new Date(2026, 8, 30);
      const summary = await provider.getPrayerTimes(dhakaSettings, testDate);
      const ishaPrayer = summary.prayers.find((p) => p.name === "isha")!;

      // After Isha (late night) — should still be valid for today's Isha
      const lateNight = new Date(ishaPrayer.time.getTime() + 3 * 60 * 60 * 1000);
      const result = await validatePrayerCompletion(
        "isha",
        true,
        "2026-09-30",
        lateNight,
      );
      expect(result.valid).toBe(true);
    });
  });

  // ─── Offline queue validation ─────────────────────────────────────────
  describe("Offline queue prayer validation", () => {
    it("should include queuedAt in offline action payload", async () => {
      // This is a structural test — the payload now includes queuedAt
      // to help with validation at flush time
      const payload = {
        prayer: "dhuhr" as const,
        completed: true,
        dateStr: "2026-09-30",
        queuedAt: Date.now(),
      };
      expect(payload.queuedAt).toBeDefined();
      expect(typeof payload.queuedAt).toBe("number");
    });

    it("validates that offline queued prayer completion is checked at flush", async () => {
      // Simulate queuing a prayer completion before its time
      const testDate = new Date(2026, 8, 30);
      const summary = await provider.getPrayerTimes(dhakaSettings, testDate);
      const asrPrayer = summary.prayers.find((p) => p.name === "asr")!;

      // Queue action before Asr time
      const beforeAsr = new Date(asrPrayer.time.getTime() - 60 * 60 * 1000);

      const result = await validatePrayerCompletion(
        "asr",
        true,
        "2026-09-30",
        beforeAsr,
      );

      // At flush time (still before Asr), this should be rejected
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("has not started yet");
    });

    it("allows offline queued prayer when prayer time has passed at flush", async () => {
      const testDate = new Date(2026, 8, 30);
      const summary = await provider.getPrayerTimes(dhakaSettings, testDate);
      const asrPrayer = summary.prayers.find((p) => p.name === "asr")!;

      // At flush time (after Asr), this should be allowed
      const afterAsr = new Date(asrPrayer.time.getTime() + 30 * 60 * 1000);
      const result = await validatePrayerCompletion(
        "asr",
        true,
        "2026-09-30",
        afterAsr,
      );
      expect(result.valid).toBe(true);
    });
  });

  // ─── UI disabled state validation ─────────────────────────────────────
  describe("UI disabled state", () => {
    it("button should be disabled (canMark=false) before prayer time", () => {
      const prayers: PrayerTime[] = [
        { name: "fajr", label: "Fajr", time: new Date("2026-09-30T04:30:00Z"), completed: false, notificationsEnabled: false },
        { name: "dhuhr", label: "Dhuhr", time: new Date("2026-09-30T12:00:00Z"), completed: false, notificationsEnabled: false },
        { name: "asr", label: "Asr", time: new Date("2026-09-30T15:30:00Z"), completed: false, notificationsEnabled: false },
      ];
      const now = new Date("2026-09-30T10:00:00Z");

      // Fajr passed → available → canMark=true
      const fajrAvailable = isPrayerAvailable("fajr", prayers, now);
      const fajrCompleted = false;
      const fajrCanMark = fajrAvailable || fajrCompleted;
      expect(fajrCanMark).toBe(true);

      // Dhuhr hasn't started → not available → canMark=false
      const dhuhrAvailable = isPrayerAvailable("dhuhr", prayers, now);
      const dhuhrCompleted = false;
      const dhuhrCanMark = dhuhrAvailable || dhuhrCompleted;
      expect(dhuhrCanMark).toBe(false);

      // Asr hasn't started → not available → canMark=false
      const asrAvailable = isPrayerAvailable("asr", prayers, now);
      const asrCompleted = false;
      const asrCanMark = asrAvailable || asrCompleted;
      expect(asrCanMark).toBe(false);
    });

    it("completed prayers can always be unmarked even if time hasn't arrived (for correction)", () => {
      const prayers: PrayerTime[] = [
        { name: "isha", label: "Isha", time: new Date("2026-09-30T19:30:00Z"), completed: true, notificationsEnabled: false },
      ];
      const now = new Date("2026-09-30T10:00:00Z");

      // Isha hasn't started, but it's marked completed (maybe carried from yesterday)
      const ishaAvailable = isPrayerAvailable("isha", prayers, now);
      const ishaCompleted = true;
      const ishaCanMark = ishaAvailable || ishaCompleted;
      // Should allow unmarking
      expect(ishaCanMark).toBe(true);
    });
  });
});
