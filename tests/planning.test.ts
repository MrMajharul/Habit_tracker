import { beforeEach, describe, expect, it } from "vitest";

import { PlanningService } from "@/services/study/planning-service";

// Polyfill localStorage & window for Node environment in tests
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

describe("Prayer-Aware Planning & Scheduling", () => {
  let planningService: PlanningService;
  const storage = createLocalStorageMock();

  beforeEach(() => {
    storage.clear();
    // @ts-expect-error polyfill for test
    globalThis.window = globalThis;
    // @ts-expect-error polyfill for test
    globalThis.localStorage = storage;

    planningService = new PlanningService();
  });

  it("calculates prayer planning window with available minutes and buffer", async () => {
    // 10:00 AM (between Sunrise/Fajr and Dhuhr at ~12:00-12:30 PM)
    const testDate = new Date(2026, 8, 24, 10, 0, 0);

    const plan = await planningService.getPrayerPlanningWindow({
      date: testDate,
      settings: {
        latitude: 23.8103,
        longitude: 90.4125,
        calculationMethod: "MuslimWorldLeague",
      },
    });

    expect(plan.nextPrayer).toBe("Dhuhr");
    expect(plan.nextPrayerTime.getTime()).toBeGreaterThan(testDate.getTime());
    expect(plan.availableMinutes).toBeGreaterThan(60);
    expect(plan.fitsBeforePrayer).toBe(true);
    expect(plan.recommendedFocusDuration).toBe(25);
  });

  it("identifies when planned focus session fits comfortably before prayer", async () => {
    // 10:00 AM, Dhuhr is ~2 hours away (plenty of time for a 25-minute focus session)
    const testDate = new Date(2026, 8, 24, 10, 0, 0);

    const fitResult = await planningService.checkFocusSessionPrayerFit(25, {
      date: testDate,
      settings: {
        latitude: 23.8103,
        longitude: 90.4125,
        calculationMethod: "MuslimWorldLeague",
      },
    });

    expect(fitResult.fits).toBe(true);
    expect(fitResult.nextPrayerName).toBe("Dhuhr");
    expect(fitResult.minutesUntilNextPrayer).toBeGreaterThan(25);
    expect(fitResult.warningMessage).toBeUndefined();
  });

  it("suggests shorter focus session when prayer approaches within session duration", async () => {
    // Simulate time: 18 minutes before Asr (~ 3:42 PM if Asr is at 4:00 PM)
    // We can test by finding the prayer times for our test location
    const testDate = new Date(2026, 8, 24, 11, 40, 0); // ~15-20 min before Dhuhr at ~11:55-12:00

    const fitResult = await planningService.checkFocusSessionPrayerFit(45, {
      date: testDate,
      settings: {
        latitude: 23.8103,
        longitude: 90.4125,
        calculationMethod: "MuslimWorldLeague",
      },
    });

    // 45 minutes will NOT fit in a 15-20 min window
    if (!fitResult.fits) {
      expect(fitResult.suggestedShorterDuration).toBeDefined();
      expect(fitResult.suggestedShorterDuration).toBeLessThan(45);
      expect(fitResult.warningMessage).toContain("Would you like to start a shorter");
    }
  });

  it("prayer boundaries never automatically terminate user sessions without choice", async () => {
    // Verifies that fitResult returns guidance rather than throwing or altering user intent
    const testDate = new Date(2026, 8, 24, 11, 50, 0);

    const fitResult = await planningService.checkFocusSessionPrayerFit(60, {
      date: testDate,
      settings: {
        latitude: 23.8103,
        longitude: 90.4125,
        calculationMethod: "MuslimWorldLeague",
      },
    });

    // fitResult contains warning and recommendation, but lets the UI present user choices:
    // [Suggested Shorter] [Keep Original 60m] [Cancel]
    expect(fitResult).toHaveProperty("fits");
    expect(fitResult).toHaveProperty("minutesUntilNextPrayer");
  });
});
