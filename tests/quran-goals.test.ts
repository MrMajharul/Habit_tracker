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

import { quranGoalService } from "@/services/quran/quran-goal-service";

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("Qur'an Goals", () => {
  beforeEach(() => {
    localStorageMock.clear();
    Object.keys(store).forEach((k) => delete store[k]);
  });

  describe("Daily Target", () => {
    it("should create goal settings", () => {
      const settings = quranGoalService.createGoalSettings({
        userId: "user-1",
        targetType: "minutes",
        targetValue: 15,
        isEnabled: true,
        prayerAnchor: "fajr",
      });

      expect(settings.id).toBeDefined();
      expect(settings.targetType).toBe("minutes");
      expect(settings.targetValue).toBe(15);
      expect(settings.isEnabled).toBe(true);
    });

    it("should persist and retrieve goal settings", () => {
      quranGoalService.createGoalSettings({
        userId: "user-1",
        targetType: "ayahs",
        targetValue: 20,
        isEnabled: true,
        prayerAnchor: "none",
      });

      const retrieved = quranGoalService.getGoalSettings();
      expect(retrieved).not.toBeNull();
      expect(retrieved!.targetType).toBe("ayahs");
      expect(retrieved!.targetValue).toBe(20);
    });
  });

  describe("Spiritual Goals", () => {
    it("should create a spiritual goal", () => {
      const goal = quranGoalService.createSpiritualGoal({
        userId: "user-1",
        type: "quran",
        title: "Read 100 Ayahs this week",
        targetValue: 100,
        currentValue: 0,
        unit: "ayahs",
        startDate: "2026-09-20",
        isCompleted: false,
      });

      expect(goal.id).toBeDefined();
      expect(goal.title).toBe("Read 100 Ayahs this week");
      expect(goal.type).toBe("quran");
    });

    it("should update a spiritual goal's progress", () => {
      const goal = quranGoalService.createSpiritualGoal({
        userId: "user-1",
        type: "quran",
        title: "Complete Juz 30",
        targetValue: 30,
        currentValue: 0,
        unit: "juz",
        startDate: "2026-09-01",
        isCompleted: false,
      });

      const updated = quranGoalService.updateSpiritualGoal(goal.id, {
        currentValue: 15,
      });

      expect(updated).not.toBeNull();
      expect(updated!.currentValue).toBe(15);
      expect(updated!.isCompleted).toBe(false);
    });

    it("should auto-complete a goal when target is reached", () => {
      const goal = quranGoalService.createSpiritualGoal({
        userId: "user-1",
        type: "quran",
        title: "Read 10 Ayahs",
        targetValue: 10,
        currentValue: 8,
        unit: "ayahs",
        startDate: "2026-09-20",
        isCompleted: false,
      });

      const updated = quranGoalService.updateSpiritualGoal(goal.id, {
        currentValue: 10,
      });

      expect(updated!.isCompleted).toBe(true);
    });

    it("should delete a spiritual goal", () => {
      const goal = quranGoalService.createSpiritualGoal({
        userId: "user-1",
        type: "quran",
        title: "To be deleted",
        targetValue: 100,
        currentValue: 0,
        unit: "ayahs",
        startDate: "2026-09-20",
        isCompleted: false,
      });

      quranGoalService.deleteSpiritualGoal(goal.id);
      expect(quranGoalService.getSpiritualGoals().length).toBe(0);
    });

    it("should filter goals by type", () => {
      quranGoalService.createSpiritualGoal({
        userId: "u",
        type: "quran",
        title: "Quran Goal",
        targetValue: 10,
        currentValue: 0,
        unit: "juz",
        startDate: "2026-01-01",
        isCompleted: false,
      });
      quranGoalService.createSpiritualGoal({
        userId: "u",
        type: "prayer",
        title: "Prayer Goal",
        targetValue: 5,
        currentValue: 0,
        unit: "prayers",
        startDate: "2026-01-01",
        isCompleted: false,
      });

      const quranGoals = quranGoalService.getSpiritualGoalsByType("quran");
      expect(quranGoals.length).toBe(1);
      expect(quranGoals[0].title).toBe("Quran Goal");
    });

    it("should get active (non-completed) goals", () => {
      quranGoalService.createSpiritualGoal({
        userId: "u",
        type: "quran",
        title: "Active Goal",
        targetValue: 10,
        currentValue: 5,
        unit: "juz",
        startDate: "2026-01-01",
        isCompleted: false,
      });
      quranGoalService.createSpiritualGoal({
        userId: "u",
        type: "quran",
        title: "Done Goal",
        targetValue: 10,
        currentValue: 10,
        unit: "juz",
        startDate: "2026-01-01",
        isCompleted: true,
      });

      const active = quranGoalService.getActiveSpiritualGoals();
      expect(active.length).toBe(1);
      expect(active[0].title).toBe("Active Goal");
    });
  });
});
