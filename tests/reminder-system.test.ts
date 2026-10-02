import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  isReminderActiveForDate,
  isSuppressedByQuietHours,
  reminderService,
  type UserReminder,
} from "@/services/reminders/reminder-service";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });
Object.defineProperty(globalThis, "window", { value: globalThis, writable: true });

describe("Alarm & Reminder System", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe("CRUD operations", () => {
    it("fetches default preset reminders when no reminders exist", async () => {
      const reminders = await reminderService.getReminders("user-test-1");
      expect(reminders.length).toBeGreaterThan(0);
      expect(reminders[0].title).toBe("Morning Adhkar");
    });

    it("creates a new reminder and persists to storage", async () => {
      const created = await reminderService.createReminder({
        userId: "user-test-1",
        title: "Tahajjud Reminder",
        description: "Wake up 30 minutes before Fajr",
        reminderType: "salah",
        time: "04:15",
        repeatType: "daily",
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        isEnabled: true,
        soundEnabled: true,
        vibrationEnabled: true,
        targetUrl: "/prayer",
      });

      expect(created.id).toBeTruthy();
      expect(created.title).toBe("Tahajjud Reminder");
      expect(created.time).toBe("04:15");

      const all = await reminderService.getReminders("user-test-1");
      const found = all.find((r) => r.id === created.id);
      expect(found).toBeDefined();
      expect(found?.title).toBe("Tahajjud Reminder");
    });

    it("updates an existing reminder", async () => {
      const created = await reminderService.createReminder({
        userId: "user-test-1",
        title: "Qur'an Daily",
        description: null,
        reminderType: "quran",
        time: "07:00",
        repeatType: "daily",
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        isEnabled: true,
        soundEnabled: true,
        vibrationEnabled: true,
        targetUrl: "/quran",
      });

      const updated = await reminderService.updateReminder(
        created.id,
        { time: "07:30", title: "Surah Al-Kahf" },
        "user-test-1",
      );

      expect(updated.time).toBe("07:30");
      expect(updated.title).toBe("Surah Al-Kahf");

      const all = await reminderService.getReminders("user-test-1");
      const found = all.find((r) => r.id === created.id);
      expect(found?.time).toBe("07:30");
    });

    it("toggles reminder enabled state", async () => {
      const created = await reminderService.createReminder({
        userId: "user-test-1",
        title: "Dhikr",
        description: null,
        reminderType: "dhikr",
        time: "12:00",
        repeatType: "daily",
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        isEnabled: true,
        soundEnabled: true,
        vibrationEnabled: true,
        targetUrl: "/dhikr",
      });

      const toggled = await reminderService.toggleReminder(created.id, false, "user-test-1");
      expect(toggled.isEnabled).toBe(false);

      const all = await reminderService.getReminders("user-test-1");
      expect(all.find((r) => r.id === created.id)?.isEnabled).toBe(false);
    });

    it("deletes a reminder", async () => {
      const created = await reminderService.createReminder({
        userId: "user-test-1",
        title: "To Be Deleted",
        description: null,
        reminderType: "custom",
        time: "15:00",
        repeatType: "once",
        daysOfWeek: [],
        isEnabled: true,
        soundEnabled: true,
        vibrationEnabled: true,
        targetUrl: "/dashboard",
      });

      await reminderService.deleteReminder(created.id, "user-test-1");
      const all = await reminderService.getReminders("user-test-1");
      expect(all.find((r) => r.id === created.id)).toBeUndefined();
    });
  });

  describe("Recurring schedules", () => {
    const baseReminder: UserReminder = {
      id: "rem-1",
      userId: "u1",
      title: "Test",
      description: null,
      reminderType: "salah",
      time: "12:00",
      repeatType: "daily",
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      isEnabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
      targetUrl: "/prayer",
      createdAt: "",
      updatedAt: "",
    };

    it("returns false if reminder is disabled", () => {
      expect(isReminderActiveForDate({ ...baseReminder, isEnabled: false })).toBe(false);
    });

    it("returns true for daily reminders on any day", () => {
      const monday = new Date("2026-10-05T12:00:00Z"); // Monday
      const sunday = new Date("2026-10-04T12:00:00Z"); // Sunday
      expect(isReminderActiveForDate({ ...baseReminder, repeatType: "daily" }, monday)).toBe(true);
      expect(isReminderActiveForDate({ ...baseReminder, repeatType: "daily" }, sunday)).toBe(true);
    });

    it("returns true on weekdays and false on weekends for weekdays repeat", () => {
      const wednesday = new Date("2026-10-07T12:00:00Z"); // Wednesday (day 3)
      const sunday = new Date("2026-10-04T12:00:00Z"); // Sunday (day 0)
      const saturday = new Date("2026-10-10T12:00:00Z"); // Saturday (day 6)

      expect(isReminderActiveForDate({ ...baseReminder, repeatType: "weekdays" }, wednesday)).toBe(true);
      expect(isReminderActiveForDate({ ...baseReminder, repeatType: "weekdays" }, sunday)).toBe(false);
      expect(isReminderActiveForDate({ ...baseReminder, repeatType: "weekdays" }, saturday)).toBe(false);
    });

    it("respects custom days of week", () => {
      const friday = new Date("2026-10-09T12:00:00Z"); // Friday (day 5)
      const monday = new Date("2026-10-05T12:00:00Z"); // Monday (day 1)

      const jumuahReminder: UserReminder = {
        ...baseReminder,
        repeatType: "custom_days",
        daysOfWeek: [5], // Friday only
      };

      expect(isReminderActiveForDate(jumuahReminder, friday)).toBe(true);
      expect(isReminderActiveForDate(jumuahReminder, monday)).toBe(false);
    });
  });

  describe("Quiet hours suppression", () => {
    const quietHours = {
      enabled: true,
      start: "23:00",
      end: "05:00",
    };

    it("suppresses reminders during overnight quiet hours (e.g. 23:30, 04:00)", () => {
      expect(isSuppressedByQuietHours("23:30", quietHours)).toBe(true);
      expect(isSuppressedByQuietHours("02:00", quietHours)).toBe(true);
      expect(isSuppressedByQuietHours("04:59", quietHours)).toBe(true);
    });

    it("allows reminders outside quiet hours (e.g. 09:00, 18:00)", () => {
      expect(isSuppressedByQuietHours("09:00", quietHours)).toBe(false);
      expect(isSuppressedByQuietHours("14:30", quietHours)).toBe(false);
      expect(isSuppressedByQuietHours("20:00", quietHours)).toBe(false);
    });

    it("does not suppress when quiet hours are disabled", () => {
      expect(isSuppressedByQuietHours("02:00", { ...quietHours, enabled: false })).toBe(false);
    });
  });

  describe("User account isolation", () => {
    it("isolates reminders between different users", async () => {
      await reminderService.createReminder({
        userId: "user-alpha",
        title: "Alpha Specific",
        description: null,
        reminderType: "custom",
        time: "10:00",
        repeatType: "once",
        daysOfWeek: [],
        isEnabled: true,
        soundEnabled: true,
        vibrationEnabled: true,
        targetUrl: "/dashboard",
      });

      const alphaReminders = await reminderService.getReminders("user-alpha");
      const betaReminders = await reminderService.getReminders("user-beta");

      expect(alphaReminders.some((r) => r.title === "Alpha Specific")).toBe(true);
      expect(betaReminders.some((r) => r.title === "Alpha Specific")).toBe(false);
    });
  });
});
