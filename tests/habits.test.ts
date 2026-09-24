import { format, subDays } from "date-fns";
import { describe, expect, it } from "vitest";

import { calculateHabitStreak } from "@/services/habits/streak-calculator";

describe("Habit Streak & Completion Logic", () => {
  const refDate = new Date(2026, 8, 24); // Thursday, Sept 24, 2026
  const today = format(refDate, "yyyy-MM-dd");
  const yesterday = format(subDays(refDate, 1), "yyyy-MM-dd");
  const day2Ago = format(subDays(refDate, 2), "yyyy-MM-dd");
  const day3Ago = format(subDays(refDate, 3), "yyyy-MM-dd");
  const day4Ago = format(subDays(refDate, 4), "yyyy-MM-dd");
  const day5Ago = format(subDays(refDate, 5), "yyyy-MM-dd");
  const tomorrow = format(new Date(2026, 8, 25), "yyyy-MM-dd");

  it("returns 0 for empty logs", () => {
    const stats = calculateHabitStreak([], refDate);
    expect(stats.currentStreak).toBe(0);
    expect(stats.longestStreak).toBe(0);
    expect(stats.weeklyCompletionRate).toBe(0);
    expect(stats.totalCompletedDays).toBe(0);
  });

  it("calculates current streak when completed today and unbroken", () => {
    // Completed today, yesterday, and 2 days ago -> 3 days streak
    const dates = [today, yesterday, day2Ago];
    const stats = calculateHabitStreak(dates, refDate);

    expect(stats.currentStreak).toBe(3);
    expect(stats.longestStreak).toBe(3);
    expect(stats.totalCompletedDays).toBe(3);
  });

  it("keeps streak unbroken if completed yesterday even if today is not yet done", () => {
    // User hasn't finished today yet, but did yesterday, 2 days ago, and 3 days ago -> 3 days streak
    const dates = [yesterday, day2Ago, day3Ago];
    const stats = calculateHabitStreak(dates, refDate);

    expect(stats.currentStreak).toBe(3);
    expect(stats.longestStreak).toBe(3);
  });

  it("resets current streak to 0 if neither today nor yesterday was completed", () => {
    // Last completed was 2 days ago
    const dates = [day2Ago, day3Ago, day4Ago];
    const stats = calculateHabitStreak(dates, refDate);

    expect(stats.currentStreak).toBe(0);
    expect(stats.longestStreak).toBe(3); // Historical longest preserved
  });

  it("handles uncompletion correctly", () => {
    // Initially completed today and yesterday (streak 2)
    const initialDates = [today, yesterday];
    expect(calculateHabitStreak(initialDates, refDate).currentStreak).toBe(2);

    // After uncompleting today: streak counts from yesterday (streak 1)
    const afterUncompleteToday = [yesterday];
    expect(calculateHabitStreak(afterUncompleteToday, refDate).currentStreak).toBe(1);

    // After uncompleting yesterday as well: streak becomes 0
    expect(calculateHabitStreak([], refDate).currentStreak).toBe(0);
  });

  it("correctly identifies longest streak across multiple periods", () => {
    // 5 day streak earlier, then a gap, then 2 day streak currently
    const dates = [
      today,
      yesterday,
      // gap on day2Ago
      day3Ago,
      day4Ago,
      day5Ago,
      format(subDays(refDate, 6), "yyyy-MM-dd"),
      format(subDays(refDate, 7), "yyyy-MM-dd"),
    ];
    const stats = calculateHabitStreak(dates, refDate);

    expect(stats.currentStreak).toBe(2);
    expect(stats.longestStreak).toBe(5);
  });

  it("deduplicates multiple logs on the same date", () => {
    const datesWithDups = [today, today, yesterday, yesterday, yesterday];
    const stats = calculateHabitStreak(datesWithDups, refDate);

    expect(stats.currentStreak).toBe(2);
    expect(stats.totalCompletedDays).toBe(2);
  });

  it("ignores future dates (does not count future dates)", () => {
    const datesWithFuture = [tomorrow, today, yesterday];
    const stats = calculateHabitStreak(datesWithFuture, refDate);

    expect(stats.currentStreak).toBe(2);
    expect(stats.totalCompletedDays).toBe(2);
  });

  it("calculates weekly and monthly completion rates", () => {
    // Completed 4 out of last 7 days
    const dates = [today, yesterday, day2Ago, day3Ago];
    const stats = calculateHabitStreak(dates, refDate);

    // 4 / 7 * 100 = 57%
    expect(stats.weeklyCompletionRate).toBe(57);
    // 4 / 30 * 100 = 13%
    expect(stats.monthlyCompletionRate).toBe(13);
  });
});
