import { describe, it, expect, beforeEach, vi } from "vitest";

// ─── Mock localStorage & crypto ─────────────────────────────────────────────

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, val: string) => { store[key] = val; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { Object.keys(store).forEach((k) => delete store[k]); }),
};
vi.stubGlobal("localStorage", localStorageMock);
vi.stubGlobal("window", globalThis);
// @ts-expect-error polyfill for test
globalThis.localStorage = localStorageMock;
vi.stubGlobal("crypto", { randomUUID: () => `test-${Date.now()}-${Math.random().toString(36).slice(2)}` });

vi.mock("@/lib/offline/offline-sync-queue", () => ({
  enqueueOfflineAction: vi.fn(),
}));

// ─── Imports ────────────────────────────────────────────────────────────────

import { quranService } from "@/services/quran/quran-service";
import { quranGoalService } from "@/services/quran/quran-goal-service";
import { quranProgressService } from "@/services/quran/quran-progress-service";

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("Qur'an Progress & Streaks", () => {
  beforeEach(() => {
    localStorageMock.clear();
    Object.keys(store).forEach((k) => delete store[k]);
  });

  describe("Daily Progress", () => {
    it("should return zero progress with no sessions", () => {
      const daily = quranProgressService.getDailyProgress("2026-09-26");
      expect(daily.minutesRead).toBe(0);
      expect(daily.ayahsRead).toBe(0);
      expect(daily.sessionsCount).toBe(0);
    });

    it("should calculate daily progress correctly", () => {
      quranService.createReadingSession({
        userId: "u",
        surahNumber: 1,
        startAyah: 1,
        endAyah: 7,
        minutesRead: 5,
        readingDate: "2026-09-26",
      });
      quranService.createReadingSession({
        userId: "u",
        surahNumber: 2,
        startAyah: 1,
        endAyah: 10,
        minutesRead: 10,
        readingDate: "2026-09-26",
      });

      const daily = quranProgressService.getDailyProgress("2026-09-26");
      expect(daily.minutesRead).toBe(15);
      expect(daily.ayahsRead).toBe(17); // 7 + 10
      expect(daily.sessionsCount).toBe(2);
    });

    it("should check daily target completion (minutes)", () => {
      quranGoalService.createGoalSettings({
        userId: "u",
        targetType: "minutes",
        targetValue: 10,
        isEnabled: true,
        prayerAnchor: "none",
      });

      quranService.createReadingSession({
        userId: "u",
        surahNumber: 1,
        startAyah: 1,
        endAyah: 7,
        minutesRead: 15,
        readingDate: "2026-09-26",
      });

      const daily = quranProgressService.getDailyProgress("2026-09-26");
      expect(daily.targetMet).toBe(true);
    });

    it("should check daily target completion (ayahs)", () => {
      quranGoalService.createGoalSettings({
        userId: "u",
        targetType: "ayahs",
        targetValue: 20,
        isEnabled: true,
        prayerAnchor: "none",
      });

      quranService.createReadingSession({
        userId: "u",
        surahNumber: 2,
        startAyah: 1,
        endAyah: 10,
        minutesRead: 10,
        readingDate: "2026-09-26",
      });

      const daily = quranProgressService.getDailyProgress("2026-09-26");
      expect(daily.targetMet).toBe(false); // 10 < 20
    });
  });

  describe("Weekly Progress", () => {
    it("should calculate weekly progress", () => {
      // Create sessions on different days this week
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);

      quranService.createReadingSession({
        userId: "u",
        surahNumber: 1,
        startAyah: 1,
        endAyah: 7,
        minutesRead: 10,
        readingDate: todayStr,
      });
      quranService.createReadingSession({
        userId: "u",
        surahNumber: 2,
        startAyah: 1,
        endAyah: 20,
        minutesRead: 20,
        readingDate: yesterdayStr,
      });

      const weekly = quranProgressService.getWeeklyProgress();
      expect(weekly.minutesRead).toBeGreaterThanOrEqual(30);
      expect(weekly.daysRead).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Streaks", () => {
    it("should return zero streak with no sessions", () => {
      const streak = quranProgressService.getStreakInfo();
      expect(streak.currentStreak).toBe(0);
      expect(streak.longestStreak).toBe(0);
    });

    it("should calculate current streak for consecutive days", () => {
      const today = new Date();
      const dates: string[] = [];
      for (let i = 0; i < 5; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().slice(0, 10));
      }

      dates.forEach((date) => {
        quranService.createReadingSession({
          userId: "u",
          surahNumber: 1,
          startAyah: 1,
          endAyah: 7,
          minutesRead: 5,
          readingDate: date,
        });
      });

      const streak = quranProgressService.getStreakInfo();
      expect(streak.currentStreak).toBe(5);
      expect(streak.longestStreak).toBe(5);
    });

    it("should handle a missed day in the streak", () => {
      const today = new Date();
      
      // Read today
      quranService.createReadingSession({
        userId: "u",
        surahNumber: 1,
        startAyah: 1,
        endAyah: 7,
        minutesRead: 5,
        readingDate: today.toISOString().slice(0, 10),
      });

      // Read 3 days ago (skip yesterday and day before)
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      quranService.createReadingSession({
        userId: "u",
        surahNumber: 2,
        startAyah: 1,
        endAyah: 10,
        minutesRead: 10,
        readingDate: threeDaysAgo.toISOString().slice(0, 10),
      });

      const streak = quranProgressService.getStreakInfo();
      expect(streak.currentStreak).toBe(1); // Only today counts
    });

    it("should never count future dates", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      quranService.createReadingSession({
        userId: "u",
        surahNumber: 1,
        startAyah: 1,
        endAyah: 7,
        minutesRead: 5,
        readingDate: tomorrow.toISOString().slice(0, 10),
      });

      const streak = quranProgressService.getStreakInfo();
      expect(streak.currentStreak).toBe(0);
    });
  });

  describe("Full Summary", () => {
    it("should return a complete progress summary", () => {
      quranService.createReadingSession({
        userId: "u",
        surahNumber: 18,
        startAyah: 1,
        endAyah: 10,
        minutesRead: 15,
        readingDate: new Date().toISOString().slice(0, 10),
      });

      const summary = quranProgressService.getProgressSummary();
      expect(summary.totalSessions).toBe(1);
      expect(summary.totalMinutes).toBe(15);
      expect(summary.totalAyahsRead).toBe(10);
      expect(summary.lastPosition).toBeDefined();
      expect(summary.lastPosition!.surahNumber).toBe(18);
      expect(summary.lastPosition!.surahName).toBe("Al-Kahf");
    });
  });
});
