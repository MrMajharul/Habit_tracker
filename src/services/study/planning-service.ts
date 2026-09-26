import { getPrayerDaySummary, type PrayerSettings } from "@/services/prayer";
import { taskService } from "./task-service";
import type { PlanningWindow, Task } from "./types";

export interface PrayerFitResult {
  fits: boolean;
  minutesUntilNextPrayer: number;
  nextPrayerName: string;
  suggestedShorterDuration?: number;
  warningMessage?: string;
}

export class PlanningService {
  /**
   * Calculates the current prayer window and available time before the next Salah,
   * selecting tasks that fit without crossing prayer boundaries.
   */
  async getPrayerPlanningWindow(options?: {
    date?: Date;
    settings?: Partial<PrayerSettings>;
  }): Promise<PlanningWindow> {
    const now = options?.date ?? new Date();
    const summary = await getPrayerDaySummary(options?.settings, now);

    const nextPrayer = summary.nextPrayer;
    const pastPrayers = summary.prayers.filter(
      (p) => p.time.getTime() <= now.getTime(),
    );
    const currentPrayer =
      pastPrayers.length > 0 ? pastPrayers[pastPrayers.length - 1] : null;

    const nextPrayerTime = nextPrayer?.time ?? new Date(now.getTime() + 60 * 60000);
    const nextPrayerName =
      nextPrayer?.label ??
      (nextPrayer?.name
        ? nextPrayer.name.charAt(0).toUpperCase() + nextPrayer.name.slice(1)
        : "Fajr");

    const minutesUntilNext = Math.max(
      0,
      Math.floor((nextPrayerTime.getTime() - now.getTime()) / 60000),
    );

    // Leave a 5-minute wudu & transition buffer before prayer starts
    const availableMinutes = Math.max(0, minutesUntilNext - 5);

    // Fetch pending tasks
    const pendingTasks = await taskService.getTasks({
      status: "TODO",
    });

    // Select tasks that fit within the available time
    const recommendedTasks: Array<{ task: Task; allocatedMinutes: number }> = [];
    let remainingBudget = availableMinutes;

    for (const task of pendingTasks) {
      const duration = task.estimatedMinutes || 25;
      if (duration <= remainingBudget && remainingBudget >= 10) {
        recommendedTasks.push({
          task,
          allocatedMinutes: duration,
        });
        remainingBudget -= duration;
      }
      if (remainingBudget < 10) break;
    }

    const fitsStandard25 = availableMinutes >= 25;
    const shortSessionRecommendation =
      availableMinutes >= 10 && availableMinutes < 25
        ? Math.floor(availableMinutes / 5) * 5
        : undefined;

    return {
      currentPrayer: currentPrayer?.name,
      nextPrayer: nextPrayerName,
      nextPrayerTime,
      availableMinutes,
      recommendedTasks,
      recommendedFocusDuration: fitsStandard25 ? 25 : shortSessionRecommendation ?? 15,
      fitsBeforePrayer: fitsStandard25,
      shortSessionRecommendation,
    };
  }

  /**
   * Checks whether a planned focus session (e.g. 25 min) fits comfortably before
   * the next Salah, or if a shorter session should be suggested.
   */
  async checkFocusSessionPrayerFit(
    plannedMinutes: number,
    options?: {
      date?: Date;
      settings?: Partial<PrayerSettings>;
    },
  ): Promise<PrayerFitResult> {
    const now = options?.date ?? new Date();
    const summary = await getPrayerDaySummary(options?.settings, now);
    const nextPrayer = summary.nextPrayer;

    if (!nextPrayer) {
      return {
        fits: true,
        minutesUntilNextPrayer: 180,
        nextPrayerName: "Fajr",
      };
    }

    const nextPrayerName =
      nextPrayer.label ??
      nextPrayer.name.charAt(0).toUpperCase() + nextPrayer.name.slice(1);

    const diffMinutes = Math.max(
      0,
      Math.floor((nextPrayer.time.getTime() - now.getTime()) / 60000),
    );

    // Allow 3 minutes for buffer
    const safeWindow = Math.max(0, diffMinutes - 3);

    if (plannedMinutes <= safeWindow) {
      return {
        fits: true,
        minutesUntilNextPrayer: diffMinutes,
        nextPrayerName,
      };
    }

    // Planned session exceeds available window before next prayer!
    const suggestedShorter =
      diffMinutes >= 12 ? Math.min(diffMinutes - 3, Math.floor((diffMinutes - 2) / 5) * 5) : 10;

    return {
      fits: false,
      minutesUntilNextPrayer: diffMinutes,
      nextPrayerName,
      suggestedShorterDuration: Math.max(5, suggestedShorter),
      warningMessage: `Your next prayer (${nextPrayerName}) is in ${diffMinutes} minutes. Would you like to start a shorter ${suggestedShorter}-minute focus session?`,
    };
  }
}

export const planningService = new PlanningService();
