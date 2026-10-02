"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

import { TaskDialog } from "@/components/tasks/task-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  deriveAllCalendarEvents,
  formatLocalDateKey,
  getSavedCalendarFilters,
  saveCalendarFilters,
} from "@/services/calendar/calendar-service";
import {
  DEFAULT_CALENDAR_FILTERS,
  type CalendarEvent,
  type CalendarFilters,
  type CalendarViewMode,
} from "@/services/calendar/calendar-types";
import {
  getPrayerDaySummary,
  type PrayerSettings,
  type PrayerTime,
} from "@/services/prayer";
import {
  DEFAULT_PRAYER_SETTINGS,
  fetchUserPrayerSettings,
} from "@/services/prayer/prayer-settings-service";
import { focusService } from "@/services/study/focus-service";
import { subjectService } from "@/services/study/subject-service";
import { taskService } from "@/services/study/task-service";
import type { FocusSession, Subject, Task, TaskStatus } from "@/services/study/types";
import { reminderService, type UserReminder } from "@/services/reminders/reminder-service";

import { CalendarDayDetails } from "./calendar-day-details";
import { CalendarDayView } from "./calendar-day-view";
import { CalendarFiltersBar } from "./calendar-filters";
import { CalendarMonthView } from "./calendar-month-view";
import { CalendarWeekView } from "./calendar-week-view";

export function CalendarPageClient() {
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  // Filters state (defaults match SSR, persisted in localStorage on client)
  const [filters, setFilters] = useState<CalendarFilters>(DEFAULT_CALENDAR_FILTERS);

  // Entity data states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [reminders, setReminders] = useState<UserReminder[]>([]);
  const [prayerSettings, setPrayerSettings] = useState<PrayerSettings>(DEFAULT_PRAYER_SETTINGS);
  const [prayersByDate, setPrayersByDate] = useState<Record<string, PrayerTime[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Task Dialog modal state
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [dialogDefaultDueDate, setDialogDefaultDueDate] = useState<string | undefined>();

  // Load initial data
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [
          loadedTasks,
          loadedSubjects,
          loadedSessions,
          loadedReminders,
          loadedPrayerSettings,
        ] = await Promise.all([
          taskService.getTasks(),
          subjectService.getSubjects(),
          focusService.getSessions(),
          reminderService.getReminders(),
          fetchUserPrayerSettings(),
        ]);

        if (isMounted) {
          setFilters(getSavedCalendarFilters());
          setTasks(loadedTasks);
          setSubjects(loadedSubjects);
          setFocusSessions(loadedSessions);
          setReminders(loadedReminders);
          setPrayerSettings(loadedPrayerSettings);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to load calendar data:", err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Update filters and persist
  const handleFiltersChange = (newFilters: CalendarFilters) => {
    setFilters(newFilters);
    saveCalendarFilters(newFilters);
  };

  // Compute calculated prayer times for the visible date range asynchronously
  useEffect(() => {
    let isCancelled = false;

    async function loadPrayers() {
      let start: Date;
      let end: Date;

      if (viewMode === "month") {
        const mStart = startOfMonth(currentDate);
        const mEnd = endOfMonth(mStart);
        start = startOfWeek(mStart);
        end = endOfWeek(mEnd);
      } else if (viewMode === "week") {
        start = startOfWeek(currentDate);
        end = endOfWeek(currentDate);
      } else {
        // Day view
        start = selectedDate;
        end = selectedDate;
      }

      const days = eachDayOfInterval({ start, end });
      const allDays = [...days, selectedDate];

      try {
        const results = await Promise.all(
          allDays.map(async (d) => {
            const key = formatLocalDateKey(d);
            const summary = await getPrayerDaySummary(prayerSettings, d);
            return { key, prayers: summary.prayers };
          }),
        );

        if (!isCancelled) {
          const map: Record<string, PrayerTime[]> = {};
          for (const res of results) {
            map[res.key] = res.prayers;
          }
          setPrayersByDate(map);
        }
      } catch (err) {
        console.warn("Failed to calculate prayer times:", err);
      }
    }

    loadPrayers();

    return () => {
      isCancelled = true;
    };
  }, [currentDate, selectedDate, viewMode, prayerSettings]);

  // Derive all calendar events (single source of truth)
  const calendarEvents = useMemo(() => {
    return deriveAllCalendarEvents({
      tasks,
      prayersByDate,
      focusSessions,
      reminders,
      filters,
    });
  }, [tasks, prayersByDate, focusSessions, reminders, filters]);

  // Date Navigation Actions
  const handlePrev = useCallback(() => {
    if (viewMode === "month") {
      setCurrentDate((d) => subMonths(d, 1));
    } else if (viewMode === "week") {
      setCurrentDate((d) => subWeeks(d, 1));
    } else {
      const prev = subDays(selectedDate, 1);
      setSelectedDate(prev);
      setCurrentDate(prev);
    }
  }, [viewMode, selectedDate]);

  const handleNext = useCallback(() => {
    if (viewMode === "month") {
      setCurrentDate((d) => addMonths(d, 1));
    } else if (viewMode === "week") {
      setCurrentDate((d) => addWeeks(d, 1));
    } else {
      const next = addDays(selectedDate, 1);
      setSelectedDate(next);
      setCurrentDate(next);
    }
  }, [viewMode, selectedDate]);

  const handleToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  }, []);

  // Event interaction handlers
  const handleEventClick = useCallback((event: CalendarEvent) => {
    if (event.type === "TASK") {
      setTaskToEdit(event.rawEntity as Task);
      setDialogDefaultDueDate(event.dateKey);
      setIsTaskDialogOpen(true);
    }
  }, []);

  const handleToggleTaskStatus = useCallback(async (event: CalendarEvent) => {
    if (event.type !== "TASK") return;
    const task = event.rawEntity as Task;
    const nextStatus: TaskStatus = task.status === "COMPLETED" ? "TODO" : "COMPLETED";

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: nextStatus,
              completedAt: nextStatus === "COMPLETED" ? new Date().toISOString() : null,
            }
          : t,
      ),
    );

    try {
      await taskService.updateTask(task.id, {
        status: nextStatus,
        completedAt: nextStatus === "COMPLETED" ? new Date().toISOString() : null,
      });
      toast.success(
        nextStatus === "COMPLETED" ? "Task marked completed" : "Task marked to do",
      );
    } catch {
      // Revert on error
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
      toast.error("Failed to update task status.");
    }
  }, []);

  const handleAddTaskForDate = useCallback((dateKey: string) => {
    setTaskToEdit(null);
    setDialogDefaultDueDate(dateKey);
    setIsTaskDialogOpen(true);
  }, []);

  // When task is created or updated in TaskDialog
  const handleTaskSave = useCallback((savedTask: Task) => {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === savedTask.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = savedTask;
        return copy;
      }
      return [savedTask, ...prev];
    });
  }, []);

  // Formatted date title
  const dateTitle = useMemo(() => {
    if (viewMode === "month") {
      return format(currentDate, "MMMM yyyy");
    }
    if (viewMode === "week") {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
    }
    return format(selectedDate, "EEEE, MMMM d, yyyy");
  }, [viewMode, currentDate, selectedDate]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <CalendarIcon className="size-7 text-primary" />
            <span>Calendar</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Your unified schedule combining daily Salah, study tasks, and focus sessions.
          </p>
        </div>

        {/* Action: Add Task */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => handleAddTaskForDate(formatLocalDateKey(selectedDate))}
            className="gap-2 shadow-sm"
          >
            <Plus className="size-4" />
            <span>New Task</span>
          </Button>
        </div>
      </div>

      {/* Calendar Control Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card p-3 shadow-sm">
        {/* Date Navigation (Today, Prev, Title, Next) */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="h-9 px-3 text-xs font-semibold"
          >
            Today
          </Button>

          <div className="flex items-center rounded-lg border border-border bg-muted/20">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Previous period"
              onClick={handlePrev}
              className="h-9 w-9 rounded-r-none hover:bg-muted/50"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Next period"
              onClick={handleNext}
              className="h-9 w-9 rounded-l-none hover:bg-muted/50"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-foreground pl-1">
            {dateTitle}
          </h2>
        </div>

        {/* View Mode Switcher (Month | Week | Day) */}
        <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
          <div className="inline-flex rounded-xl border border-border bg-muted/40 p-1 text-xs">
            {(["month", "week", "day"] as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={cn(
                  "rounded-lg px-3 py-1.5 font-semibold capitalize transition-all select-none focus:outline-none focus:ring-1 focus:ring-ring",
                  viewMode === mode
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <CalendarFiltersBar filters={filters} onChange={handleFiltersChange} />

      {/* Main Calendar Content Area */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[480px] w-full rounded-2xl" />
        </div>
      ) : (
        <>
          {viewMode === "month" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Month Grid */}
              <div className="lg:col-span-8 xl:col-span-9">
                <CalendarMonthView
                  currentDate={currentDate}
                  selectedDate={selectedDate}
                  events={calendarEvents}
                  onSelectDate={setSelectedDate}
                  onEventClick={handleEventClick}
                  onToggleStatus={handleToggleTaskStatus}
                />
              </div>

              {/* Selected Day Panel (Shows detailed chronological events for selected date) */}
              <div className="lg:col-span-4 xl:col-span-3">
                <CalendarDayDetails
                  selectedDate={selectedDate}
                  events={calendarEvents}
                  onEventClick={handleEventClick}
                  onToggleStatus={handleToggleTaskStatus}
                  onAddTask={handleAddTaskForDate}
                />
              </div>
            </div>
          )}

          {viewMode === "week" && (
            <CalendarWeekView
              currentDate={currentDate}
              selectedDate={selectedDate}
              events={calendarEvents}
              onSelectDate={setSelectedDate}
              onEventClick={handleEventClick}
              onToggleStatus={handleToggleTaskStatus}
            />
          )}

          {viewMode === "day" && (
            <CalendarDayView
              selectedDate={selectedDate}
              events={calendarEvents}
              onEventClick={handleEventClick}
              onToggleStatus={handleToggleTaskStatus}
              onAddTask={handleAddTaskForDate}
            />
          )}
        </>
      )}

      {/* Task Creation & Edit Modal (Reusing existing TaskDialog) */}
      <TaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        taskToEdit={taskToEdit}
        defaultDueDate={dialogDefaultDueDate}
        subjects={subjects}
        onSave={handleTaskSave}
        createTaskFn={taskService.createTask.bind(taskService)}
        updateTaskFn={taskService.updateTask.bind(taskService)}
      />
    </div>
  );
}
