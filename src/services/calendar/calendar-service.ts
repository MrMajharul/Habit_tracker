/**
 * Calendar Service
 *
 * Derives unified, single-source-of-truth calendar events from:
 * - Existing Tasks (automatic task sync, date-only and timed tasks)
 * - Calculated Prayer Times (local Adhan calculation)
 * - Focus & Study Sessions (actual logged focus history)
 * - User Reminders
 *
 * Implements strict timezone safety without UTC midnight shift issues.
 */

import { format } from "date-fns";

import type { FocusSession, Task } from "@/services/study/types";
import type { PrayerTime } from "@/services/prayer/types";
import type { UserReminder } from "@/services/reminders/reminder-service";
import {
  CALENDAR_FILTERS_STORAGE_KEY,
  type CalendarEvent,
  type CalendarEventType,
  type CalendarFilters,
  DEFAULT_CALENDAR_FILTERS,
} from "./calendar-types";

/**
 * Formats a Date object as a local "YYYY-MM-DD" key safely using local date values.
 * Avoids any UTC conversion shifts.
 */
export function formatLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parses a "YYYY-MM-DD" string into a Date set to 12:00:00 local noon.
 * Using midday guarantees that DST transitions or boundary timezones never shift the day.
 */
export function parseLocalDateKey(dateStr: string): Date {
  if (dateStr.length === 10 && dateStr[4] === "-" && dateStr[7] === "-") {
    const parts = dateStr.split("-").map(Number);
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    return new Date(year, month - 1, day, 12, 0, 0);
  }
  return new Date(dateStr);
}

/**
 * Determines whether a task's dueDate represents a date-only (all-day) deadline
 * vs a specific timed deadline.
 */
export function isDateOnlyDueDate(dueDate: string | null | undefined): boolean {
  if (!dueDate) return false;
  // Format: "YYYY-MM-DD"
  if (dueDate.length === 10 && dueDate[4] === "-" && dueDate[7] === "-") {
    return true;
  }
  // If ISO string explicitly set to midnight or end of day (23:59:59)
  try {
    const d = new Date(dueDate);
    if (isNaN(d.getTime())) return false;
    const h = d.getHours();
    const m = d.getMinutes();
    const s = d.getSeconds();
    return (h === 0 && m === 0 && s === 0) || (h === 23 && m === 59 && s >= 50);
  } catch {
    return false;
  }
}

/**
 * Extracts the local "YYYY-MM-DD" date key from a task's dueDate.
 */
export function getTaskDateKey(dueDate: string | null | undefined): string | null {
  if (!dueDate) return null;
  if (dueDate.length === 10 && dueDate[4] === "-" && dueDate[7] === "-") {
    return dueDate;
  }
  try {
    const d = new Date(dueDate);
    if (isNaN(d.getTime())) return null;
    return formatLocalDateKey(d);
  } catch {
    return null;
  }
}

/**
 * Computes contextual prayer relation (e.g. "After Asr", "Before Maghrib")
 * for a timed event on a day with calculated prayer times.
 */
export function computePrayerContext(
  eventTime: Date,
  dayPrayers?: PrayerTime[],
): string | undefined {
  if (!dayPrayers || dayPrayers.length === 0) return undefined;

  const validPrayers = dayPrayers
    .filter((p) => ["fajr", "dhuhr", "asr", "maghrib", "isha"].includes(p.name))
    .sort((a, b) => a.time.getTime() - b.time.getTime());

  const eventMs = eventTime.getTime();

  for (let i = 0; i < validPrayers.length; i++) {
    const prayer = validPrayers[i];
    const prayerMs = prayer.time.getTime();
    const diffMinutes = Math.round((eventMs - prayerMs) / 60000);

    // If within 40 minutes after this prayer
    if (diffMinutes >= 0 && diffMinutes <= 45) {
      return `After ${prayer.label}`;
    }

    // If within 40 minutes before this prayer
    if (diffMinutes < 0 && diffMinutes >= -45) {
      return `Before ${prayer.label}`;
    }
  }

  // Check which prayer window it falls into
  for (let i = 0; i < validPrayers.length - 1; i++) {
    const current = validPrayers[i];
    const next = validPrayers[i + 1];
    if (eventMs >= current.time.getTime() && eventMs < next.time.getTime()) {
      return `Between ${current.label} & ${next.label}`;
    }
  }

  const last = validPrayers[validPrayers.length - 1];
  if (eventMs >= last.time.getTime()) {
    return `After ${last.label}`;
  }

  return undefined;
}

/**
 * Derives a CalendarEvent from a Task record.
 */
export function deriveTaskEvent(
  task: Task,
  dayPrayers?: PrayerTime[],
  reminders?: UserReminder[],
): CalendarEvent | null {
  const dateKey = getTaskDateKey(task.dueDate);
  if (!dateKey) return null;

  const isAllDay = isDateOnlyDueDate(task.dueDate);
  let startTime: string | null = null;
  let endTime: string | null = null;
  let startDate: Date | undefined;
  let endDate: Date | undefined;
  let prayerContext: string | undefined;

  if (!isAllDay && task.dueDate) {
    try {
      startDate = new Date(task.dueDate);
      if (!isNaN(startDate.getTime())) {
        startTime = format(startDate, "HH:mm");
        const duration = task.estimatedMinutes || 30;
        endDate = new Date(startDate.getTime() + duration * 60000);
        endTime = format(endDate, "HH:mm");
        prayerContext = computePrayerContext(startDate, dayPrayers);
      }
    } catch {
      // Fallback to all-day if parsing fails
    }
  }

  // Check if a reminder matches this task
  const hasReminder = Boolean(
    reminders &&
      reminders.some(
        (r) =>
          r.isEnabled &&
          (r.title.toLowerCase().includes(task.title.toLowerCase()) ||
            r.reminderType === "study"),
      ),
  );

  return {
    id: `task-${task.id}`,
    type: "TASK",
    title: task.title,
    description: task.description,
    dateKey,
    isAllDay,
    startTime,
    endTime,
    startDate,
    endDate,
    durationMinutes: task.estimatedMinutes || undefined,
    priority: task.priority,
    status: task.status,
    color: task.subject?.color || undefined,
    subjectName: task.subject?.name || undefined,
    hasReminder,
    prayerContext,
    rawEntity: task,
  };
}

/**
 * Derives CalendarEvents for calculated prayer times on a date.
 */
export function derivePrayerEvents(
  prayers: PrayerTime[],
  dateKey: string,
): CalendarEvent[] {
  return prayers
    .filter((p) => ["fajr", "dhuhr", "asr", "maghrib", "isha"].includes(p.name))
    .map((p) => {
      const prayerDate = p.time instanceof Date ? p.time : new Date(p.time);
      const timeStr = format(prayerDate, "HH:mm");

      return {
        id: `prayer-${p.name}-${dateKey}`,
        type: "PRAYER" as CalendarEventType,
        title: p.label,
        description: `Obligatory Salah · ${timeStr}`,
        dateKey,
        isAllDay: false,
        startTime: timeStr,
        endTime: null,
        startDate: prayerDate,
        color: "#10b981", // emerald
        rawEntity: p,
      };
    });
}

/**
 * Derives CalendarEvents from logged focus sessions.
 */
export function deriveFocusEvents(sessions: FocusSession[]): CalendarEvent[] {
  return sessions.map((s) => {
    const startDate = new Date(s.startedAt);
    const dateKey = formatLocalDateKey(startDate);
    const duration = s.actualMinutes || s.plannedMinutes || 25;
    const endDate = s.endedAt
      ? new Date(s.endedAt)
      : new Date(startDate.getTime() + duration * 60000);

    return {
      id: `focus-${s.id}`,
      type: "FOCUS" as CalendarEventType,
      title: s.taskTitle ? `Focus: ${s.taskTitle}` : "Focus Session",
      description: s.subjectName ? `Subject: ${s.subjectName}` : undefined,
      dateKey,
      isAllDay: false,
      startTime: format(startDate, "HH:mm"),
      endTime: format(endDate, "HH:mm"),
      startDate,
      endDate,
      durationMinutes: duration,
      color: "#f59e0b", // gold/amber
      subjectName: s.subjectName,
      rawEntity: s,
    };
  });
}

/**
 * Derives CalendarEvents from user reminders.
 */
export function deriveReminderEvents(
  reminders: UserReminder[],
  date: Date,
  dateKey: string,
): CalendarEvent[] {
  const dayOfWeek = date.getDay(); // 0 = Sun, 6 = Sat

  return reminders
    .filter((r) => {
      if (!r.isEnabled) return false;
      if (r.repeatType === "daily") return true;
      if (r.repeatType === "weekdays") return dayOfWeek >= 1 && dayOfWeek <= 5;
      if (r.daysOfWeek && r.daysOfWeek.includes(dayOfWeek)) return true;
      return false;
    })
    .map((r) => {
      const [hours, minutes] = r.time.split(":").map(Number);
      const reminderDate = new Date(date);
      reminderDate.setHours(hours || 0, minutes || 0, 0, 0);

      return {
        id: `reminder-${r.id}-${dateKey}`,
        type: "REMINDER" as CalendarEventType,
        title: r.title,
        description: r.description,
        dateKey,
        isAllDay: false,
        startTime: r.time,
        startDate: reminderDate,
        color: "#8b5cf6", // purple/indigo
        rawEntity: r,
      };
    });
}

/**
 * Unified derivation function that aggregates all sources into filtered, chronologically sorted events.
 */
export function deriveAllCalendarEvents(params: {
  tasks: Task[];
  prayersByDate?: Record<string, PrayerTime[]>;
  focusSessions?: FocusSession[];
  reminders?: UserReminder[];
  filters: CalendarFilters;
}): CalendarEvent[] {
  const { tasks, prayersByDate = {}, focusSessions = [], reminders = [], filters } = params;
  const events: CalendarEvent[] = [];

  // 1. Tasks
  if (filters.tasks) {
    for (const task of tasks) {
      const dateKey = getTaskDateKey(task.dueDate);
      const dayPrayers = dateKey ? prayersByDate[dateKey] : undefined;
      const event = deriveTaskEvent(task, dayPrayers, reminders);
      if (event) {
        events.push(event);
      }
    }
  }

  // 2. Prayers
  if (filters.prayer) {
    for (const [dateKey, prayers] of Object.entries(prayersByDate)) {
      events.push(...derivePrayerEvents(prayers, dateKey));
    }
  }

  // 3. Focus sessions
  if (filters.focus && focusSessions.length > 0) {
    events.push(...deriveFocusEvents(focusSessions));
  }

  // 4. Reminders
  if (filters.reminders && reminders.length > 0) {
    for (const dateKey of Object.keys(prayersByDate)) {
      const d = parseLocalDateKey(dateKey);
      events.push(...deriveReminderEvents(reminders, d, dateKey));
    }
  }

  // Sort events chronologically: All-day events first, then by startDate
  events.sort((a, b) => {
    // If different days, sort by dateKey
    if (a.dateKey !== b.dateKey) {
      return a.dateKey.localeCompare(b.dateKey);
    }
    // All-day events come first on the same day
    if (a.isAllDay && !b.isAllDay) return -1;
    if (!a.isAllDay && b.isAllDay) return 1;

    // Both timed: sort by start time
    const timeA = a.startDate ? a.startDate.getTime() : 0;
    const timeB = b.startDate ? b.startDate.getTime() : 0;
    return timeA - timeB;
  });

  return events;
}

/**
 * Filters state persistence
 */
export function getSavedCalendarFilters(): CalendarFilters {
  if (typeof window === "undefined") return DEFAULT_CALENDAR_FILTERS;
  try {
    const raw = localStorage.getItem(CALENDAR_FILTERS_STORAGE_KEY);
    if (!raw) return DEFAULT_CALENDAR_FILTERS;
    return { ...DEFAULT_CALENDAR_FILTERS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CALENDAR_FILTERS;
  }
}

export function saveCalendarFilters(filters: CalendarFilters): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CALENDAR_FILTERS_STORAGE_KEY, JSON.stringify(filters));
  } catch {
    // Ignore quota limits
  }
}
