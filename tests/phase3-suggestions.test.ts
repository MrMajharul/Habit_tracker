import { describe, expect, it } from "vitest";

import { RuleBasedSuggestionEngine } from "@/services/suggestions/suggestion-engine";

describe("Phase 3 Smart Suggestions Integration", () => {
  const engine = new RuleBasedSuggestionEngine();

  it("suggests focus session for overdue tasks with encouraging tone", async () => {
    const afternoonTime = new Date(2026, 8, 24, 14, 0, 0);

    const suggestion = await engine.generateSuggestions({
      currentTime: afternoonTime,
      nextPrayerName: "Asr",
      minutesUntilNextPrayer: 90,
      pendingTasks: [
        {
          id: "task-overdue-1",
          title: "Compiler Lab 2",
          isOverdue: true,
          priority: "HIGH",
          estimatedMinutes: 30,
        },
      ],
    });

    expect(suggestion.contextTitle).toContain("Gentle Reminder");
    expect(suggestion.items.some((i) => i.title.includes("Compiler Lab 2"))).toBe(true);
    // Never shames the user
    expect(suggestion.contextTitle.toLowerCase()).not.toContain("failed");
    expect(suggestion.contextTitle.toLowerCase()).not.toContain("bad");
  });

  it("suggests dedicated study session when a task is due today", async () => {
    const morningTime = new Date(2026, 8, 24, 10, 0, 0);

    const suggestion = await engine.generateSuggestions({
      currentTime: morningTime,
      nextPrayerName: "Dhuhr",
      minutesUntilNextPrayer: 120,
      pendingTasks: [
        {
          id: "task-today-1",
          title: "Machine Learning Paper Summary",
          isDueToday: true,
          priority: "MEDIUM",
          estimatedMinutes: 25,
        },
      ],
    });

    expect(suggestion.contextTitle).toContain("Due Today");
    expect(suggestion.items.some((i) => i.title.includes("Machine Learning"))).toBe(true);
  });

  it("suggests optimal study window before approaching prayer", async () => {
    // 50 minutes before Asr
    const afternoonTime = new Date(2026, 8, 24, 15, 10, 0);

    const suggestion = await engine.generateSuggestions({
      currentTime: afternoonTime,
      nextPrayerName: "Asr",
      minutesUntilNextPrayer: 50,
      pendingTasks: [
        {
          id: "task-compiler",
          title: "Compiler FIRST Sets",
          estimatedMinutes: 30,
        },
      ],
    });

    expect(suggestion.id).toBe("window-before-asr");
    expect(suggestion.contextTitle).toContain("50 minutes before Asr");
    expect(suggestion.items.some((i) => i.title.includes("Compiler FIRST Sets"))).toBe(true);
  });

  it("recommends a post-prayer focus block after Dhuhr", async () => {
    // 1:30 PM (after Dhuhr, next is Asr with ample time)
    const afternoonTime = new Date(2026, 8, 24, 13, 30, 0);

    const suggestion = await engine.generateSuggestions({
      currentTime: afternoonTime,
      nextPrayerName: "Asr",
      minutesUntilNextPrayer: 150,
      pendingTasks: [
        {
          id: "task-research",
          title: "Research Paper Review",
          estimatedMinutes: 45,
        },
      ],
    });

    expect(suggestion.contextTitle).toContain("Post-Dhuhr Focus Block");
    expect(suggestion.items.some((i) => i.title.includes("Research Paper Review"))).toBe(true);
  });

  it("integrates three layers: Spiritual (Salah/Dhikr), Personal (Habits), Productivity (Tasks)", async () => {
    const morningTime = new Date(2026, 8, 24, 6, 15, 0);

    const suggestion = await engine.generateSuggestions({
      currentTime: morningTime,
      nextPrayerName: "Dhuhr",
      userHabits: [
        { name: "Morning Qur'an Recitation", prayerAnchor: "fajr", completed: false },
      ],
      pendingTasks: [
        { title: "Review Algorithms Lecture", estimatedMinutes: 25 },
      ],
    });

    // Contains spiritual element (Qur'an or Morning Adhkar)
    const hasSpiritual = suggestion.items.some(
      (i) => i.title.includes("Qur'an") || i.title.includes("Adhkar"),
    );
    // Contains personal habit or task
    const hasTaskOrHabit = suggestion.items.some(
      (i) => i.title.includes("Algorithms") || i.title.includes("Qur'an"),
    );

    expect(hasSpiritual).toBe(true);
    expect(hasTaskOrHabit).toBe(true);
  });
});
