import type { FocusSession, Task } from "@/services/study/types";
import type { PrayerTime } from "@/services/prayer/types";
import type { UserReminder } from "@/services/reminders/reminder-service";

export type CalendarEventType = "TASK" | "PRAYER" | "FOCUS" | "STUDY" | "REMINDER";

export type CalendarViewMode = "month" | "week" | "day";

export interface CalendarFilters {
  tasks: boolean;
  prayer: boolean;
  focus: boolean;
  study: boolean;
  reminders: boolean;
}

export const DEFAULT_CALENDAR_FILTERS: CalendarFilters = {
  tasks: true,
  prayer: true,
  focus: false,
  study: false,
  reminders: false,
};

export const CALENDAR_FILTERS_STORAGE_KEY = "istiqamaah_calendar_filters_v1";

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  description?: string | null;
  dateKey: string; // "YYYY-MM-DD" in user's local timezone
  isAllDay: boolean;
  startTime?: string | null; // "HH:mm" or "h:mm a"
  endTime?: string | null;   // "HH:mm" or "h:mm a"
  startDate?: Date;          // Real Date object for sorting
  endDate?: Date;
  durationMinutes?: number;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status?: string;           // "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  color?: string;            // Accent color (emerald, gold, subject color)
  subjectName?: string;
  hasReminder?: boolean;
  prayerContext?: string;    // e.g. "After Asr", "Before Maghrib"
  rawEntity: Task | PrayerTime | FocusSession | UserReminder | Record<string, unknown>;
}
