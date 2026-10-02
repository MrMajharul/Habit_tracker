import { describe, expect, it, vi, beforeEach } from "vitest";

import { alarmService } from "@/services/audio/alarm-service";
import { notificationService } from "@/services/notifications/notification-service";

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

describe("Alarm Service & Notification Integration", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe("Alarm Sound Service", () => {
    it("initializes with sound enabled by default", () => {
      expect(alarmService.isSoundEnabled()).toBe(true);
    });

    it("can toggle and persist sound preferences", () => {
      alarmService.setSoundEnabled(false);
      expect(alarmService.isSoundEnabled()).toBe(false);
      expect(localStorage.getItem("istiqamaah_sound_enabled_v1")).toBe("false");

      alarmService.setSoundEnabled(true);
      expect(alarmService.isSoundEnabled()).toBe(true);
      expect(localStorage.getItem("istiqamaah_sound_enabled_v1")).toBe("true");
    });

    it("handles playFocusCompleteAlarm without throwing", () => {
      expect(() => alarmService.playFocusCompleteAlarm()).not.toThrow();
    });

    it("handles playPrayerAlarm without throwing", () => {
      expect(() => alarmService.playPrayerAlarm()).not.toThrow();
    });

    it("handles playReminderAlarm without throwing", () => {
      expect(() => alarmService.playReminderAlarm()).not.toThrow();
    });

    it("handles stopAlarm safely even when no audio is playing", () => {
      expect(() => alarmService.stopAlarm()).not.toThrow();
    });

    it("routes testSound correctly for all types", () => {
      const focusSpy = vi.spyOn(alarmService, "playFocusCompleteAlarm");
      const prayerSpy = vi.spyOn(alarmService, "playPrayerAlarm");
      const reminderSpy = vi.spyOn(alarmService, "playReminderAlarm");

      alarmService.testSound("focus");
      expect(focusSpy).toHaveBeenCalledTimes(1);

      alarmService.testSound("prayer");
      expect(prayerSpy).toHaveBeenCalledTimes(1);

      alarmService.testSound("reminder");
      expect(reminderSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("Notification Service Alarm Dispatches", () => {
    it("calls alarmService.playFocusCompleteAlarm when focus notification is sent", async () => {
      const alarmSpy = vi.spyOn(alarmService, "playFocusCompleteAlarm");
      await notificationService.sendFocusCompleteNotification("Deep Work", 25);
      expect(alarmSpy).toHaveBeenCalledTimes(1);
    });

    it("triggers prayer notification and plays prayer alarm", async () => {
      const alarmSpy = vi.spyOn(alarmService, "playPrayerAlarm");
      await notificationService.triggerPrayerNotification("Fajr", "05:15 AM");
      expect(alarmSpy).toHaveBeenCalledTimes(1);
    });

    it("triggers task reminder notification and plays reminder chime", async () => {
      const alarmSpy = vi.spyOn(alarmService, "playReminderAlarm");
      await notificationService.triggerTaskReminderNotification("Finish Arabic Homework", "14:30");
      expect(alarmSpy).toHaveBeenCalledTimes(1);
    });

    it("triggers user reminder notification and plays reminder chime", async () => {
      const alarmSpy = vi.spyOn(alarmService, "playReminderAlarm");
      await notificationService.triggerUserReminderNotification("Morning Adhkar", "Read morning protection supplications");
      expect(alarmSpy).toHaveBeenCalledTimes(1);
    });
  });
});
