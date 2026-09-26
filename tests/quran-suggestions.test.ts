import { describe, it, expect, vi } from "vitest";

// ─── Mock environment ───────────────────────────────────────────────────────

vi.stubGlobal("localStorage", {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
});
vi.stubGlobal("crypto", { randomUUID: () => "test-uuid" });
vi.mock("@/lib/offline/offline-sync-queue", () => ({
  enqueueOfflineAction: vi.fn(),
}));

// ─── Imports ────────────────────────────────────────────────────────────────

import { RuleBasedSuggestionEngine } from "@/services/suggestions/suggestion-engine";

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("Qur'an Suggestions", () => {
  const engine = new RuleBasedSuggestionEngine();

  it("should generate a POST_FAJR_QURAN suggestion in early morning", async () => {
    const result = await engine.generateSuggestions({
      currentTime: new Date("2026-09-26T05:30:00"),
      nextPrayerName: "Dhuhr",
      minutesUntilNextPrayer: 360,
    });

    const quranItem = result.items.find(
      (item) =>
        item.type === "POST_FAJR_QURAN" || item.category === "quran",
    );
    expect(quranItem).toBeDefined();
    expect(quranItem!.actionUrl).toBe("/quran");
  });

  it("should include context-aware Qur'an title when last surah is known", async () => {
    const result = await engine.generateSuggestions({
      currentTime: new Date("2026-09-26T06:00:00"),
      nextPrayerName: "Dhuhr",
      minutesUntilNextPrayer: 300,
      quranLastSurah: "Al-Kahf",
      quranTargetMet: false,
    });

    const quranItem = result.items.find(
      (i) => i.type === "POST_FAJR_QURAN",
    );
    expect(quranItem).toBeDefined();
    expect(quranItem!.title).toContain("Al-Kahf");
  });

  it("should generate QURAN_TARGET suggestion when target not met and window is available", async () => {
    const result = await engine.generateSuggestions({
      currentTime: new Date("2026-09-26T14:00:00"),
      nextPrayerName: "Asr",
      minutesUntilNextPrayer: 30,
      quranTargetMet: false,
      quranTargetValue: 15,
      quranTargetType: "minutes",
      quranMinutesToday: 5,
    });

    // Should get either QURAN_TARGET or a window with quran items
    const hasQuranContent =
      result.type === "QURAN_TARGET" ||
      result.items.some(
        (i) => i.category === "quran" || i.type === "QURAN_CONTINUE",
      );
    expect(hasQuranContent).toBe(true);
  });

  it("should include continue-reading suggestion in prayer window when target not met", async () => {
    const result = await engine.generateSuggestions({
      currentTime: new Date("2026-09-26T13:30:00"),
      nextPrayerName: "Asr",
      minutesUntilNextPrayer: 90,
      quranTargetMet: false,
      quranTargetValue: 10,
      quranTargetType: "minutes",
      quranMinutesToday: 3,
      quranLastSurah: "Al-Baqarah",
    });

    // Check if there's any quran-related item in the suggestion
    const quranItem = result.items.find(
      (i) =>
        i.category === "quran" ||
        i.type === "QURAN_CONTINUE" ||
        i.type === "QURAN_TARGET",
    );
    expect(quranItem).toBeDefined();
  });

  it("should NOT generate Qur'an target reminder when target is already met", async () => {
    const result = await engine.generateSuggestions({
      currentTime: new Date("2026-09-26T10:00:00"),
      nextPrayerName: "Dhuhr",
      minutesUntilNextPrayer: 120,
      quranTargetMet: true,
      quranTargetValue: 10,
      quranMinutesToday: 15,
    });

    expect(result.type).not.toBe("QURAN_TARGET");
  });

  it("should generate evening suggestion with Surah Al-Mulk reference", async () => {
    const result = await engine.generateSuggestions({
      currentTime: new Date("2026-09-26T22:00:00"),
    });

    const mulkItem = result.items.find(
      (i) => i.title.includes("Surah Al-Mulk") || i.id === "surah-mulk",
    );
    expect(mulkItem).toBeDefined();
    expect(mulkItem!.actionUrl).toBe("/quran");
  });
});
