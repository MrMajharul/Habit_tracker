export type NotificationType =
  | "PrayerReminder"
  | "HabitReminder"
  | "StudyReminder"
  | "TaskReminder"
  | "FocusReminder"
  | "DailyReflection"
  | "HadithReminder"
  | "QuranReminder";

export type NotificationPermissionState =
  | "default"
  | "granted"
  | "denied"
  | "unsupported";

export interface NotificationPreferences {
  enabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "23:00"
  quietHoursEnd: string; // "05:00"
  categories: Record<NotificationType, boolean>;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: true,
  quietHoursEnabled: true,
  quietHoursStart: "23:00",
  quietHoursEnd: "05:00",
  categories: {
    PrayerReminder: true,
    HabitReminder: true,
    StudyReminder: true,
    TaskReminder: true,
    FocusReminder: true,
    DailyReflection: true,
    HadithReminder: true,
    QuranReminder: true,
  },
};

const PREFS_KEY = "istiqamaah_notification_prefs";
const LEGACY_PREFS_KEY = "noorpath_notification_prefs";

export interface NotificationProvider {
  requestPermission(): Promise<NotificationPermissionState>;
  getPermission(): NotificationPermissionState;
  send(title: string, options?: NotificationOptions): Promise<boolean>;
}

class BrowserNotificationProvider implements NotificationProvider {
  getPermission(): NotificationPermissionState {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }
    return Notification.permission as NotificationPermissionState;
  }

  async requestPermission(): Promise<NotificationPermissionState> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }
    try {
      const res = await Notification.requestPermission();
      return res as NotificationPermissionState;
    } catch {
      return "denied";
    }
  }

  async send(title: string, options?: NotificationOptions): Promise<boolean> {
    if (this.getPermission() !== "granted") {
      return false;
    }
    try {
      new Notification(title, {
        icon: "/icons/icon-192.png",
        badge: "/icons/icon.svg",
        ...options,
      });
      return true;
    } catch (err) {
      console.warn("Browser notification failed to display:", err);
      return false;
    }
  }
}

export class NotificationService {
  private provider: NotificationProvider;

  constructor(provider: NotificationProvider = new BrowserNotificationProvider()) {
    this.provider = provider;
  }

  getPermission(): NotificationPermissionState {
    return this.provider.getPermission();
  }

  async requestPermission(): Promise<NotificationPermissionState> {
    return this.provider.requestPermission();
  }

  getPreferences(): NotificationPreferences {
    if (typeof window === "undefined") return DEFAULT_NOTIFICATION_PREFERENCES;
    try {
      const raw =
        localStorage.getItem(PREFS_KEY) ??
        localStorage.getItem(LEGACY_PREFS_KEY);
      if (!raw) return DEFAULT_NOTIFICATION_PREFERENCES;
      return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_NOTIFICATION_PREFERENCES;
    }
  }

  savePreferences(prefs: NotificationPreferences): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // Ignore
    }
  }

  isInQuietHours(now = new Date()): boolean {
    const prefs = this.getPreferences();
    if (!prefs.quietHoursEnabled) return false;

    const [startH, startM] = prefs.quietHoursStart.split(":").map(Number);
    const [endH, endM] = prefs.quietHoursEnd.split(":").map(Number);

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes > endMinutes) {
      // Overnight (e.g. 23:00 to 05:00)
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  async schedulePrayerReminder(
    prayerName: string,
    prayerTime: Date,
  ): Promise<boolean> {
    const prefs = this.getPreferences();
    if (!prefs.enabled || !prefs.categories.PrayerReminder) return false;

    if (this.isInQuietHours(prayerTime)) return false;

    const diffMs = prayerTime.getTime() - Date.now();
    // In browser context: if within 1 hour, set timeout
    if (diffMs > 0 && diffMs < 3600000) {
      setTimeout(() => {
        this.provider.send(`${prayerName} Prayer Time`, {
          body: `Time for ${prayerName} prayer. Plan your day around Salah.`,
          tag: `prayer-${prayerName}`,
        });
      }, diffMs);
      return true;
    }
    return false;
  }

  async scheduleHabitReminder(
    habitName: string,
    anchor?: string,
  ): Promise<boolean> {
    const prefs = this.getPreferences();
    if (!prefs.enabled || !prefs.categories.HabitReminder) return false;

    if (this.isInQuietHours()) return false;

    return this.provider.send(`Habit Reminder`, {
      body: `Time for: ${habitName}${anchor && anchor !== "none" ? ` (after ${anchor})` : ""}`,
      tag: `habit-${habitName}`,
    });
  }

  async scheduleTaskDueReminder(
    taskTitle: string,
    dueDate: Date,
  ): Promise<boolean> {
    const prefs = this.getPreferences();
    if (!prefs.enabled || !prefs.categories.TaskReminder) return false;

    if (this.isInQuietHours(dueDate)) return false;

    return this.provider.send(`Task Due Reminder`, {
      body: `Your task "${taskTitle}" is due today. Organize your time with Istiqamaah.`,
      tag: `task-${taskTitle}`,
    });
  }

  async scheduleUpcomingTaskReminder(
    taskTitle: string,
    minutesUntil: number,
  ): Promise<boolean> {
    const prefs = this.getPreferences();
    if (!prefs.enabled || !prefs.categories.TaskReminder) return false;

    if (this.isInQuietHours()) return false;

    return this.provider.send(`Upcoming Task`, {
      body: `"${taskTitle}" starts in ${minutesUntil} minutes.`,
      tag: `task-upcoming-${taskTitle}`,
    });
  }

  async scheduleFocusReminder(
    sessionTitle: string,
    minutes: number,
  ): Promise<boolean> {
    const prefs = this.getPreferences();
    if (!prefs.enabled || !prefs.categories.FocusReminder) return false;

    if (this.isInQuietHours()) return false;

    return this.provider.send(`Focus Session`, {
      body: `Time for a ${minutes}-minute focus session on ${sessionTitle}.`,
      tag: `focus-session-${sessionTitle}`,
    });
  }

  async sendFocusCompleteNotification(
    sessionTitle: string,
    minutes: number,
  ): Promise<boolean> {
    const prefs = this.getPreferences();
    if (!prefs.enabled || !prefs.categories.FocusReminder) return false;

    return this.provider.send(`Focus Session Complete!`, {
      body: `Alhamdulillah! You completed ${minutes} minutes on ${sessionTitle}. Take a break and prepare for prayer.`,
      tag: `focus-complete-${sessionTitle}`,
    });
  }

  async scheduleQuranReadingReminder(
    surahName?: string,
  ): Promise<boolean> {
    const prefs = this.getPreferences();
    if (!prefs.enabled || !prefs.categories.QuranReminder) return false;
    if (this.isInQuietHours()) return false;

    const body = surahName
      ? `Continue your Qur'an reading — Surah ${surahName} awaits.`
      : "Take a moment to read Qur'an. Even a few ayahs bring barakah.";

    return this.provider.send(`Qur'an Reading Reminder`, {
      body,
      tag: "quran-reading-reminder",
    });
  }

  async sendQuranTargetCompleteNotification(): Promise<boolean> {
    const prefs = this.getPreferences();
    if (!prefs.enabled || !prefs.categories.QuranReminder) return false;

    return this.provider.send(`Qur'an Target Completed!`, {
      body: "You've completed today's Qur'an reading target. Alhamdulillah!",
      tag: "quran-target-complete",
    });
  }

  async scheduleQuranGoalReminder(
    goalTitle: string,
  ): Promise<boolean> {
    const prefs = this.getPreferences();
    if (!prefs.enabled || !prefs.categories.QuranReminder) return false;
    if (this.isInQuietHours()) return false;

    return this.provider.send(`Qur'an Goal Reminder`, {
      body: `Your goal "${goalTitle}" is progressing. Continue your reading today.`,
      tag: `quran-goal-${goalTitle}`,
    });
  }
}

export const notificationService = new NotificationService();
