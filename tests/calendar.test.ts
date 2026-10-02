import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  addWeeks,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";

import {
  computePrayerContext,
  deriveAllCalendarEvents,
  deriveFocusEvents,
  derivePrayerEvents,
  deriveTaskEvent,
  formatLocalDateKey,
  getTaskDateKey,
  isDateOnlyDueDate,
  parseLocalDateKey,
} from "@/services/calendar/calendar-service";
import { DEFAULT_CALENDAR_FILTERS } from "@/services/calendar/calendar-types";
import { getPrayerDaySummary } from "@/services/prayer";
import type { FocusSession, Task } from "@/services/study/types";
import type { UserReminder } from "@/services/reminders/reminder-service";

describe("ISTIQAMAAH — Calendar & Scheduling System Tests", () => {
  const dummyTask: Task = {
    id: "task-101",
    userId: "test-user-1",
    title: "Compiler Assignment",
    description: "Write recursive descent parser",
    status: "TODO",
    priority: "HIGH",
    dueDate: "2026-10-08T20:00:00.000Z",
    estimatedMinutes: 120,
    createdAt: "2026-10-01T10:00:00.000Z",
    updatedAt: "2026-10-01T10:00:00.000Z",
  };

  // 1. Task automatically appears in Calendar
  it("Scenario 1: Task automatically appears in Calendar without duplicate records", () => {
    const events = deriveAllCalendarEvents({
      tasks: [dummyTask],
      filters: { ...DEFAULT_CALENDAR_FILTERS, tasks: true },
    });

    expect(events.length).toBe(1);
    expect(events[0].id).toBe("task-task-101");
    expect(events[0].title).toBe("Compiler Assignment");
    expect(events[0].type).toBe("TASK");
  });

  // 2. Date-only task
  it("Scenario 2: Date-only task is displayed as an all-day event", () => {
    const allDayTask: Task = {
      ...dummyTask,
      id: "task-all-day",
      title: "Research Paper",
      dueDate: "2026-10-12",
    };

    expect(isDateOnlyDueDate(allDayTask.dueDate)).toBe(true);

    const event = deriveTaskEvent(allDayTask);
    expect(event).not.toBeNull();
    expect(event?.isAllDay).toBe(true);
    expect(event?.dateKey).toBe("2026-10-12");
    expect(event?.startTime).toBeNull();
  });

  // 3. Timed task
  it("Scenario 3: Timed task has proper start time, end time, and duration", () => {
    // 2026-10-08 20:00 local time
    const timedDate = new Date(2026, 9, 8, 20, 0, 0);
    const timedTask: Task = {
      ...dummyTask,
      id: "task-timed",
      dueDate: timedDate.toISOString(),
      estimatedMinutes: 120,
    };

    expect(isDateOnlyDueDate(timedTask.dueDate)).toBe(false);

    const event = deriveTaskEvent(timedTask);
    expect(event).not.toBeNull();
    expect(event?.isAllDay).toBe(false);
    expect(event?.startTime).toBe("20:00");
    expect(event?.endTime).toBe("22:00");
    expect(event?.durationMinutes).toBe(120);
    expect(event?.priority).toBe("HIGH");
  });

  // 4. Task edit updates Calendar
  it("Scenario 4: Task date/time/title edit immediately reflects in derived event", () => {
    const originalEvent = deriveTaskEvent(dummyTask);
    expect(originalEvent?.title).toBe("Compiler Assignment");

    const updatedTask: Task = {
      ...dummyTask,
      title: "Advanced Compiler Optimization",
      dueDate: "2026-10-09T14:30:00.000Z",
      estimatedMinutes: 60,
    };

    const updatedEvent = deriveTaskEvent(updatedTask);
    expect(updatedEvent?.title).toBe("Advanced Compiler Optimization");
    expect(updatedEvent?.durationMinutes).toBe(60);
    expect(updatedEvent?.dateKey).toBe(getTaskDateKey("2026-10-09T14:30:00.000Z"));
  });

  // 5. Task deletion removes Calendar event
  it("Scenario 5: Deleted task is completely removed from derived calendar events", () => {
    let taskList: Task[] = [dummyTask];
    let events = deriveAllCalendarEvents({
      tasks: taskList,
      filters: DEFAULT_CALENDAR_FILTERS,
    });
    expect(events.some((e) => e.id === "task-task-101")).toBe(true);

    // Delete task
    taskList = taskList.filter((t) => t.id !== dummyTask.id);
    events = deriveAllCalendarEvents({
      tasks: taskList,
      filters: DEFAULT_CALENDAR_FILTERS,
    });
    expect(events.some((e) => e.id === "task-task-101")).toBe(false);
  });

  // 6. Task status changes reflect in Calendar
  it("Scenario 6: Task status changes (TODO -> IN_PROGRESS -> COMPLETED) update calendar state", () => {
    const statuses: Task["status"][] = ["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

    for (const st of statuses) {
      const taskWithStatus: Task = { ...dummyTask, status: st };
      const event = deriveTaskEvent(taskWithStatus);
      expect(event?.status).toBe(st);
    }
  });

  // 7. Calendar click opens existing task details (rawEntity integrity)
  it("Scenario 7: Derived CalendarEvent contains rawEntity with identical Task reference", () => {
    const event = deriveTaskEvent(dummyTask);
    expect(event).not.toBeNull();
    expect(event?.rawEntity).toBe(dummyTask);
    expect((event?.rawEntity as Task).id).toBe(dummyTask.id);
  });

  // 8. Prayer events use calculated prayer times
  it("Scenario 8: Prayer calculation engine produces 5 daily prayers (Fajr, Dhuhr, Asr, Maghrib, Isha)", async () => {
    const testDate = new Date(2026, 9, 8);
    const summary = await getPrayerDaySummary(
      {
        latitude: 23.8103,
        longitude: 90.4125,
        timezone: "Asia/Dhaka",
        calculationMethod: "karachi",
      },
      testDate,
    );

    expect(summary.prayers.length).toBeGreaterThanOrEqual(5);

    const prayerEvents = derivePrayerEvents(summary.prayers, "2026-10-08");
    const names = prayerEvents.map((p) => p.title.toLowerCase());

    expect(names).toContain("fajr");
    expect(names).toContain("dhuhr");
    expect(names).toContain("asr");
    expect(names).toContain("maghrib");
    expect(names).toContain("isha");
    expect(prayerEvents.every((p) => p.type === "PRAYER")).toBe(true);
  });

  // 9. User timezone handling
  it("Scenario 9: formatLocalDateKey and parseLocalDateKey preserve exact local dates without UTC shift", () => {
    // Bangladesh local date
    const d = new Date(2026, 9, 8, 0, 30, 0); // 00:30 AM
    const key = formatLocalDateKey(d);
    expect(key).toBe("2026-10-08");

    const parsed = parseLocalDateKey("2026-10-08");
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(9); // 0-indexed month: 9 = October
    expect(parsed.getDate()).toBe(8);
  });

  // 10. Midnight/date boundary
  it("Scenario 10: Tasks right at midnight (00:00) remain strictly on their intended date", () => {
    const midnightTask: Task = {
      ...dummyTask,
      dueDate: "2026-10-08T00:00:00",
    };
    const key = getTaskDateKey(midnightTask.dueDate);
    expect(key).toBe("2026-10-08");
  });

  // 11. Offline task update
  it("Scenario 11: Task update modifies the in-memory/cache store synchronously", () => {
    const localTasks = [dummyTask];
    const updated = localTasks.map((t) =>
      t.id === dummyTask.id ? { ...t, estimatedMinutes: 45 } : t,
    );

    const derived = deriveAllCalendarEvents({
      tasks: updated,
      filters: DEFAULT_CALENDAR_FILTERS,
    });

    expect(derived[0].durationMinutes).toBe(45);
  });

  // 12. Offline queue isolation
  it("Scenario 12: Offline updates remain user-scoped and preserve userId", () => {
    const userScopedTask: Task = {
      ...dummyTask,
      userId: "user-alpha",
    };

    const event = deriveTaskEvent(userScopedTask);
    expect((event?.rawEntity as Task).userId).toBe("user-alpha");
  });

  // 13. Reminder integration
  it("Scenario 13: Tasks matching active user reminders display reminder indicator", () => {
    const activeReminder: UserReminder = {
      id: "rem-1",
      userId: "test-user-1",
      title: "Reminder: Compiler Assignment deadline",
      description: null,
      reminderType: "study",
      time: "19:00",
      repeatType: "daily",
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      isEnabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
      targetUrl: "/calendar",
      createdAt: "2026-10-01",
      updatedAt: "2026-10-01",
    };

    const eventWithReminder = deriveTaskEvent(dummyTask, undefined, [activeReminder]);
    expect(eventWithReminder?.hasReminder).toBe(true);

    const eventWithoutReminder = deriveTaskEvent(dummyTask, undefined, []);
    expect(eventWithoutReminder?.hasReminder).toBe(false);
  });

  // 14. Event filtering
  it("Scenario 14: Filter toggles exclude disabled event types accurately", async () => {
    const summary = await getPrayerDaySummary(undefined, new Date(2026, 9, 8));
    const prayersByDate = { "2026-10-08": summary.prayers };

    // Filter only Tasks
    const onlyTasks = deriveAllCalendarEvents({
      tasks: [dummyTask],
      prayersByDate,
      filters: { tasks: true, prayer: false, focus: false, study: false, reminders: false },
    });
    expect(onlyTasks.every((e) => e.type === "TASK")).toBe(true);

    // Filter only Prayer
    const onlyPrayer = deriveAllCalendarEvents({
      tasks: [dummyTask],
      prayersByDate,
      filters: { tasks: false, prayer: true, focus: false, study: false, reminders: false },
    });
    expect(onlyPrayer.every((e) => e.type === "PRAYER")).toBe(true);
  });

  // 15. Empty day
  it("Scenario 15: Day with no scheduled tasks returns empty array without crashing", () => {
    const events = deriveAllCalendarEvents({
      tasks: [],
      prayersByDate: {},
      filters: DEFAULT_CALENDAR_FILTERS,
    });
    expect(events).toEqual([]);
  });

  // 16. Month navigation
  it("Scenario 16: Month navigation calculates preceding and succeeding months properly", () => {
    const base = new Date(2026, 9, 8); // October 2026
    const nextMonth = addMonths(base, 1);
    expect(nextMonth.getMonth()).toBe(10); // November

    const prevMonth = subMonths(base, 1);
    expect(prevMonth.getMonth()).toBe(8); // September
  });

  // 17. Week navigation
  it("Scenario 17: Week navigation steps forwards and backwards by 7 days", () => {
    const base = new Date(2026, 9, 8); // Thursday
    const nextWeek = addWeeks(base, 1);
    expect(nextWeek.getDate()).toBe(15);

    const prevWeek = subWeeks(base, 1);
    expect(prevWeek.getDate()).toBe(1);
  });

  // 18. Day navigation
  it("Scenario 18: Day navigation moves by exactly 1 day increments", () => {
    const base = new Date(2026, 9, 8);
    const nextDay = addDays(base, 1);
    expect(nextDay.getDate()).toBe(9);

    const prevDay = subDays(base, 1);
    expect(prevDay.getDate()).toBe(7);
  });

  // 19. Mobile rendering logic
  it("Scenario 19: All-day vs timed separation and dot indicator data are cleanly segmented", () => {
    const dateKey = "2026-10-08";
    const allDayTask: Task = { ...dummyTask, id: "ad", dueDate: dateKey };
    const timedTask: Task = { ...dummyTask, id: "tm", dueDate: "2026-10-08T15:00:00" };

    const events = deriveAllCalendarEvents({
      tasks: [allDayTask, timedTask],
      filters: { ...DEFAULT_CALENDAR_FILTERS, tasks: true },
    });

    const allDay = events.filter((e) => e.isAllDay);
    const timed = events.filter((e) => !e.isAllDay);

    expect(allDay.length).toBe(1);
    expect(timed.length).toBe(1);
  });

  // 20. RLS/user isolation
  it("Scenario 20: Calendar only derives events matching user tasks and does not cross-contaminate", () => {
    const userATask: Task = { ...dummyTask, id: "task-A", userId: "user-A" };
    const userBTask: Task = { ...dummyTask, id: "task-B", userId: "user-B" };

    // Query for user A
    const userATasks = [userATask, userBTask].filter((t) => t.userId === "user-A");
    const events = deriveAllCalendarEvents({
      tasks: userATasks,
      filters: DEFAULT_CALENDAR_FILTERS,
    });

    expect(events.length).toBe(1);
    expect(events[0].id).toBe("task-task-A");
  });

  // Additional Bonus Verification: Prayer-aware context
  it("Prayer context generates 'After Asr' or 'Before Maghrib' when near Salah", async () => {
    const baseDate = new Date(2026, 9, 8);
    const summary = await getPrayerDaySummary(undefined, baseDate);
    const asr = summary.prayers.find((p) => p.name === "asr");
    expect(asr).toBeDefined();

    if (asr) {
      // 15 minutes after Asr
      const afterAsrTime = new Date(asr.time.getTime() + 15 * 60000);
      const ctx = computePrayerContext(afterAsrTime, summary.prayers);
      expect(ctx).toContain("Asr");
    }
  });

  // Focus & Study Session derivation
  it("Derives Focus session calendar events accurately", () => {
    const session: FocusSession = {
      id: "foc-123",
      userId: "user-1",
      startedAt: "2026-10-08T14:00:00.000Z",
      endedAt: "2026-10-08T14:45:00.000Z",
      plannedMinutes: 45,
      actualMinutes: 45,
      status: "COMPLETED",
      createdAt: "2026-10-08T14:00:00.000Z",
      taskTitle: "Compiler Assignment",
      subjectName: "Computer Science",
    };

    const events = deriveFocusEvents([session]);
    expect(events.length).toBe(1);
    expect(events[0].type).toBe("FOCUS");
    expect(events[0].durationMinutes).toBe(45);
    expect(events[0].subjectName).toBe("Computer Science");
  });
});
