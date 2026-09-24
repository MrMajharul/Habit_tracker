import { describe, expect, it } from "vitest";

import { RuleBasedSuggestionEngine } from "@/services/suggestions/suggestion-engine";

describe("Smart Suggestion Engine", () => {
  const engine = new RuleBasedSuggestionEngine();

  it("generates Post-Fajr morning barakah suggestions during early morning hours", async () => {
    // 6:00 AM (Post-Fajr)
    const morningTime = new Date(2026, 8, 24, 6, 0, 0);
    const suggestion = await engine.generateSuggestions({
      currentTime: morningTime,
      nextPrayerName: "Dhuhr",
      userHabits: [
        { name: "Morning Qur'an Recitation", prayerAnchor: "fajr", completed: false },
      ],
    });

    expect(suggestion.id).toBe("morning-barakah");
    expect(suggestion.contextTitle).toContain("Morning Barakah Routine");
    expect(suggestion.items.length).toBeGreaterThan(0);
    // Verified user habit is prioritized
    expect(suggestion.items.some((i) => i.title.includes("Morning Qur'an"))).toBe(true);
  });

  it("generates Pre-Prayer suggestion when a prayer is 45 minutes away", async () => {
    // 3:15 PM, with Asr at 4:00 PM (45 minutes left)
    const afternoonTime = new Date(2026, 8, 24, 15, 15, 0);
    const suggestion = await engine.generateSuggestions({
      currentTime: afternoonTime,
      nextPrayerName: "Asr",
      minutesUntilNextPrayer: 45,
      pendingTasks: [{ title: "Compiler Design Study", estimatedMinutes: 30 }],
    });

    expect(suggestion.id).toBe("window-before-asr");
    expect(suggestion.contextTitle).toContain("45 minutes before Asr");
    expect(suggestion.items.some((i) => i.title.includes("Compiler Design"))).toBe(true);
  });

  it("generates Approaching Prayer suggestion when under 25 minutes to Salah", async () => {
    // 15 minutes before Maghrib
    const eveningTime = new Date(2026, 8, 24, 18, 0, 0);
    const suggestion = await engine.generateSuggestions({
      currentTime: eveningTime,
      nextPrayerName: "Maghrib",
      minutesUntilNextPrayer: 15,
    });

    expect(suggestion.id).toBe("approaching-maghrib");
    expect(suggestion.contextTitle).toContain("Maghrib is approaching in 15m");
    expect(suggestion.items.some((i) => i.title.includes("Wudu"))).toBe(true);
  });

  it("generates Evening Wind-Down and reflection prompt at night", async () => {
    // 10:30 PM (after Isha)
    const nightTime = new Date(2026, 8, 24, 22, 30, 0);
    const suggestion = await engine.generateSuggestions({
      currentTime: nightTime,
      nextPrayerName: "Fajr",
    });

    expect(suggestion.id).toBe("evening-wind-down");
    expect(suggestion.contextTitle).toContain("Evening Reflection & Rest");
    expect(suggestion.items.some((i) => i.title.includes("Al-Mulk"))).toBe(true);
    expect(suggestion.reflectionPrompt).toBeDefined();
  });

  it("handles edge cases without generating invalid negative or NaN durations", async () => {
    // 0 minutes remaining
    const suggestionZero = await engine.generateSuggestions({
      minutesUntilNextPrayer: 0,
      nextPrayerName: "Dhuhr",
    });
    expect(suggestionZero.items.length).toBeGreaterThan(0);
    for (const item of suggestionZero.items) {
      expect(item.durationMinutes).toBeGreaterThan(0);
      expect(Number.isFinite(item.durationMinutes)).toBe(true);
    }
  });
});
